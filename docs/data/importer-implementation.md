# Importer Implementation

## Purpose
Document the first official-data importer skeleton that now exists in code.

## Current Structure
- `lib/importer/types.ts`
  - Explicit normalized importer payload contract.
- `lib/importer/source-adapter.ts`
  - Small source-adapter interface.
- `lib/importer/clients/datafordeler.ts`
  - Minimal Datafordeler GraphQL client with env-var-based auth and timeout handling.
- `lib/importer/adapters/datafordeler-official-adapter.ts`
  - Real Datafordeler-backed adapter using BBR plus DAR.
- `lib/importer/adapters/fixture-adapter.ts`
  - Fixture-backed local adapter for development verification.
- `lib/importer/fixtures/shelter-fixtures.ts`
  - Snapshot datasets for insert, update, and missing-record lifecycle checks.
- `lib/importer/service.ts`
  - Core import-run, match, upsert, lifecycle, and audit logic.
- `scripts/importer/run.ts`
  - Local CLI entry point.

## What The Skeleton Does
1. Creates an `import_runs` row with `running` status.
2. Fetches normalized records from one adapter.
3. Validates canonical source identity uniqueness inside the run.
4. Upserts municipalities by slug.
5. Matches shelters by:
   - `canonical_source_name` + `canonical_source_reference`
   - then a temporary compatibility fallback through `shelter_sources.source_name` + `source_reference`
6. Upserts importer-owned shelter baseline fields only.
7. Writes shelter lifecycle fields:
   - `import_state`
   - `last_seen_at`
   - `last_imported_at`
8. Upserts one `shelter_sources` row per shelter/source identity.
9. Checkpoints BBR paging progress on `app_v2.import_runs` after each successful page.
10. Marks previously known shelters for the same canonical source as `missing_from_source` only when the run completed successfully and passed the missing-transition coverage guard.
11. Finishes the `import_runs` row and writes narrow `audit_events` for:
   - missing records
   - restored records
   - failed runs
   - successful runs with material changes

## Current Real Adapter Subset
The first Datafordeler-backed adapter now imports a narrow official subset:
- BBR fields used now:
  - `id_lokalId`
  - `kommunekode`
  - `husnummer`
  - `byg007Bygningsnummer`
  - `byg021BygningensAnvendelse`
  - `byg069Sikringsrumpladser`
  - `byg404Koordinat.wkt`
- DAR fields used now:
  - `id_lokalId`
  - `navngivenVej` relation id on `DAR_Husnummer`
  - `husnummertekst`
  - `postnummer` relation id on `DAR_Husnummer`
  - `vejnavn` from `DAR_NavngivenVej`
  - `postnr` and `navn` from `DAR_Postnummer`

Current normalization behavior:
- canonical identity:
  - `canonical_source_name = datafordeler-bbr-dar`
  - `canonical_source_reference = BBR_Bygning.id_lokalId`
- eligibility filter:
  - nationwide by default
  - BBR `status = 6` as the primary official inclusion rule
  - `byg069Sikringsrumpladser > 0` as a second hard shelter-defining rule
  - optional municipality narrowing from env only when an operator explicitly wants a smaller run
  - optional BBR usage-code narrowing from env only when an operator explicitly wants a smaller run
  - DAR active-status allowlist, defaulting to `3`
  - explicit skip when no DAR house-number reference or no usable DAR address exists
- municipality:
  - driven by BBR `kommunekode`
  - repo now keeps a bundled municipality metadata map for all Danish municipality codes
  - env can provide explicit `code:slug:name:region` metadata overrides
  - unknown codes still fall back, but now emit one warning per municipality code per run instead of one warning per shelter row
- address:
  - built from `DAR_Husnummer.husnummertekst`
  - plus `DAR_NavngivenVej.vejnavn`
  - plus `DAR_Postnummer.postnr`
  - plus `DAR_Postnummer.navn`
- coordinates:
  - read from `BBR_Bygning.byg404Koordinat.wkt`
  - current live shape is WKT like `POINT (530607.89 6147886.08)`
  - interpreted as ETRS89 / UTM32 (EPSG:25832)
  - converted explicitly to WGS84 latitude/longitude with `proj4`
- current conservative defaults:
  - `capacity = 0`
  - `status = under_review`
  - `accessibility_notes = null`
  - `summary` is a narrow importer-owned compatibility summary

What is now considered validated:
- canonical identity and lifecycle handling work with a real source adapter shape
- BBR and DAR are fetched separately and normalized through one explicit adapter
- the real nationwide business rule is explicit in code: BBR status `6` drives inclusion
- positive `byg069Sikringsrumpladser` is now enforced before a record can enter the normalized importer output
- DAR enrichment now uses a valid three-step path: `DAR_Husnummer`, `DAR_NavngivenVej`, and `DAR_Postnummer`
- live BBR coordinate enrichment is now confirmed and working through `byg404Koordinat.wkt`
- incomplete DAR data no longer fails silently; skipped records are counted and warned
- municipality metadata is now explicit from a bundled national map instead of relying on generated fallback names for ordinary Danish municipality codes
- municipality fallback remains warning-backed for unknown codes, but warning noise is deduplicated per code

What is still provisional:
- region labels are still conservative and may remain `null` until a stronger official region source is introduced
- official capacity and readiness semantics are still deferred

Deferred for later source work:
- shelter-specific official capacity mapping
- shelter-specific readiness/status semantics
- source-side verification timestamps when the official source exposes a trustworthy field for them

## Local Verification
Run the fixture importer with:

```bash
npm run importer:fixture -- baseline
npm run importer:fixture -- follow-up
```

Run the real Datafordeler adapter with:

```bash
npm run importer:datafordeler
npm run importer:datafordeler -- --dry-run
npm run importer:datafordeler -- --dry-run --max-pages 25
npm run importer:datafordeler -- --resume-latest
```

The Datafordeler path is designed for non-interactive execution:
- all configuration is env-var driven
- console output is line-oriented and useful for CI logs
- missing env vars and network/auth failures fail the process with a non-zero exit code
- dry-run fetches and normalizes live data without writing to Supabase
- `--max-pages` gives dry-run validation a small, explicit safety cap for live-source debugging
- `--resume-latest` resumes from the latest failed `app_v2.import_runs` checkpoint for the same source
- Datafordeler requests now retry with bounded backoff on timeout, 429, 5xx, and transient non-JSON upstream responses
- non-JSON responses now log HTTP status, content type, and a short safe body preview instead of failing as opaque parse errors
- `app_v2.import_runs` writes now surface the real PostgREST status and error details instead of collapsing checkpoint failures to a generic message
- checkpoint writes retry bounded transient failures before aborting a long run
- A capped live dry-run can now complete end-to-end with the current DAR query shape
- A capped live dry-run can now complete end-to-end with coordinates included in the normalized output when BBR provides valid WKT
- DAR relation-id `in` queries are now hard-capped at `100` ids per batch because larger lists trigger live Datafordeler `400` failures

## Long-run Safety Rules
- A failed run never applies missing/deactivation transitions.
- A resumed run never applies missing/deactivation transitions. Resume is only for finishing the source scan safely.
- A non-resumed successful run applies `missing_from_source` transitions only when `records_seen >= max(25, ceil(previous_active_count * 0.8))`.
- If that guard blocks missing transitions, the run still succeeds, but the reason is stored on `app_v2.import_runs`.

## DAR Bulk-Enrichment Rule
- Datafordeler DAR `in` filters must stay at or below `100` values per request.
- The importer now uses a hard DAR batch size of `100` for:
  - `DAR_Husnummer`
  - `DAR_NavngivenVej`
  - `DAR_Postnummer`
- This cap is independent from the BBR page size.
- Earlier full-run results that normalized only a few shelters out of thousands of accepted candidates were not credible, because oversized DAR batches caused `400` failures and dropped most accepted records on address enrichment.

## Checkpoint Fields
`app_v2.import_runs` now stores:
- `pages_fetched`
- `last_successful_page`
- `last_successful_cursor`
- `resumed_from_import_run_id`
- `missing_transitions_applied`
- `missing_transitions_skipped_reason`

Checkpoint behavior:
- the importer creates an `app_v2.import_runs` row up front
- after each successful BBR page, it updates `pages_fetched`, `last_successful_page`, and `last_successful_cursor`
- checkpoint writes now use a narrow retry loop for transient Supabase/PostgREST failures
- checkpoint failures now include the operation type, schema/table, status, payload-key summary, and safe error details in the importer output
- `--max-pages` can be used on a real validation run to verify checkpoint writes without attempting a full nationwide import

Expected behavior:
- `baseline`
  - inserts fixture shelters
- `follow-up`
  - updates one existing shelter by canonical identity
  - inserts one new shelter
  - marks one previously imported shelter as `missing_from_source`

## Current Limits
- No scheduling or background worker yet.
- No raw payload storage yet.
- `source_summary` still remains a compatibility field on `shelters`; the importer sets it only for new rows and does not treat it as an importer-owned update field.
- `DATAFORDELER_MUNICIPALITY_CODES` and BBR usage-code env vars are now optional operational narrowing controls, not required business-rule inputs.
- Status `6` alone was too broad for a believable shelter set; positive `byg069Sikringsrumpladser` is now part of the effective inclusion rule.
- The real adapter currently imports only the narrow field subset documented above; it does not claim full BBR/DAR shelter coverage yet.
- The real adapter is suitable for later GitHub Actions execution, but the workflow itself is not implemented yet.
- The earlier long-run checkpoint failure was not a schema mismatch in `app_v2.import_runs`; the write path itself was valid, but one opaque checkpoint-write failure could abort the whole run without exposing the real PostgREST error.
- Before GitHub Actions scheduling is safe, one full real run should complete, checkpoint/resume should be verified at least once, and the missing-transition guard should behave as expected on real `app_v2` counts.

## Next Extension Path
- Extend the Datafordeler adapter with the next verified BBR/DAR shelter field mappings while keeping the same normalized contract.
- Keep all schema writes inside `lib/importer/service.ts` unless importer volume later justifies a split.

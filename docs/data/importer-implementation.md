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
9. Marks previously known shelters for the same canonical source as `missing_from_source` when they are absent from the current run.
10. Finishes the `import_runs` row and writes narrow `audit_events` for:
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
  - `byg404Koordinat`
- DAR fields used now:
  - `id_lokalId`
  - `navngivenVej.navn`
  - `husnummertekst`
  - `postnummer.nr`
  - `postnummer.navn`

Current normalization behavior:
- canonical identity:
  - `canonical_source_name = datafordeler-bbr-dar`
  - `canonical_source_reference = BBR_Bygning.id_lokalId`
- eligibility filter:
  - nationwide by default
  - BBR `status = 6` as the primary official inclusion rule
  - optional municipality narrowing from env only when an operator explicitly wants a smaller run
  - optional BBR usage-code narrowing from env only when an operator explicitly wants a smaller run
  - DAR active-status allowlist, defaulting to `3`
  - explicit skip when no DAR house-number reference or no usable DAR address exists
- municipality:
  - driven by BBR `kommunekode`
  - env can provide explicit `code:slug:name:region` metadata overrides
  - repo keeps a small bundled default for current seeded municipalities
  - unknown codes still fall back, but now emit warnings
- address:
  - built from DAR road name, house-number text, postal code, and postal district
- coordinates:
  - imported from BBR `byg404Koordinat`
  - converted from ETRS89 / UTM32 to WGS84
- current conservative defaults:
  - `capacity = 0`
  - `status = under_review`
  - `accessibility_notes = null`
  - `summary` is a narrow importer-owned compatibility summary

What is now considered validated:
- canonical identity and lifecycle handling work with a real source adapter shape
- BBR and DAR are fetched separately and normalized through one explicit adapter
- the real nationwide business rule is explicit in code: BBR status `6` drives inclusion
- incomplete DAR data no longer fails silently; skipped records are counted and warned
- municipality fallback is explicit and warning-backed instead of being silently invented

What is still provisional:
- municipality metadata should eventually be fully sourced instead of relying on local overrides/fallbacks
- official capacity and readiness semantics are still deferred

Deferred for later source work:
- shelter-specific official capacity mapping
- shelter-specific readiness/status semantics
- richer municipality metadata coverage
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
```

The Datafordeler path is designed for non-interactive execution:
- all configuration is env-var driven
- console output is line-oriented and useful for CI logs
- missing env vars and network/auth failures fail the process with a non-zero exit code
- dry-run fetches and normalizes live data without writing to Supabase

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
- The real adapter currently imports only the narrow field subset documented above; it does not claim full BBR/DAR shelter coverage yet.
- The real adapter is suitable for later GitHub Actions execution, but the workflow itself is not implemented yet.

## Next Extension Path
- Extend the Datafordeler adapter with the next verified BBR/DAR shelter field mappings while keeping the same normalized contract.
- Keep all schema writes inside `lib/importer/service.ts` unless importer volume later justifies a split.

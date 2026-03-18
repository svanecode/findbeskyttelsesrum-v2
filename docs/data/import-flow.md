# Import Flow

## Purpose
Track how official baseline data enters the system, how admin corrections stay separate, and how the public app reads effective values.

## Schema Boundary
- Legacy `public` tables remain untouched and are not the target for v2 migration work.
- The new v2 importer and app data model now live in `app_v2`.

## Current Flow
1. Create an `app_v2.import_runs` row for each official ingestion execution.
2. Upsert municipality baseline data into `app_v2.municipalities`.
3. Upsert importer-owned shelter baseline fields into `app_v2.shelters`.
4. Upsert official provenance and freshness rows in `app_v2.shelter_sources`.
5. Keep manual operational changes in `app_v2.shelter_overrides`.
6. Compute effective public values at read time from override-first precedence.
7. Record notable operational actions in `app_v2.audit_events`.

## Current Skeleton Implementation
- The first importer skeleton now lives in `lib/importer`.
- Local development runs use the fixture adapter in `lib/importer/adapters/fixture-adapter.ts`.
- The first real official adapter now lives in `lib/importer/adapters/datafordeler-official-adapter.ts`.
- Importer writes now target `app_v2`, not legacy `public`.
- The app now assumes `app_v2` may start sparse or partially populated and uses fallback public copy when imported summaries or source summaries are still blank.
- `app_v2.municipalities` now carries municipality code as the importer identity anchor for canonical municipality convergence.
- The default Datafordeler scope is now nationwide; BBR `status = 6` is the primary official inclusion rule.
- BBR `status = 6` alone was too broad in live validation, so positive `byg069Sikringsrumpladser` is now also required before a record is accepted into the normalized importer output.
- Municipality metadata now comes from a bundled Denmark-wide municipality map keyed by BBR `kommunekode`, with env overrides still able to replace individual entries when needed.
- Municipality fallback warnings are now deduplicated to one warning per unknown municipality code per run instead of one warning per accepted shelter row.
- DAR enrichment now uses a valid three-step lookup: `DAR_Husnummer` for relation ids and house-number text, then `DAR_NavngivenVej` and `DAR_Postnummer` for road name and postal metadata.
- DAR relation-id lookups are now hard-capped at `100` ids per `in` query because larger live Datafordeler lists can fail with `400 Bad Request`.
- BBR coordinates now use the confirmed live field shape `byg404Koordinat.wkt` and are converted from EPSG:25832 WKT points into WGS84 latitude/longitude.
- Optional municipality and usage-code env vars can still narrow a run for debugging or phased validation, but they are no longer required for normal execution.
- `app_v2.import_runs` checkpoint writes now retry bounded transient failures and surface the real PostgREST status/details when they fail.
- `app_v2.import_runs` now also receives apply-phase progress updates after normalization so interrupted long runs do not stay opaque.
- Apply-phase logs now call out fetch completion, baseline-upsert start, periodic processed-record progress, missing handling, and finalization so a long real run does not appear to hang silently after normalization.
- Apply-phase shelter matching now preloads existing shelters once per canonical source and caches municipality convergence by municipality code for the duration of the run.
- CLI entry points:
  - `npm run importer:fixture -- <snapshot>`
  - `npm run importer:datafordeler`
  - `npm run importer:datafordeler -- --dry-run`
  - `npm run importer:datafordeler -- --dry-run --max-pages 25`
  - `npm run importer:datafordeler -- --max-pages 25`
  - `npm run importer:datafordeler -- --resume-latest`
- The skeleton currently proves:
  - canonical source identity matching
  - importer-owned field upserts
  - `missing_from_source` lifecycle handling
  - import run logging
  - narrow audit event creation
  - env-var-driven non-interactive execution for later GitHub Actions use
  - dry-run validation of live-source fetch and normalization without Supabase writes
  - a capped live dry-run can now complete end-to-end with the current DAR query shape
  - a capped live dry-run can now complete end-to-end with coordinates included when BBR returns valid WKT
  - a capped real run can now validate checkpoint writes against `app_v2.import_runs` without attempting a full nationwide pass
  - long-running real runs can now checkpoint and resume from the last successful BBR page
  - interrupted runs can now be marked failed on `SIGINT`/`SIGTERM` with the last known progress snapshot

## Required Future Flow
1. Match by canonical official source identity first.
2. Update only importer-owned fields.
3. Never overwrite admin-only enrichment or override rows.
4. Mark records missing from source through lifecycle state, not hard delete.
5. Restore prior records when the official identity reappears.
6. Update `last_seen_at` and `last_imported_at` explicitly from importer-controlled lifecycle logic.

## Guardrails
- Preserve a clear line between imported data and manual decisions.
- Avoid mutating historical import metadata in place when an audit entry is more appropriate.
- Keep the public shelter record easy to read from the app without joining raw import payloads.
- Do not modify the legacy `public` schema as part of v2 importer work.
- Shared app reads should move toward `app_v2` explicitly instead of relying on implicit default-schema behavior.
- Treat `shelter_reports` as inbound operational feedback only, not as the primary product data path and not as an immediate mutation path for shelter data.
- Moderation status changes can be audited without mutating the underlying shelter record directly.
- Manual overrides should update only the separate override record; imported shelter values remain traceable and unchanged.
- The full gatherer contract lives in `docs/data/import-contract.md`.
- The current skeleton implementation is documented in `docs/data/importer-implementation.md`.
- Missing/deactivation logic must only run after a fully successful non-resumed import with adequate coverage relative to the previous active shelter count.
- Non-JSON Datafordeler responses should be treated as operational upstream failures with bounded retries and useful diagnostics, not as generic parse errors.
- Oversized DAR relation-id batches can make a run look superficially successful while normalizing almost no shelters; batch-size limits are therefore part of importer correctness, not just performance tuning.
- A single transient checkpoint-write failure should not stay opaque; `app_v2.import_runs` writes must emit the real table/operation/status context and retry bounded transient failures before the run aborts.
- Municipality writes must converge on one canonical row per municipality code instead of allowing canonical and fallback municipality rows to coexist indefinitely.
- Real validation imports should run one at a time; overlapping real runs against the same `app_v2` shelter set can create row-level contention that looks like an apply-phase stall.

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
- CLI entry points:
  - `npm run importer:fixture -- <snapshot>`
  - `npm run importer:datafordeler`
  - `npm run importer:datafordeler -- --dry-run`
- The skeleton currently proves:
  - canonical source identity matching
  - importer-owned field upserts
  - `missing_from_source` lifecycle handling
  - import run logging
  - narrow audit event creation
  - env-var-driven non-interactive execution for later GitHub Actions use
  - dry-run validation of live-source fetch and normalization without Supabase writes

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

# Import Flow

## Purpose
Track how official baseline data enters the system, how admin corrections stay separate, and how the public app reads effective values.

## Current Flow
1. Create an `import_runs` row for each official ingestion execution.
2. Upsert municipality baseline data.
3. Upsert importer-owned shelter baseline fields into `shelters`.
4. Upsert official provenance and freshness rows in `shelter_sources`.
5. Keep manual operational changes in `shelter_overrides`.
6. Compute effective public values at read time from override-first precedence.
7. Record notable operational actions in `audit_events`.

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
- Treat `shelter_reports` as inbound operational feedback only, not as the primary product data path and not as an immediate mutation path for shelter data.
- Moderation status changes can be audited without mutating the underlying shelter record directly.
- Manual overrides should update only the separate override record; imported shelter values remain traceable and unchanged.
- The full gatherer contract lives in `docs/data/import-contract.md`.

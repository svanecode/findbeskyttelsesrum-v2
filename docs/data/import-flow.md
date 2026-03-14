# Import Flow

## Purpose
Track where shelter data came from, when it was imported, and when a manual override changed the effective public shelter view.

## First-Pass Flow
1. Create an `import_runs` row for each ingestion execution.
2. Upsert municipality and shelter source metadata as needed.
3. Upsert public shelter records into `shelters`.
4. Store provenance in `shelter_sources`.
5. Keep manual operational changes in `shelter_status_overrides`.
6. Record notable actions in `audit_events`.

## Guardrails
- Preserve a clear line between imported data and manual decisions.
- Avoid mutating historical import metadata in place when an audit entry is more appropriate.
- Keep the public shelter record easy to read from the app without joining raw import payloads.
- Treat `shelter_reports` as inbound public feedback for later review, not as an immediate mutation path for shelter data.
- Moderation status changes can be audited without mutating the underlying shelter record directly.
- Manual overrides should update only the separate override record; imported shelter values remain traceable and unchanged.

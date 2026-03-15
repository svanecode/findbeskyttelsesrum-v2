# Data Schema

## Core Tables
- `municipalities`
  - Public municipality records used for routing and grouping.
- `shelters`
  - Public shelter records shown to end users.
- `shelter_sources`
  - Source metadata for each shelter record, including provenance and freshness.
- `import_runs`
  - Import job bookkeeping for raw ingestion events.
- `shelter_reports`
  - Public feedback reports about data quality issues. Still operationally available, but no longer the primary long-term product direction.
- `shelter_overrides`
  - Manual operational overrides stored separately from imports. The first version holds one active shelter-level override record with a narrow set of public fields.
- `audit_events`
  - Append-only operational audit trail.

## Modeling Rules
- `shelters` is the public read model and should stay readable and stable.
- `shelters` currently acts as the imported baseline plus a small amount of public/admin-facing content.
- `shelters.import_state`, `last_seen_at`, `last_imported_at`, `canonical_source_name`, and `canonical_source_reference` exist to support importer lifecycle and stable official matching.
- Import-specific details should not leak into the public shelter record unless needed for product features.
- Manual overrides must remain separate from imported source data.
- Public shelter detail reads use active override values first, then imported values.
- Use slugs for municipality and shelter routes.

## Near-Term Query Paths
- Featured shelter list for the homepage.
- Shelter lookup by slug, limited to `shelters.import_state = 'active'`.
- Municipality lookup by slug with shelter list.
- Shelter source list by shelter id.
- `/find` free-text search across shelter name, address, city, and postcode with optional municipality narrowing.
- `/find` coordinate search uses `shelters.latitude` and `shelters.longitude`, sorts by distance in the app layer, and still applies active shelter overrides before rendering public results.
- Shelter detail trust fields derived from `shelter_sources` include primary source, verification date, import timestamp, and optional public notes.
- Municipality landing-page cards derive primary source and quality state from related `shelter_sources` rows for each public shelter.
- Admin override editing reads one shelter plus its active override record and writes only to `shelter_overrides`.
- Field ownership and future importer rules are defined in:
  - `docs/data/field-ownership.md`
  - `docs/data/import-model.md`
  - `docs/data/import-contract.md`

## First Migration Notes
- Public read policies exist for `municipalities`, `shelters`, and `shelter_sources`.
- `import_runs`, `shelter_reports`, `shelter_overrides`, and `audit_events` have RLS enabled with no public policies yet.

## Reporting Notes
- Public reporting writes should go through a server-side validation path, not direct client access.
- Public reporting is now an operational side-channel, not the core product direction.
- Current public report types are `incorrect_address`, `unavailable`, `incorrect_capacity`, `duplicate_record`, and `other`.
- Current moderation statuses are `open`, `reviewing`, `resolved`, and `rejected`.
- Admin moderation access is authorization-driven at the application layer and currently uses an allowlist of Supabase Auth email addresses.
- First-version override fields are `name`, `address_line1`, `postal_code`, `city`, `capacity`, `status`, `accessibility_notes`, and `summary`.

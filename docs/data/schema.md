# Data Schema

## Core Tables
- `app_v2.municipalities`
  - Public municipality records used for routing and grouping.
  - Runtime reads now canonicalize legacy fallback rows like `kommune-0175` / `Municipality 0175` through a bundled municipality metadata map so the current imported dataset can render real names and route slugs before the next import refresh.
- `app_v2.shelters`
  - Public shelter records shown to end users.
- `app_v2.shelter_sources`
  - Source metadata for each shelter record, including provenance and freshness.
- `app_v2.import_runs`
  - Import job bookkeeping for raw ingestion events.
- `app_v2.shelter_reports`
  - Public feedback reports about data quality issues. Still operationally available, but no longer the primary long-term product direction.
- `app_v2.shelter_overrides`
  - Manual operational overrides stored separately from imports. The first version holds one active shelter-level override record with a narrow set of public fields.
- `app_v2.audit_events`
  - Append-only operational audit trail.

## Schema Boundary
- The live legacy schema in `public` remains read-only for v2 work.
- The new v2 database foundation now lives in `app_v2`.
- New importer and shared query work now target `app_v2`, not the legacy `public` tables.
- Full browser/server runtime success requires `app_v2` to be added to the project’s exposed API schemas in Supabase.
- Current public server-rendered reads can still validate against `app_v2` when `NEXT_PUBLIC_SUPABASE_ANON_KEY` is temporarily missing, because the shared server query layer falls back to the server-only admin client. Browser auth and browser-side Supabase usage still require a real public key.

## Modeling Rules
- `app_v2.shelters` is the v2 public read baseline and should stay readable and stable.
- `app_v2.shelters` currently acts as the imported baseline plus a small amount of public/admin-facing content.
- `app_v2.shelters.import_state`, `last_seen_at`, `last_imported_at`, `canonical_source_name`, and `canonical_source_reference` exist to support importer lifecycle and stable official matching.
- Import-specific details should not leak into the public shelter record unless needed for product features.
- Manual overrides must remain separate from imported source data.
- Public shelter detail reads use active override values first, then imported values.
- Use slugs for municipality and shelter routes.

## Near-Term Query Paths
- Featured shelter list for the homepage.
- Shelter lookup by slug, limited to `app_v2.shelters.import_state = 'active'`.
- Municipality lookup by slug with shelter list.
- Shelter source list by shelter id.
- `/find` free-text search across shelter name, address, city, and postcode with optional municipality narrowing.
- `/find` coordinate search uses `app_v2.shelters.latitude` and `app_v2.shelters.longitude`, sorts by distance in the app layer, and still applies active shelter overrides before rendering public results.
- Typed-address search geocodes the query first; when it resolves to coordinates, `/find` uses the coordinate search path against `app_v2.shelters` instead of falling back to an empty public-client state.
- Municipality reads now resolve both canonical slugs and legacy fallback slugs, so routes like `/kommune/rodovre` keep working even when the current stored municipality slug still reflects an older generated fallback.
- Shelter detail trust fields derived from `app_v2.shelter_sources` include primary source, verification date, import timestamp, and optional public notes.
- Municipality landing-page cards derive primary source and quality state from related `app_v2.shelter_sources` rows for each public shelter.
- Shared public reads now normalize sparse imported text safely: if `summary` or `source_summary` is blank, the query layer returns an explicit fallback string instead of rendering an empty section in the app.
- Admin override editing reads one shelter plus its active override record and writes only to `app_v2.shelter_overrides`.
- Public reporting writes now target `app_v2.shelter_reports`.
- Importer writes now target `app_v2.import_runs`, `app_v2.municipalities`, `app_v2.shelters`, `app_v2.shelter_sources`, and `app_v2.audit_events`.
- Field ownership and future importer rules are defined in:
  - `docs/data/field-ownership.md`
  - `docs/data/import-model.md`
  - `docs/data/import-contract.md`

## App V2 Foundation Notes
- Public read policies exist for `app_v2.municipalities`, `app_v2.shelters`, and `app_v2.shelter_sources`.
- `app_v2.import_runs`, `app_v2.shelter_reports`, `app_v2.shelter_overrides`, and `app_v2.audit_events` have RLS enabled with no public policies yet.
- The legacy `public` schema remains outside the v2 migration path.
- The app code now uses explicit `app_v2` schema clients rather than relying on the default PostgREST schema.

## Reporting Notes
- Public reporting writes should go through a server-side validation path, not direct client access.
- Public reporting is now an operational side-channel, not the core product direction.
- Current public report types are `incorrect_address`, `unavailable`, `incorrect_capacity`, `duplicate_record`, and `other`.
- Current moderation statuses are `open`, `reviewing`, `resolved`, and `rejected`.
- Admin moderation access is authorization-driven at the application layer and currently uses an allowlist of Supabase Auth email addresses.
- First-version override fields are `name`, `address_line1`, `postal_code`, `city`, `capacity`, `status`, `accessibility_notes`, and `summary`.

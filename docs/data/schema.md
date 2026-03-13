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
  - Public feedback reports about data quality issues.
- `shelter_status_overrides`
  - Manual operational overrides stored separately from imports.
- `audit_events`
  - Append-only operational audit trail.

## Modeling Rules
- `shelters` is the public read model and should stay readable and stable.
- Import-specific details should not leak into the public shelter record unless needed for product features.
- Manual overrides must remain separate from imported source data.
- Use slugs for municipality and shelter routes.

## Near-Term Query Paths
- Featured shelter list for the homepage.
- Shelter lookup by slug.
- Municipality lookup by slug with shelter list.
- Shelter source list by shelter id.

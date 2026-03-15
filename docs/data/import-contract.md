# Import Contract

## Purpose
Define the exact contract the future official-data gatherer must write into Supabase.

## Source Assumption
- Primary official source stack:
  - BBR GraphQL through Datafordeler
  - DAR GraphQL through Datafordeler
- DAWA remains a public geocoding/search aid, not the shelter baseline source of truth.

## Importer Responsibilities
- Read official shelter-like source records.
- Resolve each official record to a stable external source identity.
- Normalize official address, municipality, coordinates, and trust metadata.
- Upsert importer-owned baseline fields only.
- Never overwrite admin enrichment or active admin override values.
- Record import-run and source-row history clearly enough to debug changes and deletions.

## Required Import Output

### 1. Import Run Row
For every gatherer execution, create one `import_runs` row with at least:
- `source_name`
  - Specific gatherer name, for example `datafordeler-bbr-dar`.
- `source_url`
  - Human-readable source reference or documentation URL.
- `status`
  - `running`, then `succeeded` or `failed`.
- `records_seen`
  - Number of official records examined.
- `records_upserted`
  - Number of shelter baseline records inserted or changed.
- `started_at`
- `finished_at`
- `error_summary`
  - Only on failure or partial failure.

### 2. Municipality Baseline
Importer must ensure municipality records exist before shelter upserts:
- `slug`
- `name`
- `region_name`

Importer must not write:
- `municipalities.description`

### 3. Shelter Baseline
For each official shelter record, importer must output:
- stable external source identifier
- normalized shelter slug
- `municipality_id`
- official name
- official address fields:
  - `address_line1`
  - `postal_code`
  - `city`
- official coordinates:
  - `latitude`
  - `longitude`
- official/publicly defensible operational fields if available:
  - `capacity`
  - `status`
  - `accessibility_notes`
  - `summary`
- trust/display baseline fields if they remain on the shelter row:
  - `source_summary` only if the schema keeps that field in the shelter baseline

Importer must not write:
- `is_featured`
- `featured_rank`
- override rows
- admin-only editorial municipality copy

### 4. Source Row Output
For each official source record connected to a shelter, importer must upsert a `shelter_sources` row containing:
- `shelter_id`
- `import_run_id`
- `source_name`
- `source_type`
  - normally `official`
- `source_url`
- `source_reference`
  - stable official external id
- `last_verified_at`
  - official source timestamp if available
- `imported_at`
  - current import timestamp
- optional machine-readable/public-safe note only if truly needed

## Source Identifiers
The gatherer must treat official source identifiers as the canonical identity for imported shelter baselines.

Recommended rule:
- `shelter_sources.source_reference` stores the stable official external id.
- The importer matches existing shelters through official source identity first, never by free-text address only.

If the current schema stays minimal, the importer may:
- look up existing shelter by active `shelter_sources` reference
- then update the linked `shelters` row

Recommended later schema improvement:
- add a dedicated canonical import identity field on `shelters` or a dedicated source-link table
- avoid relying on `slug` as the matching key

## Write Ownership Rules

### Importer Owns
- `municipalities.slug`
- `municipalities.name`
- `municipalities.region_name`
- shelter baseline location and official descriptive fields on `shelters`
- `shelter_sources.*` official source metadata
- `import_runs.*`

### Importer Must Never Overwrite
- `municipalities.description`
- `shelters.is_featured`
- `shelters.featured_rank`
- any row in `shelter_overrides`
- audit history
- admin auth / moderation data

### Importer May Update On Every Run
- imported baseline shelter fields, even if an active override exists
- source freshness metadata
- municipality linkage
- coordinates

Reason:
- overrides are a read-time precedence layer, not a blocker on baseline refresh

## Change Detection Rules

### Unchanged Record
If official values are unchanged:
- keep the shelter row as-is
- still record that the official record was seen in the current import run
- refresh `shelter_sources.imported_at`
- do not create noisy audit events by default

### Changed Record
If importer-owned shelter fields changed:
- update only importer-owned baseline fields on `shelters`
- refresh related `shelter_sources`
- increment `records_upserted`
- optionally create a structured importer audit event only for meaningful field changes

### New Record
If no shelter exists for the official source identity:
- create municipality if needed
- create shelter baseline row
- create source row

### Missing Record
If a previously imported official record is not seen in the latest run:
- do not hard-delete immediately
- mark the shelter baseline as no longer current through a dedicated lifecycle field in a future schema change
- keep override and audit history intact

## Deletion And Restore Contract

### When Official Record Disappears
Target behavior for the future importer:
- set `import_state = 'missing_from_source'`
- keep `last_seen_at` as the timestamp from the last successful run where the official record was present
- public app should not treat the record as fully deleted automatically
- public app behavior should either:
  - hide fully missing records from discovery pages
  - or show them as inactive only if product explicitly chooses that path

Current schema gap:
- there is no clean lifecycle field yet, so disappearance handling is underspecified

### When Official Record Reappears
- match by official source identity
- restore the baseline row instead of creating a new public shelter record when possible
- keep previous overrides attached to the same shelter id

### Hard Delete
- avoid hard delete in the importer
- only use hard delete for clearly invalid test data or explicit maintenance actions

## Effective Public Read Rules
- If an active override exists for an override-supported field, public reads use the override value.
- Otherwise public reads use the imported baseline value from `shelters`.
- Trust/freshness fields come from `shelter_sources`, not from shelter overrides.
- Editorial/admin-only enrichment fields remain separate from importer-owned baseline fields.

## Freshness Rules
- `import_runs.started_at` / `finished_at`
  - lifecycle of one gatherer execution
- `shelter_sources.imported_at`
  - when this source row was last written by the importer
- `shelter_sources.last_verified_at`
  - official source-side freshness or verification timestamp
- `shelters.last_seen_at`
  - when the official record was last present in a successful import

## Audit Rules
Create `audit_events` for:
- import run failed
- import run succeeded with material changes
- importer marked a shelter record missing from source
- importer restored a previously missing shelter record

Do not create `audit_events` for:
- every unchanged shelter touched in a normal successful run

## Minimum Future Schema Support Needed
- `shelters.import_state`
- `shelters.last_seen_at`
- `shelters.last_imported_at`
- `shelters.canonical_source_name`
- `shelters.canonical_source_reference`
- `shelter_overrides`

The gatherer implementation should follow this contract even if some parts require a small schema evolution first.

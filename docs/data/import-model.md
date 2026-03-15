# Import Model

## Goal
Establish the long-term v2 data model before building the new official-data gatherer.

The intended stack is:
1. official imported baseline data
2. internal admin overrides and enrichment
3. effective public values computed at read time

## Current Repo Audit

### What Is Already Clear
- `shelters` currently behaves as the public baseline shelter record.
- `shelter_sources` already holds source provenance and freshness metadata.
- `import_runs` already exists for importer bookkeeping.
- `shelter_overrides` is already used as the manual correction layer for public reads.
- Query logic already applies active override precedence for:
  - shelter detail
  - search results
  - admin override review

### What Is Currently Leaky
- `shelters` mixes:
  - importer-owned baseline fields
  - public-facing fields
  - editorial/admin-only fields
- `source_summary` is stored on `shelters`, but conceptually it behaves more like public trust copy than official baseline data.
- lifecycle state is now modeled on `shelters`, but importer behavior against it still needs to be implemented.
- public reports still exist operationally, but they are no longer the core product direction.

## Target Model

### Layer 1: Official Imported Baseline
Tables:
- `municipalities`
- `shelters`
- `shelter_sources`
- `import_runs`

Responsibility:
- store the latest normalized official shelter baseline
- preserve official provenance and freshness
- remain writable by the importer only for importer-owned fields

### Layer 2: Internal Admin Corrections And Enrichment
Tables:
- `shelter_overrides`
- admin-only enrichment fields currently living on `shelters` / `municipalities`
- `audit_events`

Responsibility:
- apply operational corrections without mutating official import history
- add editorial fields that have no official source equivalent
- preserve who changed what and why

### Layer 3: Effective Public Read Model
Current implementation:
- assembled in `lib/supabase/queries.ts`

Responsibility:
- compute public values by precedence
- keep trust fields source-derived
- keep admin overrides separate from the official baseline

## Exact Precedence Rules

### Override-Supported Public Fields
For these fields:
- `name`
- `address_line1`
- `postal_code`
- `city`
- `capacity`
- `status`
- `accessibility_notes`
- `summary`

Read rule:
1. if active override field value exists, use it
2. else use imported shelter baseline field

### Purely Imported Public Fields
For these fields:
- `latitude`
- `longitude`
- municipality linkage
- source freshness timestamps
- source reference / provenance

Read rule:
1. use imported/source-derived value only

### Admin-Only Enrichment Fields
Current examples:
- `municipalities.description`
- `shelters.is_featured`
- `shelters.featured_rank`

Read rule:
1. use admin-owned value directly
2. importer must never touch these fields

## Deletion And Restore Rules

### Missing From Official Source
The future importer should not hard-delete a shelter when the official record disappears.

Required behavior:
- mark the shelter as missing from source through an importer-owned lifecycle field
- preserve source history, overrides, and audit history
- allow the public app to hide or de-emphasize the record by explicit rule

### Reappears Later
- restore the same shelter baseline if the official identity matches
- keep existing overrides attached
- record the restore in audit history if the row was previously marked missing

### Override Interaction
- overrides remain stored even if the official record disappears
- inactive/missing official records should not silently erase override history
- if the record returns, existing overrides may apply again unless intentionally cleared

## Freshness Model

### Importer Metadata
- import run start / finish
- records seen / changed
- import errors

### Shelter Baseline Freshness
Tracked on `shelters`:
- `last_seen_at` on `shelters`
- lifecycle field such as `import_state`
- `last_imported_at` for shelter-level importer freshness

### Public Trust Freshness
- `shelter_sources.last_verified_at`
- `shelter_sources.imported_at`

Public trust copy should not imply more certainty than the source metadata actually supports.

## Minimum Recommended Schema Changes

### 1. Add Import Lifecycle Fields To `shelters`
Implemented fields:
- `import_state`
  - values: `active`, `missing_from_source`, `suppressed`
- `last_seen_at`
- `last_imported_at`

Reason:
- current schema cannot model disappearance/reappearance cleanly

### 2. Clarify Canonical Official Identity
Implemented minimum improvement:
- `canonical_source_name`
- `canonical_source_reference`

Reason:
- matching only through `shelter_sources` is workable but fragile if source-row handling evolves

### 3. Rename `shelter_status_overrides`
Implemented:
- `shelter_status_overrides` has been renamed to `shelter_overrides`

Reason:
- current table is no longer status-only
- the existing name will keep causing implementation mistakes

### 4. Move Or Reframe `source_summary`
Recommended direction:
- treat `source_summary` as public trust copy, not as importer-owned shelter baseline

Options:
- keep it temporarily but mark it admin-owned
- or move it later to a clearer trust/enrichment surface

## Biggest Current Risks
- Importer and admin tooling could both treat `shelters.summary` and `source_summary` as writable public copy without a documented ownership rule.
- `source_summary` still sits on `shelters`, so importer and admin tooling need the documented ownership rule until a later cleanup moves or reframes it.
- Public reports still exist in the schema and product, but they no longer align with the long-term official-source-driven direction.

## Next Implementation Task
The next Codex task after this spec should be:

`Implement the first official-data gatherer skeleton against this import spec, including the minimum schema evolution for shelter lifecycle fields and canonical official source identity, but without yet building full source coverage or background scheduling.`

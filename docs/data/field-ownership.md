# Field Ownership

## Purpose
Define who owns each shelter field in v2 so the new official-data gatherer, admin tooling, and public read layer do not overwrite each other.

## Ownership Types
- `official import owned`
  - Written by the official importer from BBR, DAR, or other approved official sources.
- `admin override owned`
  - Official baseline exists, but admins may set an explicit replacement value.
- `admin-only enrichment`
  - No official baseline is required. Value exists only because internal admins add it.
- `derived/effective`
  - Computed by read logic from import rows, override rows, or related source metadata.
- `internal operational`
  - Used for import bookkeeping, moderation, audit, routing stability, or internal state.

## Shelter Matrix
| Field | Purpose | Owner | Source of truth | Importer may write | Admin may override | Public | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `shelters.id` | Stable internal shelter id | internal operational | `shelters.id` | no | no | no | App-wide primary key. Must stay stable across reimports. |
| `shelters.slug` | Public route id | internal operational | `shelters.slug` | yes | no | yes | Importer owns canonical slug generation. Admins should not edit slugs in v1 importer model. |
| `shelters.municipality_id` | Municipality linkage | official import owned | `shelters.municipality_id` | yes | no | indirectly | Derived from official address/municipality source mapping. |
| `shelters.name` | Official shelter name | admin override owned | import baseline + active override | yes | yes | yes | Public read uses active override first, else imported name. |
| `shelters.address_line1` | Official address line | admin override owned | import baseline + active override | yes | yes | yes | Importer writes normalized official address string. |
| `shelters.postal_code` | Official postal code | admin override owned | import baseline + active override | yes | yes | yes | Override allowed for operational correction. |
| `shelters.city` | Official city/post town | admin override owned | import baseline + active override | yes | yes | yes | Override allowed for operational correction. |
| `shelters.latitude` | Official coordinates | official import owned | `shelters.latitude` | yes | no | yes | Importer should prefer official address coordinates. No admin override in first pass. |
| `shelters.longitude` | Official coordinates | official import owned | `shelters.longitude` | yes | no | yes | Same rule as `latitude`. |
| `shelters.capacity` | Official capacity | admin override owned | import baseline + active override | yes | yes | yes | Public read uses active override first. |
| `shelters.status` | Operational public availability state | admin override owned | import baseline + active override | yes | yes | yes | Import baseline may infer status from official source. Admin override remains the last operational correction layer. |
| `shelters.accessibility_notes` | Public accessibility context | admin override owned | import baseline + active override | yes, if official source supports it | yes | yes | If official sources do not provide this yet, value stays null until later source support or override. |
| `shelters.summary` | Short public summary | admin override owned | import baseline + active override | yes | yes | yes | Importer may write an official/source-backed summary. Admin may replace when official text is poor or missing. |
| `shelters.source_summary` | Public explanation of provenance | admin-only enrichment now, likely derived later | current `shelters.source_summary` | no in target model | no direct field override | yes | Current field is leaky. Recommended future model is derived trust copy, not importer-owned shelter content. |
| `shelters.is_featured` | Homepage/manual curation flag | admin-only enrichment | `shelters.is_featured` | no | not via override table | yes | Editorial/internal control only. |
| `shelters.featured_rank` | Homepage ordering | admin-only enrichment | `shelters.featured_rank` | no | not via override table | yes | Editorial/internal control only. |
| `shelters.import_state` | Import lifecycle state | official import owned | `shelters.import_state` | yes | no | indirectly | `active`, `missing_from_source`, or `suppressed`. Public discovery should read only `active` rows by default. |
| `shelters.last_seen_at` | Last successful run where source record was present | official import owned | `shelters.last_seen_at` | yes | no | no | Updated when the canonical official record is observed in a successful import. |
| `shelters.last_imported_at` | Last shelter baseline refresh time | official import owned | `shelters.last_imported_at` | yes | no | partly | Shelter-level importer freshness helper. Not the same as source verification. |
| `shelters.canonical_source_name` | Canonical official source namespace | official import owned | `shelters.canonical_source_name` | yes | no | no | Used with `canonical_source_reference` for stable importer matching. |
| `shelters.canonical_source_reference` | Canonical official source id | official import owned | `shelters.canonical_source_reference` | yes | no | no | Stable gatherer matching key. Must not depend on slug. |
| `shelters.created_at` | Row creation timestamp | internal operational | `shelters.created_at` | no | no | no | Database-managed. |
| `shelters.updated_at` | Last shelter row mutation | internal operational | `shelters.updated_at` | no direct value write | no | no | Trigger-managed. Not a public trust timestamp. |

## Municipality Matrix
| Field | Purpose | Owner | Source of truth | Importer may write | Admin may override | Public | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `municipalities.slug` | Public municipality route id | internal operational | `municipalities.slug` | yes | no | yes | Importer may create/update canonical slugs from official municipality names. |
| `municipalities.name` | Municipality display name | official import owned | `municipalities.name` | yes | no | yes | Official municipality naming should stay importer-owned. |
| `municipalities.description` | Landing-page intro text | admin-only enrichment | `municipalities.description` | no | not via shelter override table | yes | Current page uses this as public copy. Should remain internal editorial content. |
| `municipalities.region_name` | Region label | official import owned | `municipalities.region_name` | yes | no | not currently | Official geography metadata. |

## Source and Trust Matrix
| Field | Purpose | Owner | Source of truth | Importer may write | Admin may override | Public | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `shelter_sources.source_name` | Source label | official import owned | `shelter_sources` | yes | no | yes | Should identify BBR, DAR, municipality feed, etc. |
| `shelter_sources.source_type` | Source classification | internal operational | `shelter_sources.source_type` | yes | no | yes | Importer assigns type from approved source set. |
| `shelter_sources.source_url` | Public source link | official import owned | `shelter_sources.source_url` | yes | no | yes | Use public official source URL where possible. |
| `shelter_sources.source_reference` | Official external identifier | official import owned | `shelter_sources.source_reference` | yes | no | yes | Store source-specific record id/reference. |
| `shelter_sources.last_verified_at` | Source-level official freshness | official import owned | `shelter_sources.last_verified_at` | yes | no | yes | Should mean when the official source says the underlying data was last valid/changed, not import time. |
| `shelter_sources.imported_at` | Source row import timestamp | internal operational | `shelter_sources.imported_at` | yes | no | partly | Useful for public trust copy, but primarily import metadata. |
| `shelter_sources.notes` | Source-specific note | admin-only enrichment now, use sparingly | `shelter_sources.notes` | no in target model | no | yes | Current public notes come from here. Keep limited until a clearer public note model exists. |

## Override Matrix
| Field | Purpose | Owner | Source of truth | Importer may write | Admin may override | Public | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `shelter_overrides.name` | Manual replacement for name | admin override owned | active override row | no | yes | yes | Takes precedence over imported `shelters.name`. |
| `shelter_overrides.address_line1` | Manual replacement for address | admin override owned | active override row | no | yes | yes | Takes precedence over imported `address_line1`. |
| `shelter_overrides.postal_code` | Manual replacement for postal code | admin override owned | active override row | no | yes | yes | Takes precedence when active. |
| `shelter_overrides.city` | Manual replacement for city | admin override owned | active override row | no | yes | yes | Takes precedence when active. |
| `shelter_overrides.capacity` | Manual replacement for capacity | admin override owned | active override row | no | yes | yes | Takes precedence when active. |
| `shelter_overrides.status` | Manual replacement for status | admin override owned | active override row | no | yes | yes | Takes precedence when active. |
| `shelter_overrides.accessibility_notes` | Manual replacement for accessibility notes | admin override owned | active override row | no | yes | yes | Takes precedence when active. |
| `shelter_overrides.summary` | Manual replacement for summary | admin override owned | active override row | no | yes | yes | Takes precedence when active. |
| `shelter_overrides.reason` | Why an override exists | internal operational | override row | no | yes | no | Required for auditability. |
| `shelter_overrides.is_active` | Whether override is effective | internal operational | override row | no | yes | no | Public reads ignore inactive rows. |
| `shelter_overrides.effective_from` | Override activation timestamp | internal operational | override row | no | system/admin flow | no | Operational history. |
| `shelter_overrides.effective_until` | Override end timestamp | internal operational | override row | no | system/admin flow | no | Set when override is cleared. |
| `shelter_overrides.created_by` / `updated_by` | Acting admin identity | internal operational | override row | no | system/admin flow | no | Required for traceability. |

## Derived Effective Public Fields
| Field | Purpose | Owner | Source of truth | Importer may write | Admin may override | Public | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `effective.name` | Public shelter name | derived/effective | active override else import | n/a | via override row | yes | Used by detail/search/list pages. |
| `effective.address_line1` | Public address | derived/effective | active override else import | n/a | via override row | yes | Used by detail/search/list pages. |
| `effective.postal_code` | Public postal code | derived/effective | active override else import | n/a | via override row | yes | Used by detail/search/list pages. |
| `effective.city` | Public city | derived/effective | active override else import | n/a | via override row | yes | Used by detail/search/list pages. |
| `effective.capacity` | Public capacity | derived/effective | active override else import | n/a | via override row | yes | Used by detail/search/list pages. |
| `effective.status` | Public operational status | derived/effective | active override else import | n/a | via override row | yes | Used by detail/search/list pages. |
| `effective.accessibility_notes` | Public accessibility text | derived/effective | active override else import | n/a | via override row | yes | Used by detail pages. |
| `effective.summary` | Public summary | derived/effective | active override else import | n/a | via override row | yes | Used by detail/search/list pages. |
| `effective.primary_source` | Trust label | derived/effective | most relevant `shelter_sources` row | n/a | no | yes | Current app picks a source row for trust display. |
| `effective.last_imported_at` | Public freshness hint | derived/effective | `shelter_sources.imported_at` | n/a | no | yes | Not the same as official verification date. |
| `effective.last_verified_at` | Public verification hint | derived/effective | `shelter_sources.last_verified_at` | n/a | no | yes | Should remain source-derived, not override-derived. |

## Current Model Risks
- `shelters` currently mixes import-owned baseline fields with editorial fields like `source_summary`, `is_featured`, and `featured_rank`.
- `shelter_sources.notes` and `shelters.source_summary` are currently acting like public trust copy without a clear long-term ownership rule.
- `municipalities.description` is public editorial content but is not called out clearly enough as admin-owned enrichment.
- `shelter_reports` still exists as an operational input even though community-driven contribution is no longer a core product direction.

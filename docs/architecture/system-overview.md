# System Overview

## Stack
- Next.js App Router with TypeScript.
- Tailwind CSS and shadcn/ui for UI primitives.
- Supabase Postgres for data storage and Supabase clients for reads and writes.
- Vercel for hosting.

## Runtime Shape
- Server Components are the default rendering model.
- Small Client Components are allowed for browser-only actions like geolocation and controlled form state.
- Shared infrastructure lives in `lib`.
- Product features live in `features`.
- The homepage and public content routes revalidate from Supabase and degrade gracefully when environment variables are missing.

## Data Flow
1. Public pages query Supabase through `lib/supabase/queries.ts`.
2. The live legacy schema in `public` remains untouched for v2 work; the new v2 database home is `app_v2`.
3. Shelter records in `app_v2.shelters` are now the intended imported baseline for v2 public reads.
4. Raw source metadata and import bookkeeping live in dedicated `app_v2` tables.
5. Manual shelter overrides live in `app_v2.shelter_overrides`, separately from imported records, and hold a narrow set of public field corrections.
6. `/find` uses URL params with `q`, optional `municipality`, optional `lat`/`lng`, and optional `resolved`. Typed address-like queries can be geocoded server-side through Dataforsyningen DAWA, then redirected into the coordinate search path.
7. The `/find` results page stays server-first overall, while the interactive map is isolated to a client-only Leaflet slice fed by the same result set as the list.
8. Shelter detail pages load one public shelter by slug, derive trust metadata from the connected source rows, and expose page metadata from the same public record.
9. Municipality pages load one municipality by slug together with its public shelters and derive landing-page card trust fields from the same public shelter/source tables.
10. Public issue reports are submitted from shelter detail pages through a server action that validates input and writes only to `app_v2.shelter_reports` via a controlled server-side client.
11. `/admin` uses Supabase Auth sessions plus an allowlist of approved admin email addresses, while moderation reads and writes remain server-only.
12. Manual shelter overrides are stored separately from imported records and applied as effective values on the public shelter detail, municipality, and search read paths when an active override exists.
13. Imported shelter lifecycle is modeled on `app_v2.shelters` through `import_state`, `last_seen_at`, `last_imported_at`, and canonical official source identity fields.
14. The first importer skeleton now lives in `lib/importer`, includes both a fixture adapter and a narrow real Datafordeler BBR + DAR adapter, and now targets `app_v2` rather than the legacy `public` schema.
15. The importer CLI is env-var driven, emits concise operational logs, supports dry-run validation, and is suitable for later non-interactive GitHub Actions execution, but no workflow has been added yet.
16. The current real-source selection rule is explicit: nationwide BBR `status = 6` records are the primary inclusion path, with municipality and usage-code filters retained only as optional operational narrowing.
17. The next official-data gatherer iteration is expected to extend that importer skeleton while following the import and field-ownership specs in `docs/data/import-model.md`, `docs/data/field-ownership.md`, and `docs/data/import-contract.md`.
18. Public runtime reads are now hardened for sparse `app_v2` content: blank imported summaries and blank source summaries are converted into explicit fallback copy instead of rendering empty sections.
19. Public server-rendered `app_v2` reads can now fall back to the server-only admin client when `NEXT_PUBLIC_SUPABASE_ANON_KEY` is missing during validation; browser auth flows still require a real public key.
20. Shared navigation now uses real `next/link` elements styled with shared button variants, and the homepage text input uses a native input wrapper to avoid server/client id drift during hydration.
21. Municipality metadata now comes from a bundled national municipality map keyed by BBR municipality code, and shared runtime reads canonicalize legacy fallback municipality slugs and names already stored in `app_v2`.
22. Typed-address search has been validated against the imported `app_v2` dataset: DAWA geocoding still redirects into the existing `lat` / `lng` / `resolved` search path and now returns real nearby shelters without further route-contract changes.

## Current Boundaries
- No advanced map behavior yet beyond the first shared results map on `/find`.
- No advanced geocoding or ranking logic yet.
- No public auth UI beyond the internal admin login flow.
- No background job runner yet beyond documented import flow assumptions.
- No workflow scheduler or background job runner yet for the official importer.
- Legacy `public` remains read-only for v2 migration work.
- Supabase still needs `app_v2` added to exposed API schemas before all browser/server PostgREST reads will succeed in production.
- Manual runtime validation still depends on importing at least a small `app_v2` dataset first; the app now handles zero-row and low-data states cleanly, but it cannot validate rich flows without imported shelters.

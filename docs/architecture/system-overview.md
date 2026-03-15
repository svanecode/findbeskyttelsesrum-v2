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
2. Shelter records are stored as public-facing entities in `shelters`.
3. Raw source metadata and import bookkeeping live in dedicated tables.
4. Manual shelter overrides live separately from imported records and hold a narrow set of public field corrections.
5. `/find` uses URL params with `q`, optional `municipality`, optional `lat`/`lng`, and optional `resolved`. Typed address-like queries can be geocoded server-side through Dataforsyningen DAWA, then redirected into the coordinate search path.
6. The `/find` results page stays server-first overall, while the interactive map is isolated to a client-only Leaflet slice fed by the same result set as the list.
7. Shelter detail pages load one public shelter by slug, derive trust metadata from the connected source rows, and expose page metadata from the same public record.
8. Municipality pages load one municipality by slug together with its public shelters and derive landing-page card trust fields from the same public shelter/source tables.
9. Public issue reports are submitted from shelter detail pages through a server action that validates input and writes only to `shelter_reports` via a controlled server-side client.
10. `/admin` uses Supabase Auth sessions plus an allowlist of approved admin email addresses, while moderation reads and writes remain server-only.
11. Manual shelter overrides are stored separately from imported records and applied as effective values on the public shelter detail read path and public search results when an active override exists.

## Current Boundaries
- No advanced map behavior yet beyond the first shared results map on `/find`.
- No advanced geocoding or ranking logic yet.
- No public auth UI beyond the internal admin login flow.
- No background job runner yet beyond documented import flow assumptions.

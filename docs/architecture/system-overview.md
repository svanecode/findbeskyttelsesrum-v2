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
4. Manual status overrides live separately and can supersede imported status in future logic.
5. `/find` uses URL params with `q` and optional `municipality`, applies a small server-side text match, and returns ranked public shelter cards without map logic.
6. Shelter detail pages load one public shelter by slug, derive trust metadata from the connected source rows, and expose page metadata from the same public record.
7. Municipality pages load one municipality by slug together with its public shelters and derive landing-page card trust fields from the same public shelter/source tables.
8. Public issue reports are submitted from shelter detail pages through a server action that validates input and writes only to `shelter_reports` via a controlled server-side client.
9. `/admin` uses Supabase Auth sessions plus an allowlist of approved admin email addresses, while moderation reads and writes remain server-only.

## Current Boundaries
- No map provider integration yet.
- No advanced geocoding or ranking logic yet.
- No auth UI yet.
- No background job runner yet beyond documented import flow assumptions.

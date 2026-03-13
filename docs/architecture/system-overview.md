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

## Data Flow
1. Public pages query Supabase through `lib/supabase/queries.ts`.
2. Shelter records are stored as public-facing entities in `shelters`.
3. Raw source metadata and import bookkeeping live in dedicated tables.
4. Manual status overrides live separately and can supersede imported status in future logic.

## Current Boundaries
- No map provider integration yet.
- No advanced geocoding or ranking logic yet.
- No auth UI yet.
- No background job runner yet beyond documented import flow assumptions.

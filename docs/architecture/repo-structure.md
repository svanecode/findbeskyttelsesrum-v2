# Repo Structure

## Top Level
- `app/`: App Router routes and route-level layouts.
- `components/`: shared UI primitives in `components/ui` and shared layout pieces in `components/shared`.
- `features/`: domain-specific modules such as home, search, shelter, municipality, admin, and data transparency.
- `lib/`: infrastructure, utility helpers, Supabase clients, and shared config.
- `lib/importer/`: importer contract, source adapters, fixtures, and the core official-data import service.
- `supabase/`: SQL migrations and seed data.
- `public/`: static assets.
- `docs/`: living product, architecture, and data documentation.

## Conventions
- Keep route files thin and focused on composition.
- Place data access in `lib/supabase`.
- Treat the live Supabase `public` schema as legacy for this project; new v2 database work now lives in `app_v2`.
- Use explicit `app_v2` schema-targeted Supabase helpers for v2 reads and writes instead of relying on the default schema.
- Keep official importer code in `lib/importer` and keep it separate from route modules and public query code.
- Keep source clients for importer-only integrations close to the importer in `lib/importer/clients`; current real-source work uses a small Datafordeler GraphQL client there.
- Keep browser geolocation handling local to the feature that needs it and pass coordinates through URL params into server-rendered search routes.
- Keep provider integrations isolated in small `lib/*` modules; current address geocoding lives in `lib/geocoding/dawa.ts` and feeds the existing `/find` coordinate contract.
- Keep local importer execution in a small script entry point under `scripts/importer`; do not couple importer runs to route handlers.
- Keep importer execution env-var driven and non-interactive so the same command shape can later run inside GitHub Actions.
- Add new v2 database objects through migrations under a dedicated schema instead of modifying legacy `public` objects in place.
- Keep the `/find` map isolated to a dedicated client component tree fed by the existing search result set; do not introduce a separate map-only fetch path in the first version.
- Place feature-specific view models and UI under the relevant `features/*` directory.
- Keep public form handling close to the relevant feature and route writes through explicit server actions.
- Keep internal moderation actions explicit and server-only; admin authorization currently uses Supabase Auth plus an email allowlist.
- Keep manual override workflows explicit and narrow; support only the documented override fields, use the dedicated `/admin/shelters/[slug]/override` route, and keep imported values visible in admin tooling.
- Keep shared presentational primitives in `components/ui` or `components/shared`.
- Keep server-rendered navigation links as real `next/link` elements; use shared button-variant styling instead of rendering links through button primitives.
- Keep shared text inputs on a stable native wrapper unless a richer browser-only control is actually needed.
- Add new docs when introducing meaningful architectural or schema changes.

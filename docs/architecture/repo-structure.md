# Repo Structure

## Top Level
- `app/`: App Router routes and route-level layouts.
- `components/`: shared UI primitives in `components/ui` and shared layout pieces in `components/shared`.
- `features/`: domain-specific modules such as home, search, shelter, municipality, admin, and data transparency.
- `lib/`: infrastructure, utility helpers, Supabase clients, and shared config.
- `supabase/`: SQL migrations and seed data.
- `public/`: static assets.
- `docs/`: living product, architecture, and data documentation.

## Conventions
- Keep route files thin and focused on composition.
- Place data access in `lib/supabase`.
- Place feature-specific view models and UI under the relevant `features/*` directory.
- Keep public form handling close to the relevant feature and route writes through explicit server actions.
- Keep internal moderation actions explicit and server-only; admin authorization currently uses Supabase Auth plus an email allowlist.
- Keep manual override workflows explicit and narrow; support only the documented override fields and keep imported values visible in admin tooling.
- Keep shared presentational primitives in `components/ui` or `components/shared`.
- Add new docs when introducing meaningful architectural or schema changes.

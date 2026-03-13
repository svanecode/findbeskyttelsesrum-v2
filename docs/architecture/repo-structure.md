# Repo Structure

## Top Level
- `app/`: App Router routes and route-level layouts.
- `components/`: shared UI primitives and layout components.
- `features/`: domain-specific modules such as home, shelters, municipalities, and data transparency.
- `lib/`: infrastructure, utility helpers, Supabase clients, and shared config.
- `supabase/`: SQL migrations and seed data.
- `public/`: static assets.
- `docs/`: living product, architecture, and data documentation.

## Conventions
- Keep route files thin and focused on composition.
- Place data access in `lib/supabase`.
- Place feature-specific view models and UI under the relevant `features/*` directory.
- Keep shared presentational primitives in `components/ui` or `components/shared`.
- Add new docs when introducing meaningful architectural or schema changes.

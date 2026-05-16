# Findbeskyttelsesrum importer

## Mission
- Keep official Danish shelter data fresh, auditable, and safe to write into `app_v2`.
- Prefer explicit, non-interactive CLI and CI execution over hidden side paths.
- Choose the smallest strong implementation that solves the current import need.

## Scope
- This repository is importer-only. The public Next.js site lives elsewhere.
- Do not add UI, routes, or app-shell code here unless the task explicitly requires importer tooling.

## Architecture Rules
- Keep official import logic in `lib/importer`.
- Keep source clients under `lib/importer/clients`.
- Keep local runs in `scripts/importer/run.ts`.
- Keep Supabase admin access in `lib/supabase` and target `app_v2` explicitly.
- Model manual overrides and public reads in the app repo; this repo writes importer-owned shelter baseline fields only.
- Prefer direct, explicit modules over large abstraction layers.

## Database Rules
- Supabase Postgres is the source of truth.
- All schema changes must go through SQL migrations in `supabase/migrations`.
- Keep import runs, source records, and public shelter records as distinct concerns in `app_v2`.
- Add indexes intentionally for importer query paths.

## Security Rules
- Keep secrets server-side. Never expose service-role keys in client code.
- Validate env configuration before long-running imports.
- Default to least privilege in Supabase policies for tables this job touches.

## Delivery Rules
- Keep files small, explicit, and reviewable.
- Update data/import docs when behavior, env vars, or CI change.
- Run `npm run typecheck` and `npm run lint` before handing work over when possible.
- Use English for code, docs, comments, file names, and internal content.

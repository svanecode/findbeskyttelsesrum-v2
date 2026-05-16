# Repo Structure

This repository contains only the official-data importer and related database migrations.

## Top level
- `lib/importer/` — importer contract, source adapters, fixtures, Datafordeler client, and import service.
- `lib/municipalities/` — municipality code/slug metadata used when converging municipality rows during import.
- `lib/supabase/` — admin Supabase client and env helpers for `app_v2` writes.
- `scripts/importer/` — CLI entry point for local runs and GitHub Actions.
- `supabase/migrations/` — SQL migrations for `app_v2` (shared with the app database).
- `supabase/seed.sql` — optional local seed data.
- `.github/workflows/` — scheduled and manual Datafordeler import runs.
- `docs/data/` — import model, flow, and implementation notes.

## Conventions
- Keep importer execution env-var driven and non-interactive.
- Do not couple importer runs to HTTP handlers; the CLI is the only entry point.
- Add new `app_v2` objects through migrations instead of modifying legacy `public` objects.
- Document meaningful import or schema changes in `docs/data/`.

## Related repository
The public Findbeskyttelsesrum site (Next.js App Router, search, shelter pages, admin) lives in a separate repo and reads the same Supabase `app_v2` schema.

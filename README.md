# Findbeskyttelsesrum importer

Official shelter data importer for Findbeskyttelsesrum. It fetches BBR/DAR records from Datafordeler, normalizes them, and upserts importer-owned fields into Supabase `app_v2`.

The public site lives in a separate repository. This repo owns import logic, local CLI runs, scheduled GitHub Actions, and database migrations for the `app_v2` schema.

## Stack
- TypeScript
- Supabase Postgres (`app_v2`)
- Datafordeler GraphQL (BBR + DAR)
- GitHub Actions

## Local development
1. Copy `.env.example` to `.env` and fill in Supabase and Datafordeler values.
2. Run `npm install`.
3. Apply migrations under `supabase/migrations` to your Supabase project (or local stack).
4. Run fixture imports: `npm run importer:fixture -- baseline`
5. Run a bounded live dry-run: `npm run importer:datafordeler -- --dry-run --max-pages 5`

## Commands
```bash
npm run importer:fixture -- baseline
npm run importer:fixture -- follow-up
npm run importer:datafordeler
npm run importer:datafordeler -- --dry-run
npm run importer:datafordeler -- --dry-run --max-pages 25
npm run importer:datafordeler -- --resume-latest
npm run typecheck
npm run lint
```

## CI
`.github/workflows/datafordeler-importer.yml` runs the same CLI on a daily schedule and via `workflow_dispatch`. Configure repository secrets documented in `docs/data/importer-implementation.md`.

## Layout
- `lib/importer/` — adapters, Datafordeler client, import service
- `lib/municipalities/` — municipality code/slug metadata used during import
- `lib/supabase/` — admin client for `app_v2` writes
- `scripts/importer/` — CLI entry point
- `supabase/migrations/` — schema migrations shared with the app database

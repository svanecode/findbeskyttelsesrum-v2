# System Overview

## Components
- **Importer (this repo)** — fetches official BBR/DAR data from Datafordeler, normalizes shelter records, and upserts importer-owned fields into Supabase `app_v2`. Runs locally via CLI and on a schedule in GitHub Actions.
- **Public app (separate repo)** — Next.js site for search, shelter detail, municipality pages, and admin overrides. Reads `app_v2` with anon/authenticated clients; does not run the bulk import.
- **Supabase** — Postgres source of truth. `app_v2` holds shelters, municipalities, import runs, reports, and manual overrides.

## Data flow
1. GitHub Actions or a developer runs `scripts/importer/run.ts`.
2. The Datafordeler adapter fetches and normalizes nationwide shelter candidates.
3. `lib/importer/service.ts` writes import-run checkpoints, upserts shelters, and applies missing-from-source lifecycle rules.
4. The public app serves the resulting `app_v2.shelters` rows.

## Boundaries
- Importer-owned fields: address, capacity, coordinates, municipality linkage, lifecycle timestamps tied to import, and related baseline metadata documented in `docs/data/field-ownership.md`.
- App-owned fields: editorial overrides, public trust copy, and UI-facing presentation not owned by the importer.

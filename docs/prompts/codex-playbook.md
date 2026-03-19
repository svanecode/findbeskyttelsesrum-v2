# Codex Playbook

## Working Priorities
- Start with the smallest production-minded implementation that keeps future changes easy.
- Keep route files thin and move reusable logic into `features` and `lib`.
- Use Server Components by default and add Client Components only when browser APIs or interactive state are required.
- Keep docs aligned with code whenever architecture or schema changes.

## Review Checklist
- Is the route file mostly composition?
- Is the data source explicit and trustworthy?
- Are import concerns separated from public shelter records?
- Are manual overrides modeled independently?
- Is the UI calm, fast, and mobile-first?
- If touching `/find`, does it keep `q`, optional `municipality`, and optional `lat`/`lng` as the URL contract?
- If touching geocoding, does it keep the redirect contract explicit (`q` plus resolved `lat` / `lng`, with `resolved` only as a display hint) and fall back cleanly to text search?
- If touching location search, is the distance ordering explicit and does `q` plus coordinates still behave predictably?
- If touching the map, does it render the same result set as the list and keep the client boundary scoped to the interactive map slice?
- If touching shelter details, does the page surface source provenance and freshness clearly from public data?
- If touching municipality pages, does the page work as a standalone landing page and not just a raw shelter list?
- If touching public reporting, is the write path validated on the server and isolated to `shelter_reports`?
- If touching `/admin`, are Supabase write-key operations server-only and is auth enforced with a real authenticated admin check?
- If touching overrides, is the effective-value precedence explicit and are imported values still traceable?
- If touching overrides, does the change use `shelter_overrides` and avoid recreating the old `shelter_status_overrides` naming?
- If touching overrides, does the change stay within the documented field scope (`name`, `address_line1`, `postal_code`, `city`, `capacity`, `status`, `accessibility_notes`, `summary`) unless a migration explicitly expands it?
- If touching importer work, does it follow the field ownership and import contract docs instead of inferring ownership from current table usage?
- If touching importer work, does it treat `import_state`, `last_seen_at`, `last_imported_at`, and canonical source identity as importer-owned shelter lifecycle fields?
- If touching importer work, does it avoid overwriting admin enrichment, override rows, and operational audit history?
- If touching importer work, does the adapter emit the normalized importer contract in `lib/importer/types.ts` instead of leaking source-specific shapes into the write path?
- If touching importer work, does local verification still work through `npm run importer:fixture -- <snapshot>`?
- If touching importer work, does real-source execution still work through env vars and a CLI path suitable for later GitHub Actions use?
- If touching importer work, does the real-source path fail clearly on auth, timeout, network, and source-shape errors?
- If touching importer work, does the real-source path expose skip counts and warning signals instead of silently dropping incomplete source rows?
- If touching importer work, do non-JSON Datafordeler responses surface status, content type, and a short safe body preview instead of opaque JSON parse failures?
- If touching importer work, do long-running runs checkpoint progress explicitly and support resuming from the latest failed run without inventing a broader job system?
- If touching importer checkpoints or `app_v2.import_runs`, do write failures surface the real table/operation/status context and retry bounded transient failures instead of failing with a generic message?
- If touching importer finalization, does the run record move out of `running` on success or process interruption, and does `records_seen` / `records_upserted` stay informative during the long apply phase?
- If touching importer apply logic, does the run emit concise phase progress logs and avoid per-record canonical lookups or municipality candidate scans that can make a long real run appear stalled?
- If touching GitHub Actions importer automation, does the workflow call the existing importer CLI directly, use secrets-based env injection, and keep schedule/manual modes inside one explicit workflow?
- If touching importer work, are missing/deactivation transitions blocked unless the run completed successfully and cleared the documented coverage guard?
- If touching live Datafordeler selection logic, does it still enforce positive `byg069Sikringsrumpladser` instead of relying on BBR status `6` alone?
- If touching DAR enrichment, does the adapter treat `DAR_Husnummer.navngivenVej` and `DAR_Husnummer.postnummer` as relation ids and resolve them explicitly instead of assuming nested objects?
- If touching DAR enrichment, are all DAR `in` queries hard-capped at `100` ids or fewer so full runs do not fail on oversized batches?
- If touching BBR coordinates, does the adapter use the confirmed live shape `byg404Koordinat.wkt` and convert EPSG:25832 explicitly instead of guessing coordinate fields?
- If touching importer work, are any currently deferred official fields documented explicitly instead of being silently guessed?
- If touching the Datafordeler adapter, is the real inclusion rule still explicit: nationwide by default and BBR `status = 6` as the primary shelter-selection rule?
- If touching municipality metadata, does the importer use the bundled municipality map first, keep env overrides explicit, and avoid emitting the same fallback warning once per shelter row?
- If touching municipality writes, does the importer converge fallback and canonical municipality rows by municipality code instead of creating new duplicate municipality rows?
- If validating importer performance, are real imports run one at a time so lock contention does not get misread as an apply-phase stall?
- If touching importer automation, does the workflow prevent overlapping runs and preserve a bounded manual validation mode with `dry_run`, `max_pages`, or `resume_latest` instead of inventing a second control plane?
- If touching the database model, does new v2 work land in `app_v2` without modifying legacy `public` objects unless the task explicitly requires it?
- If touching Supabase queries or writes, is schema targeting explicit for `app_v2` and are any required API-schema exposure steps documented?
- If touching server-rendered public `app_v2` reads, do they keep working cleanly during validation when the anon key is missing, without exposing server write-key behavior to the browser?
- If touching public `app_v2` reads, do sparse imported records still render honest fallback copy instead of blank summaries or trust sections?
- If touching municipality reads, do canonical slugs still resolve cleanly even when current `app_v2` rows still carry older fallback municipality slugs or names?
- If touching navigation, are real links used for navigation semantics instead of rendering links through button primitives?
- If touching shared inputs, does the input path avoid unstable server/client ids that can cause hydration mismatches?
- Is the change small enough to review easily?

## Delivery Checklist
- Update or add migrations for schema changes.
- Update docs for new conventions or structural changes.
- Run lint, typecheck, and build when practical.
- Call out any required Supabase or Vercel setup steps in the final handoff.

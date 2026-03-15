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
- If touching `/admin`, is service-role usage server-only and is auth enforced with a real authenticated admin check?
- If touching overrides, is the effective-value precedence explicit and are imported values still traceable?
- If touching overrides, does the change stay within the documented field scope (`name`, `address_line1`, `postal_code`, `city`, `capacity`, `status`, `accessibility_notes`, `summary`) unless a migration explicitly expands it?
- Is the change small enough to review easily?

## Delivery Checklist
- Update or add migrations for schema changes.
- Update docs for new conventions or structural changes.
- Run lint, typecheck, and build when practical.
- Call out any required Supabase or Vercel setup steps in the final handoff.

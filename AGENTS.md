# Findbeskyttelsesrum v2

## Mission
- Build a trustworthy, calm, mobile-first public utility for finding nearby shelters in Denmark.
- Prioritize clarity, trust, and speed over flashy design.
- Choose the smallest strong implementation that solves the current need and avoid overengineering.

## Product Rules
- Optimize the main journey first: find address or current location, browse results, open a shelter detail page with clear source and trust information.
- Treat municipality pages as first-class product and SEO surfaces.
- Make data quality and source clarity visible product features, not hidden internals.
- Use English for code, docs, comments, file names, and internal content.

## Architecture Rules
- Use Next.js App Router with Server Components by default.
- Only use Client Components when browser APIs, event handlers, or local interactivity require them.
- Keep route files thin. Route files should compose feature modules and shared components, not hold business logic.
- Put reusable domain logic in `features/*` and shared infrastructure in `lib/*`.
- Keep public-facing shelter records separate from raw import concerns.
- Model manual overrides separately from imported data so editorial decisions remain auditable.
- Prefer direct, explicit modules over large abstraction layers.

## Database Rules
- Supabase Postgres is the source of truth.
- All schema changes must go through SQL migrations in `supabase/migrations`.
- Keep import run metadata, source records, public shelter records, reports, and manual overrides as distinct concerns.
- Add indexes intentionally for current query paths. Do not add speculative database complexity.
- Enable Row Level Security on application tables and add explicit policies.

## UI Rules
- Keep the UI sober, calm, and fast.
- Design mobile-first and scale up cleanly for larger screens.
- Prefer a small set of reusable primitives and feature components.
- Make trust signals explicit: source labels, update dates, and data completeness disclaimers should be easy to find.

## Security Rules
- Keep secrets server-side. Never expose service-role keys in client code.
- Validate all server inputs before writing to the database.
- Default to least privilege in Supabase policies.
- Avoid adding auth flows or admin capabilities unless required by the current task.

## Delivery Rules
- Keep files small, explicit, and reviewable.
- Document new conventions briefly where they are introduced.
- Update docs whenever architecture, data model, or key delivery conventions change.
- Run relevant lint, typecheck, and build commands before handing work over when possible.
- Fix obvious issues introduced by the change before finishing.

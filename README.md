# Findbeskyttelsesrum v2

Production-minded baseline for a Danish public utility that helps people find nearby shelters.

## Stack
- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- Supabase
- Vercel

## Local Development
1. Copy `.env.example` to `.env.local` and fill in the Supabase values.
2. Run `npm install`.
3. Apply `supabase/migrations/202603132210_initial_schema.sql`.
4. Run `supabase/seed.sql`.
5. Start the app with `npm run dev`.

## Project Notes
- Route files stay thin.
- Server Components are the default.
- Supabase Postgres is the source of truth.
- Schema changes must go through SQL migrations.

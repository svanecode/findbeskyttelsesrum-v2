create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.municipalities (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  region_name text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.import_runs (
  id uuid primary key default gen_random_uuid(),
  source_name text not null,
  source_url text,
  status text not null check (status in ('running', 'succeeded', 'failed')),
  records_seen integer not null default 0,
  records_upserted integer not null default 0,
  started_at timestamptz not null default timezone('utc', now()),
  finished_at timestamptz,
  error_summary text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.shelters (
  id uuid primary key default gen_random_uuid(),
  municipality_id uuid not null references public.municipalities(id) on delete restrict,
  slug text not null unique,
  name text not null,
  address_line1 text not null,
  postal_code text not null,
  city text not null,
  latitude numeric(9, 6),
  longitude numeric(9, 6),
  capacity integer not null check (capacity >= 0),
  status text not null check (status in ('active', 'temporarily_closed', 'under_review')),
  accessibility_notes text,
  summary text not null,
  source_summary text not null,
  is_featured boolean not null default false,
  featured_rank integer,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.shelter_sources (
  id uuid primary key default gen_random_uuid(),
  shelter_id uuid not null references public.shelters(id) on delete cascade,
  import_run_id uuid references public.import_runs(id) on delete set null,
  source_name text not null,
  source_url text,
  source_type text not null check (source_type in ('official', 'municipality', 'manual', 'other')),
  source_reference text,
  last_verified_at timestamptz,
  imported_at timestamptz not null default timezone('utc', now()),
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.shelter_reports (
  id uuid primary key default gen_random_uuid(),
  shelter_id uuid not null references public.shelters(id) on delete cascade,
  report_type text not null check (report_type in ('missing', 'incorrect', 'closed', 'other')),
  message text not null,
  contact_email text,
  status text not null default 'open' check (status in ('open', 'reviewing', 'resolved', 'dismissed')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.shelter_status_overrides (
  id uuid primary key default gen_random_uuid(),
  shelter_id uuid not null references public.shelters(id) on delete cascade,
  status text not null check (status in ('active', 'temporarily_closed', 'under_review')),
  reason text not null,
  is_active boolean not null default true,
  effective_from timestamptz not null default timezone('utc', now()),
  effective_until timestamptz,
  created_by text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_type text not null,
  actor_identifier text,
  entity_type text not null,
  entity_id uuid,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists municipalities_slug_idx on public.municipalities (slug);
create index if not exists shelters_slug_idx on public.shelters (slug);
create index if not exists shelters_municipality_id_idx on public.shelters (municipality_id);
create index if not exists shelters_featured_rank_idx on public.shelters (is_featured, featured_rank);
create index if not exists shelter_sources_shelter_id_idx on public.shelter_sources (shelter_id);
create index if not exists shelter_sources_import_run_id_idx on public.shelter_sources (import_run_id);
create index if not exists shelter_sources_last_verified_at_idx on public.shelter_sources (last_verified_at desc);
create index if not exists shelter_reports_shelter_id_idx on public.shelter_reports (shelter_id);
create index if not exists shelter_reports_status_idx on public.shelter_reports (status);
create index if not exists shelter_status_overrides_shelter_id_idx on public.shelter_status_overrides (shelter_id);
create index if not exists shelter_status_overrides_active_idx on public.shelter_status_overrides (shelter_id, is_active);
create index if not exists audit_events_entity_idx on public.audit_events (entity_type, entity_id);
create index if not exists import_runs_started_at_idx on public.import_runs (started_at desc);

create trigger set_municipalities_updated_at
before update on public.municipalities
for each row
execute function public.set_updated_at();

create trigger set_import_runs_updated_at
before update on public.import_runs
for each row
execute function public.set_updated_at();

create trigger set_shelters_updated_at
before update on public.shelters
for each row
execute function public.set_updated_at();

create trigger set_shelter_sources_updated_at
before update on public.shelter_sources
for each row
execute function public.set_updated_at();

create trigger set_shelter_reports_updated_at
before update on public.shelter_reports
for each row
execute function public.set_updated_at();

create trigger set_shelter_status_overrides_updated_at
before update on public.shelter_status_overrides
for each row
execute function public.set_updated_at();

alter table public.municipalities enable row level security;
alter table public.import_runs enable row level security;
alter table public.shelters enable row level security;
alter table public.shelter_sources enable row level security;
alter table public.shelter_reports enable row level security;
alter table public.shelter_status_overrides enable row level security;
alter table public.audit_events enable row level security;

create policy "public read municipalities"
on public.municipalities
for select
using (true);

create policy "public read shelters"
on public.shelters
for select
using (true);

create policy "public read shelter_sources"
on public.shelter_sources
for select
using (true);

alter table public.shelters
  add column if not exists import_state text not null default 'active',
  add column if not exists last_seen_at timestamptz,
  add column if not exists last_imported_at timestamptz,
  add column if not exists canonical_source_name text,
  add column if not exists canonical_source_reference text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'shelters_import_state_check'
      and conrelid = 'public.shelters'::regclass
  ) then
    alter table public.shelters
      add constraint shelters_import_state_check
      check (import_state in ('active', 'missing_from_source', 'suppressed'));
  end if;
end
$$;

update public.shelters as shelters
set
  last_imported_at = source_rollup.last_imported_at,
  last_seen_at = coalesce(shelters.last_seen_at, source_rollup.last_imported_at)
from (
  select
    shelter_id,
    max(imported_at) as last_imported_at
  from public.shelter_sources
  group by shelter_id
) as source_rollup
where shelters.id = source_rollup.shelter_id
  and (
    shelters.last_imported_at is distinct from source_rollup.last_imported_at
    or shelters.last_seen_at is null
  );

create index if not exists shelters_import_state_idx
on public.shelters (import_state);

create index if not exists shelters_last_seen_at_idx
on public.shelters (last_seen_at desc);

create unique index if not exists shelters_canonical_source_identity_idx
on public.shelters (canonical_source_name, canonical_source_reference)
where canonical_source_name is not null
  and canonical_source_reference is not null;

alter table public.shelter_status_overrides
  rename to shelter_overrides;

alter index if exists public.shelter_status_overrides_shelter_id_idx
  rename to shelter_overrides_shelter_id_idx;

alter index if exists public.shelter_status_overrides_active_idx
  rename to shelter_overrides_active_idx;

alter index if exists public.shelter_status_overrides_one_active_idx
  rename to shelter_overrides_one_active_idx;

alter trigger set_shelter_status_overrides_updated_at
on public.shelter_overrides
rename to set_shelter_overrides_updated_at;

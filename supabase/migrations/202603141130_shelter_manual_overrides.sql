alter table public.shelter_status_overrides
  alter column status drop not null;

alter table public.shelter_status_overrides
  add column if not exists name text,
  add column if not exists street text,
  add column if not exists house_number text,
  add column if not exists postal_code text,
  add column if not exists city text,
  add column if not exists capacity integer check (capacity >= 0),
  add column if not exists notes_public text,
  add column if not exists updated_by text;

create unique index if not exists shelter_status_overrides_one_active_idx
on public.shelter_status_overrides (shelter_id)
where is_active = true;

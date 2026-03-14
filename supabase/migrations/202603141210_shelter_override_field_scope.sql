alter table public.shelter_status_overrides
  add column if not exists address_line1 text,
  add column if not exists accessibility_notes text,
  add column if not exists summary text;

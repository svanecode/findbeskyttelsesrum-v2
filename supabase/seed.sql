insert into public.municipalities (id, slug, name, description, region_name)
values
  (
    '7b7eb7b2-744e-45fa-a13e-7119e69ad2ce',
    'kobenhavn',
    'Copenhagen',
    'Seed municipality used for the first public baseline and municipality route.',
    'Capital Region of Denmark'
  ),
  (
    'c3c94cf2-86de-47d9-8f31-7ea8f6d9ca5e',
    'frederiksberg',
    'Frederiksberg',
    'Seed municipality used to demonstrate multiple municipality landing pages.',
    'Capital Region of Denmark'
  )
on conflict (id) do nothing;

insert into public.import_runs (
  id,
  source_name,
  source_url,
  status,
  records_seen,
  records_upserted,
  started_at,
  finished_at
)
values
  (
    '3a17d711-bfb3-467a-b4af-68331da54f33',
    'Preparedness Agency seed import',
    'https://example.com/beredskab/seed-import',
    'succeeded',
    3,
    3,
    timezone('utc', now()) - interval '2 days',
    timezone('utc', now()) - interval '2 days' + interval '2 minutes'
  )
on conflict (id) do nothing;

insert into public.shelters (
  id,
  municipality_id,
  slug,
  name,
  address_line1,
  postal_code,
  city,
  latitude,
  longitude,
  capacity,
  status,
  accessibility_notes,
  summary,
  source_summary,
  is_featured,
  featured_rank
)
values
  (
    '2799afe6-d300-48c7-83ad-c7db4f9c2c42',
    '7b7eb7b2-744e-45fa-a13e-7119e69ad2ce',
    'islands-brygge-skole-kaelder',
    'Islands Brygge School Basement Shelter',
    'Artillerivej 57',
    '2300',
    'Copenhagen S',
    55.664310,
    12.576120,
    180,
    'active',
    'Step-free entrance from the courtyard.',
    'Local shelter record used to prove the first complete public detail route.',
    'Status is based on the latest imported public source and shown together with source references.',
    true,
    1
  ),
  (
    '05a892a0-93cf-4b11-aef5-0c0be93d1fa0',
    '7b7eb7b2-744e-45fa-a13e-7119e69ad2ce',
    'valby-hallen-nord',
    'Valby Hall North Shelter',
    'Julius Andersens Vej 3',
    '2450',
    'Copenhagen SV',
    55.651920,
    12.493400,
    250,
    'under_review',
    'No confirmed accessibility details yet.',
    'Seed record marked under review to demonstrate a trust-focused status state.',
    'Source references remain visible even when a record needs review.',
    true,
    2
  ),
  (
    '20f30102-5a17-4fb6-90e4-b2ce490b7fe0',
    'c3c94cf2-86de-47d9-8f31-7ea8f6d9ca5e',
    'frederiksberg-radhus-kaelder',
    'Frederiksberg Town Hall Basement Shelter',
    'Smallegade 1',
    '2000',
    'Frederiksberg',
    55.679720,
    12.534430,
    120,
    'active',
    'Entrance via the east side ramp.',
    'Seed record for the second municipality landing page.',
    'The public record is separate from import bookkeeping and manual overrides.',
    true,
    3
  )
on conflict (id) do nothing;

insert into public.shelter_sources (
  id,
  shelter_id,
  import_run_id,
  source_name,
  source_url,
  source_type,
  source_reference,
  last_verified_at,
  notes
)
values
  (
    '7a4f3460-2400-4c6a-b733-905f59e6ff19',
    '2799afe6-d300-48c7-83ad-c7db4f9c2c42',
    '3a17d711-bfb3-467a-b4af-68331da54f33',
    'Preparedness Agency register',
    'https://example.com/beredskab/islands-brygge',
    'official',
    'Seed source reference 001',
    timezone('utc', now()) - interval '5 days',
    'Primary seed source.'
  ),
  (
    '6073fc33-d952-4bf3-bdf5-0b4f1168ad52',
    '05a892a0-93cf-4b11-aef5-0c0be93d1fa0',
    '3a17d711-bfb3-467a-b4af-68331da54f33',
    'Copenhagen municipality preparedness page',
    'https://example.com/kbh/valby-hallen',
    'municipality',
    'Seed source reference 002',
    timezone('utc', now()) - interval '8 days',
    'Public municipality source.'
  ),
  (
    'd237db01-8827-4d39-8ab7-966dd8e0c8f4',
    '20f30102-5a17-4fb6-90e4-b2ce490b7fe0',
    '3a17d711-bfb3-467a-b4af-68331da54f33',
    'Frederiksberg municipality preparedness page',
    'https://example.com/frederiksberg/radhus-kaelder',
    'municipality',
    'Seed source reference 003',
    timezone('utc', now()) - interval '4 days',
    'Municipality source with recent verification.'
  )
on conflict (id) do nothing;

insert into public.shelter_overrides (
  id,
  shelter_id,
  status,
  reason,
  is_active,
  created_by
)
values
  (
    '36212c8d-0a79-4e06-9ce0-210ecb92026e',
    '05a892a0-93cf-4b11-aef5-0c0be93d1fa0',
    'under_review',
    'Awaiting confirmation of current access conditions.',
    true,
    'seed-script'
  )
on conflict (id) do nothing;

insert into public.audit_events (
  id,
  actor_type,
  actor_identifier,
  entity_type,
  entity_id,
  event_type,
  payload
)
values
  (
    '24764496-46c3-49a2-bdd4-af4fc3364f4e',
    'system',
    'seed-script',
    'import_run',
    '3a17d711-bfb3-467a-b4af-68331da54f33',
    'seed_applied',
    '{"records": 3}'
  )
on conflict (id) do nothing;

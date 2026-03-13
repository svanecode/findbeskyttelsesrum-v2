alter table public.shelter_reports
drop constraint if exists shelter_reports_status_check;

alter table public.shelter_reports
add constraint shelter_reports_status_check
check (
  status in (
    'open',
    'reviewing',
    'resolved',
    'rejected'
  )
);

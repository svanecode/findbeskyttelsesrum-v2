alter table public.shelter_reports
drop constraint if exists shelter_reports_report_type_check;

alter table public.shelter_reports
add constraint shelter_reports_report_type_check
check (
  report_type in (
    'incorrect_address',
    'unavailable',
    'incorrect_capacity',
    'duplicate_record',
    'other'
  )
);

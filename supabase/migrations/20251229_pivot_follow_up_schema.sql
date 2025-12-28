-- Drop the previous follow_ups table and related objects
drop table if exists public.follow_ups cascade;

-- Add visit fields to patients table
alter table public.patients 
add column if not exists visit_type text default 'regular' check (visit_type in ('regular', 'follow_up', 'emergency')),
add column if not exists visit_reason text;

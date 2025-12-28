-- Create follow_ups table
create table public.follow_ups (
  id uuid default gen_random_uuid() primary key,
  patient_id uuid references public.patients(id) not null,
  assigned_to uuid references auth.users(id), -- Optional: assign to specific user (doctor/receptionist)
  due_date timestamptz not null,
  status text check (status in ('pending', 'completed', 'cancelled')) default 'pending',
  priority text check (priority in ('low', 'medium', 'high', 'critical')) default 'medium',
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table public.follow_ups enable row level security;

-- Policies
create policy "Enable read access for authenticated users"
  on public.follow_ups for select
  using (auth.role() = 'authenticated');

create policy "Enable insert access for authenticated users"
  on public.follow_ups for insert
  with check (auth.role() = 'authenticated');

create policy "Enable update access for authenticated users"
  on public.follow_ups for update
  using (auth.role() = 'authenticated');

create policy "Enable delete access for authenticated users"
  on public.follow_ups for delete
  using (auth.role() = 'authenticated');

-- Triggers for updated_at
-- Using the custom function defined in the normalized schema migration
create trigger handle_updated_at before update on public.follow_ups
  for each row execute procedure update_updated_at_column();

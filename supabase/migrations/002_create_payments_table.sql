-- Create payments table
create table if not exists public.payments (
    id uuid default gen_random_uuid() primary key,
    patient_id uuid references public.patients(id) on delete cascade not null,
    amount decimal(10, 2) not null,
    method text not null check (method in ('cash', 'card', 'eft', 'medical_aid')),
    status text not null default 'pending' check (status in ('pending', 'completed', 'failed', 'refunded')),
    reference text,
    proof_url text,
    notes text,
    created_at timestamptz default now() not null,
    created_by uuid references auth.users(id)
);

-- Enable RLS
alter table public.payments enable row level security;

-- Policies for payments
create policy "Authenticated users can view payments"
    on public.payments for select
    to authenticated
    using (true);

create policy "Authenticated users can insert payments"
    on public.payments for insert
    to authenticated
    with check (true);

create policy "Authenticated users can update payments"
    on public.payments for update
    to authenticated
    using (true);

-- Storage bucket for payment proofs
insert into storage.buckets (id, name, public)
values ('payment-proofs', 'payment-proofs', true)
on conflict (id) do nothing;

-- Storage policies
create policy "Authenticated users can upload payment proofs"
    on storage.objects for insert
    to authenticated
    with check ( bucket_id = 'payment-proofs' );

create policy "Authenticated users can view payment proofs"
    on storage.objects for select
    to authenticated
    using ( bucket_id = 'payment-proofs' );

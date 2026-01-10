-- =====================================================
-- LAB RESULTS INTEGRATION SYSTEM
-- Migration: 20260107000001
-- Description: Complete lab results integration with Chiron
-- =====================================================

-- =====================================================
-- 1. LAB TEST CATALOG TABLE
-- =====================================================
-- Stores available tests from Chiron's catalog
create table if not exists public.lab_test_catalog (
    id uuid default gen_random_uuid() primary key,

    -- Chiron identifiers
    chiron_test_code varchar(50) unique not null,
    chiron_test_name varchar(255) not null,

    -- Standard codes
    loinc_code varchar(20), -- Standard test identifier
    snomed_code varchar(20), -- Clinical terminology

    -- Test details
    category varchar(100), -- 'Hematology', 'Chemistry', 'Microbiology', etc.
    subcategory varchar(100),
    specimen_type varchar(100), -- 'Blood', 'Urine', 'Swab', etc.
    specimen_volume varchar(50),
    container_type varchar(100),

    -- Clinical information
    turnaround_time varchar(50), -- 'Same day', '24 hours', '3-5 days'
    requires_fasting boolean default false,
    patient_preparation text,
    special_instructions text,
    clinical_indications text,

    -- Reference ranges (template - actual ranges may vary by age/sex)
    reference_range_template varchar(200),
    reference_range_notes text,

    -- Pricing and availability
    price_amount decimal(10, 2),
    is_active boolean default true,
    is_urgent_available boolean default false,

    -- Metadata
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null,

    -- Search optimization
    search_terms text -- Space-separated search keywords
);

-- =====================================================
-- 2. LAB ORDERS TABLE (For Phase 2 - sending orders to Chiron)
-- =====================================================
create table if not exists public.lab_orders (
    id uuid default gen_random_uuid() primary key,

    -- Order identification
    order_number varchar(50) unique not null, -- Our internal order number
    chiron_order_id varchar(50) unique, -- Chiron's order ID after submission

    -- Patient and clinical context
    patient_id uuid references public.patients(id) on delete cascade not null,
    ordering_doctor_id uuid references public.users(id) not null,
    consultation_id uuid references public.consultation_notes(id),

    -- Order details
    tests_ordered jsonb not null, -- Array of {test_code, test_name, urgent, fasting_required}
    total_tests integer generated always as (jsonb_array_length(tests_ordered)) stored,

    -- Clinical information
    clinical_notes text,
    diagnosis_codes text[], -- ICD-10 codes
    priority varchar(20) default 'routine' check (priority in ('routine', 'urgent', 'stat', 'asap')),
    fasting_status varchar(20) check (fasting_status in ('fasting', 'non_fasting', 'unknown')),

    -- Collection details
    collection_datetime timestamptz,
    collection_location varchar(100),
    collected_by varchar(100),

    -- Status tracking
    status varchar(30) default 'draft' check (
        status in ('draft', 'pending', 'sent', 'acknowledged', 'in_progress', 'partial', 'completed', 'cancelled', 'failed')
    ),
    status_changed_at timestamptz default now(),
    status_changed_by uuid references public.users(id),

    -- Chiron integration
    sent_to_chiron_at timestamptz,
    acknowledged_by_chiron_at timestamptz,
    chiron_acknowledgment jsonb,

    -- Results tracking
    expected_results_by timestamptz,
    results_received_at timestamptz,
    results_count integer default 0,

    -- Technical fields
    raw_request jsonb, -- Original request payload sent to Chiron
    raw_response jsonb, -- Chiron's response
    error_message text,
    retry_count integer default 0,

    -- Practice isolation
    practice_code varchar(20) not null references public.practices(code),

    -- Metadata
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null,
    created_by uuid references public.users(id)
);

-- =====================================================
-- 3. LAB RESULTS TABLE (Main table for storing results)
-- =====================================================
create table if not exists public.lab_results (
    id uuid default gen_random_uuid() primary key,

    -- Patient and order linkage
    patient_id uuid not null references public.patients(id) on delete cascade,
    order_id uuid references public.lab_orders(id) on delete set null,
    consultation_id uuid references public.consultation_notes(id) on delete set null,

    -- Chiron identifiers
    chiron_accession_number varchar(50) not null, -- Chiron's unique specimen ID
    chiron_order_id varchar(50),
    chiron_result_id varchar(50) unique, -- Unique ID for this specific result

    -- Test information
    test_code varchar(50) not null,
    test_name varchar(255) not null,
    test_category varchar(100),
    loinc_code varchar(20),

    -- Specimen details
    specimen_type varchar(100),
    specimen_id varchar(50),

    -- Result data
    result_value text not null,
    result_value_numeric decimal(15, 4), -- For numeric results, enables filtering/graphing
    result_unit varchar(50),
    result_data_type varchar(20) default 'text' check (
        result_data_type in ('text', 'numeric', 'coded', 'ratio', 'attachment')
    ),

    -- Reference ranges
    reference_range varchar(200),
    reference_range_low decimal(15, 4),
    reference_range_high decimal(15, 4),

    -- Clinical interpretation
    abnormal_flag varchar(20) check (
        abnormal_flag in ('N', 'L', 'H', 'LL', 'HH', 'CRITICAL', '<', '>', 'A', 'AA')
    ),
    -- N = Normal, L = Low, H = High, LL = Very Low, HH = Very High
    -- CRITICAL = Critical value requiring immediate attention
    -- < = Below measurable range, > = Above measurable range
    -- A = Abnormal, AA = Very abnormal

    interpretation_codes varchar(50)[], -- SNOMED codes for interpretation
    clinical_comment text, -- Pathologist's comment

    -- Result status and lifecycle
    result_status varchar(30) default 'preliminary' check (
        result_status in ('preliminary', 'final', 'corrected', 'amended', 'cancelled', 'entered_in_error')
    ),
    result_status_changed_at timestamptz default now(),
    previous_result_id uuid references public.lab_results(id), -- For amendments/corrections

    -- Temporal information
    collection_datetime timestamptz not null,
    received_by_lab_datetime timestamptz,
    result_datetime timestamptz not null, -- When result was produced
    reported_datetime timestamptz default now() not null, -- When result entered our system
    verified_datetime timestamptz, -- When pathologist verified
    released_datetime timestamptz, -- When released to clinician

    -- Clinical context
    ordering_doctor_id uuid references public.users(id),
    ordering_doctor_name varchar(255),
    performing_lab varchar(255) default 'Chiron',
    performing_technician varchar(255),
    verifying_pathologist varchar(255),

    -- Workflow and access tracking
    viewed_by uuid[] default '{}', -- Array of user IDs who viewed this result
    first_viewed_at timestamptz,
    first_viewed_by uuid references public.users(id),
    acknowledged_by uuid references public.users(id),
    acknowledged_at timestamptz,

    -- Critical value handling
    is_critical boolean generated always as (abnormal_flag = 'CRITICAL') stored,
    critical_notified_at timestamptz,
    critical_notified_to uuid references public.users(id),
    critical_acknowledged boolean default false,

    -- Comments and notes
    clinician_notes text,
    internal_notes text,

    -- Technical fields
    raw_data jsonb not null, -- Complete original payload from Chiron
    data_source varchar(50) default 'chiron_api',
    import_batch_id uuid, -- For batch imports

    -- Practice isolation
    practice_code varchar(20) not null references public.practices(code),

    -- Metadata
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null
);

-- =====================================================
-- 4. LAB INTEGRATION LOGS TABLE (Audit trail)
-- =====================================================
create table if not exists public.lab_integration_logs (
    id uuid default gen_random_uuid() primary key,

    -- Event classification
    event_type varchar(50) not null check (
        event_type in (
            'webhook_received', 'result_received', 'order_sent', 'order_acknowledged',
            'critical_alert_sent', 'patient_matched', 'patient_not_matched',
            'validation_error', 'api_error', 'retry_attempted', 'manual_intervention'
        )
    ),
    direction varchar(10) not null check (direction in ('inbound', 'outbound', 'internal')),
    severity varchar(20) default 'info' check (severity in ('debug', 'info', 'warning', 'error', 'critical')),

    -- Related entities
    patient_id uuid references public.patients(id) on delete set null,
    order_id uuid references public.lab_orders(id) on delete set null,
    result_id uuid references public.lab_results(id) on delete set null,

    -- Chiron identifiers
    chiron_accession_number varchar(50),
    chiron_order_id varchar(50),
    chiron_result_id varchar(50),

    -- Technical details
    request_payload jsonb,
    response_payload jsonb,
    headers jsonb,

    -- Outcome
    status varchar(20) not null check (status in ('success', 'partial', 'failure', 'pending', 'retrying')),
    error_code varchar(50),
    error_message text,
    error_stack text,

    -- Network details
    ip_address varchar(45),
    user_agent text,
    request_id varchar(100),

    -- Processing metrics
    processing_time_ms integer,
    retry_count integer default 0,

    -- User context (for manual actions)
    user_id uuid references public.users(id) on delete set null,

    -- Metadata
    created_at timestamptz default now() not null
);

-- =====================================================
-- 5. LAB RESULT COMMENTS TABLE (For clinician discussions)
-- =====================================================
create table if not exists public.lab_result_comments (
    id uuid default gen_random_uuid() primary key,

    result_id uuid not null references public.lab_results(id) on delete cascade,
    user_id uuid not null references public.users(id),

    comment text not null,
    is_internal boolean default false, -- Internal note vs patient-visible

    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null
);

-- =====================================================
-- 6. INDEXES FOR PERFORMANCE
-- =====================================================

-- Lab test catalog indexes
create index idx_lab_test_catalog_chiron_code on public.lab_test_catalog(chiron_test_code);
create index idx_lab_test_catalog_loinc on public.lab_test_catalog(loinc_code) where loinc_code is not null;
create index idx_lab_test_catalog_category on public.lab_test_catalog(category);
create index idx_lab_test_catalog_active on public.lab_test_catalog(is_active) where is_active = true;
create index idx_lab_test_catalog_search on public.lab_test_catalog using gin(to_tsvector('english', chiron_test_name || ' ' || coalesce(search_terms, '')));

-- Lab orders indexes
create index idx_lab_orders_patient_id on public.lab_orders(patient_id);
create index idx_lab_orders_ordering_doctor on public.lab_orders(ordering_doctor_id);
create index idx_lab_orders_status on public.lab_orders(status);
create index idx_lab_orders_practice_code on public.lab_orders(practice_code);
create index idx_lab_orders_chiron_order_id on public.lab_orders(chiron_order_id) where chiron_order_id is not null;
create index idx_lab_orders_created_at on public.lab_orders(created_at desc);
create index idx_lab_orders_pending on public.lab_orders(status, created_at desc) where status in ('pending', 'sent', 'in_progress');

-- Lab results indexes (CRITICAL FOR PERFORMANCE)
create index idx_lab_results_patient_id on public.lab_results(patient_id, collection_datetime desc);
create index idx_lab_results_order_id on public.lab_results(order_id) where order_id is not null;
create index idx_lab_results_chiron_accession on public.lab_results(chiron_accession_number);
create index idx_lab_results_chiron_result_id on public.lab_results(chiron_result_id) where chiron_result_id is not null;
create index idx_lab_results_practice_code on public.lab_results(practice_code);
create index idx_lab_results_collection_date on public.lab_results(collection_datetime desc);
create index idx_lab_results_result_date on public.lab_results(result_datetime desc);
create index idx_lab_results_status on public.lab_results(result_status);
create index idx_lab_results_test_code on public.lab_results(test_code);
create index idx_lab_results_test_category on public.lab_results(test_category);

-- Critical values index (for alerts)
create index idx_lab_results_critical_unacknowledged on public.lab_results(patient_id, created_at desc)
    where abnormal_flag = 'CRITICAL' and critical_acknowledged = false;

-- Abnormal results index
create index idx_lab_results_abnormal on public.lab_results(patient_id, abnormal_flag, collection_datetime desc)
    where abnormal_flag != 'N' and abnormal_flag is not null;

-- Pending verification index
create index idx_lab_results_pending_verification on public.lab_results(result_status, result_datetime desc)
    where result_status = 'preliminary';

-- Doctor's patients results
create index idx_lab_results_doctor_patients on public.lab_results(ordering_doctor_id, result_datetime desc)
    where ordering_doctor_id is not null;

-- Integration logs indexes
create index idx_lab_integration_logs_created on public.lab_integration_logs(created_at desc);
create index idx_lab_integration_logs_event_type on public.lab_integration_logs(event_type, created_at desc);
create index idx_lab_integration_logs_status on public.lab_integration_logs(status) where status = 'failure';
create index idx_lab_integration_logs_patient_id on public.lab_integration_logs(patient_id) where patient_id is not null;
create index idx_lab_integration_logs_severity on public.lab_integration_logs(severity, created_at desc) where severity in ('error', 'critical');

-- Lab result comments indexes
create index idx_lab_result_comments_result_id on public.lab_result_comments(result_id, created_at);

-- =====================================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
alter table public.lab_test_catalog enable row level security;
alter table public.lab_orders enable row level security;
alter table public.lab_results enable row level security;
alter table public.lab_integration_logs enable row level security;
alter table public.lab_result_comments enable row level security;

-- Lab test catalog policies (catalog is accessible to all authenticated users)
create policy "Authenticated users can view lab test catalog"
    on public.lab_test_catalog for select
    to authenticated
    using (is_active = true);

create policy "Admins can manage lab test catalog"
    on public.lab_test_catalog for all
    to authenticated
    using (
        exists (select 1 from public.users where users.id = auth.uid() and users.role = 'admin')
    );

-- Lab orders policies (practice isolation + role-based access)
create policy "Users can view lab orders from their practice"
    on public.lab_orders for select
    to authenticated
    using (
        -- Admins see all
        exists (select 1 from public.users where users.id = auth.uid() and users.role = 'admin')
        or
        -- Users see their practice's orders
        practice_code in (select practice_code from public.users where users.id = auth.uid())
    );

create policy "Doctors and receptionists can create lab orders"
    on public.lab_orders for insert
    to authenticated
    with check (
        exists (
            select 1 from public.users
            where users.id = auth.uid()
            and users.role in ('doctor', 'receptionist', 'admin')
            and users.practice_code = lab_orders.practice_code
        )
    );

create policy "Doctors can update their own lab orders"
    on public.lab_orders for update
    to authenticated
    using (
        exists (select 1 from public.users where users.id = auth.uid() and users.role = 'admin')
        or
        ordering_doctor_id = auth.uid()
    );

-- Lab results policies (practice isolation + privacy)
create policy "Users can view lab results from their practice"
    on public.lab_results for select
    to authenticated
    using (
        -- Admins see all
        exists (select 1 from public.users where users.id = auth.uid() and users.role = 'admin')
        or
        -- Users see their practice's results
        practice_code in (select practice_code from public.users where users.id = auth.uid())
    );

create policy "System can insert lab results"
    on public.lab_results for insert
    to authenticated
    with check (true); -- Edge function uses service role, but keep policy for audit

create policy "Doctors can update lab results (add notes)"
    on public.lab_results for update
    to authenticated
    using (
        exists (
            select 1 from public.users
            where users.id = auth.uid()
            and users.role in ('doctor', 'admin')
            and users.practice_code = lab_results.practice_code
        )
    );

-- Integration logs policies (admin only)
create policy "Admins can view integration logs"
    on public.lab_integration_logs for select
    to authenticated
    using (
        exists (select 1 from public.users where users.id = auth.uid() and users.role = 'admin')
    );

create policy "System can insert integration logs"
    on public.lab_integration_logs for insert
    to authenticated
    with check (true);

-- Lab result comments policies
create policy "Users can view comments on results they can see"
    on public.lab_result_comments for select
    to authenticated
    using (
        exists (
            select 1 from public.lab_results lr
            join public.users u on u.id = auth.uid()
            where lr.id = lab_result_comments.result_id
            and (u.role = 'admin' or lr.practice_code = u.practice_code)
        )
    );

create policy "Doctors can add comments to lab results"
    on public.lab_result_comments for insert
    to authenticated
    with check (
        exists (
            select 1 from public.users
            where users.id = auth.uid()
            and users.role in ('doctor', 'admin')
        )
    );

-- =====================================================
-- 8. TRIGGERS
-- =====================================================

-- Auto-update updated_at columns
create trigger update_lab_test_catalog_updated_at
    before update on public.lab_test_catalog
    for each row
    execute function update_updated_at_column();

create trigger update_lab_orders_updated_at
    before update on public.lab_orders
    for each row
    execute function update_updated_at_column();

create trigger update_lab_results_updated_at
    before update on public.lab_results
    for each row
    execute function update_updated_at_column();

create trigger update_lab_result_comments_updated_at
    before update on public.lab_result_comments
    for each row
    execute function update_updated_at_column();

-- Track when results are first viewed
create or replace function track_lab_result_first_view()
returns trigger as $$
begin
    -- If this is the first view (viewed_by array was empty or NULL and is now being populated)
    if (old.viewed_by is null or array_length(old.viewed_by, 1) is null)
       and new.viewed_by is not null
       and array_length(new.viewed_by, 1) > 0 then
        new.first_viewed_at := now();
        new.first_viewed_by := new.viewed_by[1];
    end if;
    return new;
end;
$$ language plpgsql;

create trigger track_lab_result_first_view_trigger
    before update on public.lab_results
    for each row
    execute function track_lab_result_first_view();

-- Auto-update lab order results count
create or replace function update_lab_order_results_count()
returns trigger as $$
begin
    if TG_OP = 'INSERT' then
        update public.lab_orders
        set results_count = results_count + 1,
            results_received_at = case
                when results_count = 0 then now()
                else results_received_at
            end
        where id = new.order_id and new.order_id is not null;
    elsif TG_OP = 'DELETE' then
        update public.lab_orders
        set results_count = greatest(results_count - 1, 0)
        where id = old.order_id and old.order_id is not null;
    end if;
    return coalesce(new, old);
end;
$$ language plpgsql;

create trigger update_lab_order_results_count_trigger
    after insert or delete on public.lab_results
    for each row
    execute function update_lab_order_results_count();

-- =====================================================
-- 9. HELPER FUNCTIONS
-- =====================================================

-- Function to find patient by ID number (for webhook patient matching)
create or replace function find_patient_by_id_number(p_id_number varchar)
returns table (
    patient_id uuid,
    patient_name text,
    practice_code varchar,
    match_confidence varchar
) as $$
begin
    return query
    select
        p.id as patient_id,
        p.first_name || ' ' || p.surname as patient_name,
        p.practice_code,
        case
            when p.id_number = p_id_number then 'exact'
            else 'fuzzy'
        end as match_confidence
    from public.patients p
    where p.id_number = p_id_number
    order by p.created_at desc
    limit 1;
end;
$$ language plpgsql security definer;

-- Function to get patient's lab results summary
create or replace function get_patient_lab_summary(p_patient_id uuid)
returns table (
    total_results bigint,
    critical_count bigint,
    abnormal_count bigint,
    recent_tests jsonb,
    last_test_date timestamptz
) as $$
begin
    return query
    select
        count(*) as total_results,
        count(*) filter (where abnormal_flag = 'CRITICAL') as critical_count,
        count(*) filter (where abnormal_flag != 'N' and abnormal_flag is not null) as abnormal_count,
        jsonb_agg(
            jsonb_build_object(
                'test_name', lr.test_name,
                'result_value', lr.result_value,
                'abnormal_flag', lr.abnormal_flag,
                'collection_datetime', lr.collection_datetime
            ) order by lr.collection_datetime desc
        ) filter (where row_num <= 5) as recent_tests,
        max(lr.collection_datetime) as last_test_date
    from (
        select *,
               row_number() over (order by collection_datetime desc) as row_num
        from public.lab_results
        where patient_id = p_patient_id
    ) lr;
end;
$$ language plpgsql security definer;

-- Function to get critical lab results requiring attention
create or replace function get_critical_lab_results(p_practice_code varchar default null)
returns table (
    result_id uuid,
    patient_id uuid,
    patient_name text,
    test_name varchar,
    result_value text,
    abnormal_flag varchar,
    collection_datetime timestamptz,
    age_hours numeric,
    acknowledged boolean
) as $$
begin
    return query
    select
        lr.id as result_id,
        lr.patient_id,
        p.first_name || ' ' || p.surname as patient_name,
        lr.test_name,
        lr.result_value,
        lr.abnormal_flag,
        lr.collection_datetime,
        extract(epoch from (now() - lr.reported_datetime)) / 3600 as age_hours,
        lr.critical_acknowledged as acknowledged
    from public.lab_results lr
    join public.patients p on p.id = lr.patient_id
    where lr.abnormal_flag = 'CRITICAL'
    and (p_practice_code is null or lr.practice_code = p_practice_code)
    order by lr.critical_acknowledged, lr.reported_datetime desc;
end;
$$ language plpgsql security definer;

-- Function to mark result as viewed by user
create or replace function mark_lab_result_viewed(p_result_id uuid, p_user_id uuid)
returns void as $$
begin
    update public.lab_results
    set viewed_by = array_append(viewed_by, p_user_id)
    where id = p_result_id
    and not (p_user_id = any(viewed_by)); -- Only add if not already in array
end;
$$ language plpgsql security definer;

-- Function to acknowledge critical result
create or replace function acknowledge_critical_result(
    p_result_id uuid,
    p_user_id uuid,
    p_notes text default null
)
returns void as $$
begin
    update public.lab_results
    set
        critical_acknowledged = true,
        acknowledged_by = p_user_id,
        acknowledged_at = now(),
        clinician_notes = coalesce(clinician_notes || E'\n\n' || p_notes, p_notes)
    where id = p_result_id
    and abnormal_flag = 'CRITICAL';

    -- Log the acknowledgment
    insert into public.lab_integration_logs (
        event_type,
        direction,
        result_id,
        patient_id,
        user_id,
        status
    )
    select
        'critical_alert_acknowledged',
        'internal',
        id,
        patient_id,
        p_user_id,
        'success'
    from public.lab_results
    where id = p_result_id;
end;
$$ language plpgsql security definer;

-- =====================================================
-- 10. ENABLE REALTIME
-- =====================================================

-- Enable realtime for lab results (so doctors get instant notifications)
alter publication supabase_realtime add table public.lab_results;
alter publication supabase_realtime add table public.lab_orders;

-- =====================================================
-- 11. COMMENTS ON TABLES (Documentation)
-- =====================================================

comment on table public.lab_test_catalog is 'Catalog of available lab tests from Chiron';
comment on table public.lab_orders is 'Lab test orders sent to Chiron (Phase 2)';
comment on table public.lab_results is 'Lab test results received from Chiron';
comment on table public.lab_integration_logs is 'Audit trail of all Chiron integration events';
comment on table public.lab_result_comments is 'Clinician comments and discussions on lab results';

comment on column public.lab_results.abnormal_flag is 'N=Normal, L=Low, H=High, LL=Very Low, HH=Very High, CRITICAL=Requires immediate attention';
comment on column public.lab_results.result_status is 'Lifecycle: preliminary -> final -> (corrected/amended if needed)';
comment on column public.lab_results.raw_data is 'Complete original JSON payload from Chiron for audit and debugging';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

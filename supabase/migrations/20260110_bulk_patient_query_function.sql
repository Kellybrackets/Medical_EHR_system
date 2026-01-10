-- Performance Optimization: Bulk patient query function to eliminate N+1 queries
-- Issue: Current implementation makes 3 separate queries (patients, insurance, next_of_kin)
-- Solution: Single RPC function that joins all related data server-side

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS get_all_patients_with_relations();

-- Create optimized function to fetch all patients with related data in a single query
CREATE OR REPLACE FUNCTION get_all_patients_with_relations()
RETURNS TABLE (
  id UUID,
  first_name VARCHAR,
  surname VARCHAR,
  id_type VARCHAR,
  id_number VARCHAR,
  sex VARCHAR,
  date_of_birth DATE,
  age INTEGER,
  contact_number VARCHAR,
  alternate_number VARCHAR,
  email VARCHAR,
  address TEXT,
  city VARCHAR,
  postal_code VARCHAR,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  consultation_status VARCHAR,
  current_doctor_id UUID,
  last_status_change TIMESTAMPTZ,
  visit_type VARCHAR,
  visit_reason TEXT,
  payment_method VARCHAR,
  parent_id UUID,
  is_dependent BOOLEAN,
  practice_code VARCHAR,

  -- Insurance details as JSONB
  insurance_details JSONB,

  -- Next of kin as JSONB
  next_of_kin JSONB
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.first_name,
    p.surname,
    p.id_type,
    p.id_number,
    p.sex,
    p.date_of_birth,
    p.age,
    p.contact_number,
    p.alternate_number,
    p.email,
    p.address,
    p.city,
    p.postal_code,
    p.created_at,
    p.updated_at,
    p.consultation_status,
    p.current_doctor_id,
    p.last_status_change,
    p.visit_type,
    p.visit_reason,
    p.payment_method,
    p.parent_id,
    p.is_dependent,
    p.practice_code,

    -- Build insurance details JSON object
    CASE
      WHEN ins.id IS NOT NULL THEN
        jsonb_build_object(
          'id', ins.id,
          'patient_id', ins.patient_id,
          'fund_name', ins.fund_name,
          'member_number', ins.member_number,
          'plan', ins.plan,
          'scheme_code', ins.scheme_code,
          'created_at', ins.created_at,
          'updated_at', ins.updated_at
        )
      ELSE NULL
    END AS insurance_details,

    -- Build next of kin JSON object
    CASE
      WHEN nok.id IS NOT NULL THEN
        jsonb_build_object(
          'id', nok.id,
          'patient_id', nok.patient_id,
          'name', nok.name,
          'relationship', nok.relationship,
          'phone', nok.phone,
          'alternate_phone', nok.alternate_phone,
          'email', nok.email,
          'created_at', nok.created_at,
          'updated_at', nok.updated_at
        )
      ELSE NULL
    END AS next_of_kin

  FROM patients p
  LEFT JOIN insurance_details ins ON ins.patient_id = p.id
  LEFT JOIN next_of_kin nok ON nok.patient_id = p.id
  ORDER BY p.created_at DESC;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_all_patients_with_relations() TO authenticated;

-- Add helpful comment
COMMENT ON FUNCTION get_all_patients_with_relations() IS
  'Optimized bulk query that fetches all patients with their insurance and next of kin data in a single database round trip. Eliminates N+1 query pattern.';

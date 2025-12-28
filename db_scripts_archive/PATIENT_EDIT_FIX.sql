-- ==============================================
-- FIX PATIENT EDIT FORM LOADING
-- ==============================================
-- Run this SQL in your Supabase SQL Editor

-- 1. Drop the broken function and recreate it with correct types
DROP FUNCTION IF EXISTS get_all_patients_with_medical();

-- 2. Create a simpler function that works with the actual schema
CREATE OR REPLACE FUNCTION get_all_patients_with_medical()
RETURNS TABLE (
    id UUID,
    first_name TEXT,
    surname TEXT,
    id_number TEXT,
    sex TEXT,
    date_of_birth DATE,
    age INTEGER,
    contact_number TEXT,
    alternate_number TEXT,
    email TEXT,
    address TEXT,
    city TEXT,
    postal_code TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    medical_history JSON,
    insurance_details JSON,
    next_of_kin JSON
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.first_name,
        p.surname,
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
        CASE 
            WHEN mh.id IS NOT NULL THEN json_build_object(
                'id', mh.id,
                'height', mh.height,
                'weight', mh.weight,
                'bloodType', mh.blood_type,
                'allergies', COALESCE(mh.allergies, ARRAY[]::TEXT[]),
                'chronicConditions', COALESCE(mh.chronic_conditions, ARRAY[]::TEXT[]),
                'currentMedications', COALESCE(mh.current_medications, ARRAY[]::TEXT[]),
                'pastSurgeries', COALESCE(mh.past_surgeries, ARRAY[]::TEXT[]),
                'familyHistory', mh.family_history,
                'smokingStatus', COALESCE(mh.smoking_status, 'never'),
                'alcoholConsumption', COALESCE(mh.alcohol_consumption, 'never')
            )
            ELSE NULL
        END as medical_history,
        CASE 
            WHEN ins.id IS NOT NULL THEN json_build_object(
                'id', ins.id,
                'fundName', ins.fund_name,
                'memberNumber', ins.member_number,
                'plan', ins.plan
            )
            ELSE NULL
        END as insurance_details,
        CASE 
            WHEN nok.id IS NOT NULL THEN json_build_object(
                'id', nok.id,
                'name', nok.name,
                'relationship', nok.relationship,
                'phone', nok.phone,
                'alternatePhone', nok.alternate_phone,
                'email', nok.email
            ) 
            ELSE NULL
        END as next_of_kin
    FROM patients p
    LEFT JOIN medical_histories mh ON p.id = mh.patient_id  
    LEFT JOIN insurance_details ins ON p.id = ins.patient_id
    LEFT JOIN next_of_kin nok ON p.id = nok.patient_id
    ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Fix the next_of_kin table constraint issue
ALTER TABLE next_of_kin ADD CONSTRAINT next_of_kin_patient_id_unique UNIQUE (patient_id);

-- 4. Grant permissions
GRANT EXECUTE ON FUNCTION get_all_patients_with_medical() TO authenticated;

-- 5. Test the function
SELECT 'Testing function...' as status;
SELECT COUNT(*) as patient_count FROM get_all_patients_with_medical();
-- ========================================
-- COMPLETE DATA FLOW FIX
-- ========================================
-- This migration fixes all patient data loading and display issues

-- 1. Clean up any malformed data in existing tables
UPDATE medical_histories 
SET 
    allergies = ARRAY[]::TEXT[]
WHERE 
    allergies IS NOT NULL 
    AND (
        array_length(allergies, 1) = 1 
        AND allergies[1] IN ('nom', 'xom', 'lom', 'gt', '', 'null', 'undefined')
    );

UPDATE medical_histories 
SET 
    chronic_conditions = ARRAY[]::TEXT[]
WHERE 
    chronic_conditions IS NOT NULL 
    AND (
        array_length(chronic_conditions, 1) = 1 
        AND chronic_conditions[1] IN ('nom', 'xom', 'lom', 'gt', '', 'null', 'undefined')
    );

UPDATE medical_histories 
SET 
    current_medications = ARRAY[]::TEXT[]
WHERE 
    current_medications IS NOT NULL 
    AND (
        array_length(current_medications, 1) = 1 
        AND current_medications[1] IN ('nom', 'xom', 'lom', 'gt', '', 'null', 'undefined')
    );

UPDATE medical_histories 
SET 
    past_surgeries = ARRAY[]::TEXT[]
WHERE 
    past_surgeries IS NOT NULL 
    AND (
        array_length(past_surgeries, 1) = 1 
        AND past_surgeries[1] IN ('nom', 'xom', 'lom', 'gt', '', 'null', 'undefined')
    );

-- 2. Create function to get complete patient data
CREATE OR REPLACE FUNCTION get_complete_patient_data(patient_uuid UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'id', p.id,
        'firstName', p.first_name,
        'surname', p.surname,
        'idNumber', p.id_number,
        'sex', p.sex,
        'dateOfBirth', p.date_of_birth,
        'age', p.age,
        'contactNumber', p.contact_number,
        'alternateNumber', p.alternate_number,
        'email', p.email,
        'address', p.address,
        'city', p.city,
        'postalCode', p.postal_code,
        'createdAt', p.created_at,
        'updatedAt', p.updated_at,
        'nextOfKin', CASE 
            WHEN nok.id IS NOT NULL THEN json_build_object(
                'id', nok.id,
                'name', nok.name,
                'relationship', nok.relationship,
                'phone', nok.phone,
                'alternatePhone', nok.alternate_phone,
                'email', nok.email
            ) 
            ELSE NULL
        END,
        'medicalHistory', CASE 
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
        END,
        'insuranceDetails', CASE 
            WHEN ins.id IS NOT NULL THEN json_build_object(
                'id', ins.id,
                'fundName', ins.fund_name,
                'memberNumber', ins.member_number,
                'plan', ins.plan
            )
            ELSE NULL
        END
    ) INTO result
    FROM patients p
    LEFT JOIN next_of_kin nok ON p.id = nok.patient_id
    LEFT JOIN medical_histories mh ON p.id = mh.patient_id  
    LEFT JOIN insurance_details ins ON p.id = ins.patient_id
    WHERE p.id = patient_uuid;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create function to get all patients with basic medical info
CREATE OR REPLACE FUNCTION get_all_patients_with_medical()
RETURNS TABLE (
    id UUID,
    first_name VARCHAR,
    surname VARCHAR,
    id_number VARCHAR,
    sex VARCHAR,
    date_of_birth DATE,
    age INTEGER,
    contact_number VARCHAR,
    alternate_number VARCHAR,
    email VARCHAR,
    address VARCHAR,
    city VARCHAR,
    postal_code VARCHAR,
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

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_complete_patient_data(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_all_patients_with_medical() TO authenticated;

-- Verify data integrity
DO $$
DECLARE
    total_patients INTEGER;
    patients_with_medical INTEGER;
    patients_with_insurance INTEGER;
    patients_with_kin INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_patients FROM patients;
    SELECT COUNT(DISTINCT patient_id) INTO patients_with_medical FROM medical_histories;
    SELECT COUNT(DISTINCT patient_id) INTO patients_with_insurance FROM insurance_details;
    SELECT COUNT(DISTINCT patient_id) INTO patients_with_kin FROM next_of_kin;
    
    RAISE NOTICE 'Data integrity check:';
    RAISE NOTICE '- Total patients: %', total_patients;
    RAISE NOTICE '- Patients with medical history: %', patients_with_medical;
    RAISE NOTICE '- Patients with insurance: %', patients_with_insurance;
    RAISE NOTICE '- Patients with next of kin: %', patients_with_kin;
END $$;
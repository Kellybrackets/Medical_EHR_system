-- ========================================
-- FIX MEDICAL INFORMATION FIELDS
-- ========================================
-- This migration fixes the medical_histories table structure and ensures all fields work properly

-- First, let's check the current structure and add any missing fields
DO $$
BEGIN
    -- Add missing columns to medical_histories if they don't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'medical_histories' AND column_name = 'past_surgeries'
    ) THEN
        ALTER TABLE medical_histories ADD COLUMN past_surgeries TEXT[] DEFAULT ARRAY[]::TEXT[];
    END IF;

    -- Ensure height and weight have proper precision
    ALTER TABLE medical_histories 
    ALTER COLUMN height TYPE NUMERIC(5,2),
    ALTER COLUMN weight TYPE NUMERIC(5,2);

    -- Ensure arrays have proper defaults
    UPDATE medical_histories 
    SET 
        allergies = COALESCE(allergies, ARRAY[]::TEXT[]),
        chronic_conditions = COALESCE(chronic_conditions, ARRAY[]::TEXT[]),
        current_medications = COALESCE(current_medications, ARRAY[]::TEXT[]),
        past_surgeries = COALESCE(past_surgeries, ARRAY[]::TEXT[])
    WHERE 
        allergies IS NULL OR 
        chronic_conditions IS NULL OR 
        current_medications IS NULL OR 
        past_surgeries IS NULL;

    -- Set proper constraints
    ALTER TABLE medical_histories 
    ALTER COLUMN allergies SET DEFAULT ARRAY[]::TEXT[],
    ALTER COLUMN chronic_conditions SET DEFAULT ARRAY[]::TEXT[],
    ALTER COLUMN current_medications SET DEFAULT ARRAY[]::TEXT[],
    ALTER COLUMN past_surgeries SET DEFAULT ARRAY[]::TEXT[];

    -- Ensure smoking_status and alcohol_consumption have proper defaults
    UPDATE medical_histories 
    SET 
        smoking_status = COALESCE(smoking_status, 'never'),
        alcohol_consumption = COALESCE(alcohol_consumption, 'never')
    WHERE 
        smoking_status IS NULL OR 
        alcohol_consumption IS NULL;

    ALTER TABLE medical_histories 
    ALTER COLUMN smoking_status SET DEFAULT 'never',
    ALTER COLUMN alcohol_consumption SET DEFAULT 'never';

END $$;

-- Clean up any malformed array data
-- Fix arrays that might have invalid JSON or malformed data
UPDATE medical_histories 
SET 
    allergies = CASE 
        WHEN array_length(allergies, 1) > 0 AND allergies[1] IN ('nom', 'xom', 'lom', '') 
        THEN ARRAY[]::TEXT[]
        ELSE allergies
    END,
    chronic_conditions = CASE 
        WHEN array_length(chronic_conditions, 1) > 0 AND chronic_conditions[1] IN ('nom', 'xom', 'lom', '') 
        THEN ARRAY[]::TEXT[]
        ELSE chronic_conditions
    END,
    current_medications = CASE 
        WHEN array_length(current_medications, 1) > 0 AND current_medications[1] IN ('nom', 'xom', 'lom', '') 
        THEN ARRAY[]::TEXT[]
        ELSE current_medications
    END;

-- Fix any invalid height/weight values
UPDATE medical_histories 
SET 
    height = NULL
WHERE height IS NOT NULL AND (height < 30 OR height > 300);

UPDATE medical_histories 
SET 
    weight = NULL  
WHERE weight IS NOT NULL AND (weight < 1 OR weight > 500);

-- Create view for easy patient data retrieval with all medical information
CREATE OR REPLACE VIEW patient_full_details AS
SELECT 
    p.*,
    nok.id as next_of_kin_id,
    nok.name as next_of_kin_name,
    nok.relationship as next_of_kin_relationship,
    nok.phone as next_of_kin_phone,
    nok.alternate_phone as next_of_kin_alternate_phone,
    nok.email as next_of_kin_email,
    mh.id as medical_history_id,
    mh.height,
    mh.weight,
    mh.blood_type,
    mh.allergies,
    mh.chronic_conditions,
    mh.current_medications,
    mh.past_surgeries,
    mh.family_history,
    mh.smoking_status,
    mh.alcohol_consumption,
    ins.id as insurance_id,
    ins.fund_name,
    ins.member_number,
    ins.plan
FROM patients p
LEFT JOIN next_of_kin nok ON p.id = nok.patient_id
LEFT JOIN medical_histories mh ON p.id = mh.patient_id
LEFT JOIN insurance_details ins ON p.id = ins.patient_id;

-- Grant permissions on the view
GRANT SELECT ON patient_full_details TO authenticated;

-- Create function to get patient with full details
CREATE OR REPLACE FUNCTION get_patient_full_details(patient_uuid UUID)
RETURNS JSON AS $$
DECLARE
    patient_data JSON;
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
                'patientId', nok.patient_id,
                'name', nok.name,
                'relationship', nok.relationship,
                'phone', nok.phone,
                'alternatePhone', nok.alternate_phone,
                'email', nok.email,
                'createdAt', nok.created_at,
                'updatedAt', nok.updated_at
            ) 
            ELSE NULL
        END,
        'medicalHistory', CASE 
            WHEN mh.id IS NOT NULL THEN json_build_object(
                'id', mh.id,
                'patientId', mh.patient_id,
                'height', mh.height,
                'weight', mh.weight,
                'bloodType', mh.blood_type,
                'allergies', mh.allergies,
                'chronicConditions', mh.chronic_conditions,
                'currentMedications', mh.current_medications,
                'pastSurgeries', mh.past_surgeries,
                'familyHistory', mh.family_history,
                'smokingStatus', mh.smoking_status,
                'alcoholConsumption', mh.alcohol_consumption,
                'createdAt', mh.created_at,
                'updatedAt', mh.updated_at
            )
            ELSE NULL
        END,
        'insuranceDetails', CASE 
            WHEN ins.id IS NOT NULL THEN json_build_object(
                'id', ins.id,
                'patientId', ins.patient_id,
                'fundName', ins.fund_name,
                'memberNumber', ins.member_number,
                'plan', ins.plan,
                'createdAt', ins.created_at,
                'updatedAt', ins.updated_at
            )
            ELSE NULL
        END
    ) INTO patient_data
    FROM patients p
    LEFT JOIN next_of_kin nok ON p.id = nok.patient_id
    LEFT JOIN medical_histories mh ON p.id = mh.patient_id  
    LEFT JOIN insurance_details ins ON p.id = ins.patient_id
    WHERE p.id = patient_uuid;
    
    RETURN patient_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_patient_full_details(UUID) TO authenticated;

-- Verify the data structure
DO $$
DECLARE
    patient_count INTEGER;
    medical_history_count INTEGER;
    insurance_count INTEGER;
    next_of_kin_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO patient_count FROM patients;
    SELECT COUNT(*) INTO medical_history_count FROM medical_histories;
    SELECT COUNT(*) INTO insurance_count FROM insurance_details;
    SELECT COUNT(*) INTO next_of_kin_count FROM next_of_kin;
    
    RAISE NOTICE 'Data verification:';
    RAISE NOTICE '- Patients: %', patient_count;
    RAISE NOTICE '- Medical Histories: %', medical_history_count;
    RAISE NOTICE '- Insurance Details: %', insurance_count;
    RAISE NOTICE '- Next of Kin: %', next_of_kin_count;
END $$;
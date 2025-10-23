-- ========================================
-- DATA MIGRATION SCRIPT
-- ========================================
-- This script migrates existing malformed JSONB data to the new normalized structure
-- Run this AFTER the normalized schema migration

-- ========================================
-- 1. CREATE TEMPORARY TABLE TO BACKUP OLD DATA
-- ========================================
-- First, let's create a backup of the old patients table if it exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'patients_backup') THEN
        DROP TABLE patients_backup;
    END IF;
    
    -- Only create backup if old patients table exists
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'patients' 
        AND EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = 'patients' 
            AND column_name = 'next_of_kin' 
            AND data_type = 'jsonb'
        )
    ) THEN
        CREATE TABLE patients_backup AS SELECT * FROM patients;
    END IF;
END $$;

-- ========================================
-- 2. MIGRATE DATA FROM OLD JSONB STRUCTURE
-- ========================================
-- Note: This assumes you have old data in JSONB format
-- If starting fresh, you can skip this section

-- Insert into patients table (extracting from old JSONB structure)
DO $$
BEGIN
    -- Only proceed if backup table exists (meaning we had old data)
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'patients_backup') THEN
        
        -- Insert patients data
        INSERT INTO patients (
            id, first_name, surname, id_number, sex, date_of_birth, age,
            contact_number, alternate_number, email, address, city, postal_code,
            created_at, updated_at
        )
        SELECT 
            id,
            first_name,
            surname,
            id_number,
            sex,
            date_of_birth,
            age,
            contact_number,
            -- Extract from old JSONB or use NULL
            COALESCE(
                CASE 
                    WHEN next_of_kin ? 'alternatePhone' THEN next_of_kin->>'alternatePhone'
                    WHEN next_of_kin ? 'alternate_phone' THEN next_of_kin->>'alternate_phone'
                    ELSE NULL 
                END, 
                NULL
            ) as alternate_number,
            COALESCE(
                CASE 
                    WHEN next_of_kin ? 'email' THEN next_of_kin->>'email'
                    ELSE NULL 
                END, 
                NULL
            ) as email,
            address,
            -- Extract city from address if possible, otherwise NULL
            NULL as city,
            NULL as postal_code,
            created_at,
            updated_at
        FROM patients_backup;

        -- Insert next_of_kin data
        INSERT INTO next_of_kin (
            patient_id, name, relationship, phone, alternate_phone, email
        )
        SELECT 
            p.id as patient_id,
            COALESCE(p.next_of_kin->>'name', 'Unknown') as name,
            COALESCE(p.next_of_kin->>'relationship', 'Unknown') as relationship,
            COALESCE(p.next_of_kin->>'phone', p.contact_number) as phone,
            CASE 
                WHEN p.next_of_kin ? 'alternatePhone' THEN p.next_of_kin->>'alternatePhone'
                WHEN p.next_of_kin ? 'alternate_phone' THEN p.next_of_kin->>'alternate_phone'
                ELSE NULL 
            END as alternate_phone,
            CASE 
                WHEN p.next_of_kin ? 'email' THEN p.next_of_kin->>'email'
                ELSE NULL 
            END as email
        FROM patients_backup p
        WHERE p.next_of_kin IS NOT NULL;

        -- Insert medical_histories data
        INSERT INTO medical_histories (
            patient_id, height, weight, blood_type, allergies, chronic_conditions,
            current_medications, past_surgeries, family_history, smoking_status, alcohol_consumption
        )
        SELECT 
            p.id as patient_id,
            -- Extract numeric values safely
            CASE 
                WHEN p.medical_history ? 'height' AND (p.medical_history->>'height')::text ~ '^[0-9]+\.?[0-9]*$'
                THEN (p.medical_history->>'height')::numeric
                ELSE NULL 
            END as height,
            CASE 
                WHEN p.medical_history ? 'weight' AND (p.medical_history->>'weight')::text ~ '^[0-9]+\.?[0-9]*$'
                THEN (p.medical_history->>'weight')::numeric
                ELSE NULL 
            END as weight,
            CASE 
                WHEN p.medical_history ? 'bloodType' THEN p.medical_history->>'bloodType'
                WHEN p.medical_history ? 'blood_type' THEN p.medical_history->>'blood_type'
                ELSE NULL 
            END as blood_type,
            -- Convert JSONB arrays to TEXT arrays
            CASE 
                WHEN p.medical_history ? 'allergies' AND jsonb_typeof(p.medical_history->'allergies') = 'array'
                THEN ARRAY(SELECT jsonb_array_elements_text(p.medical_history->'allergies'))
                WHEN p.medical_history ? 'allergies' AND p.medical_history->>'allergies' != ''
                THEN string_to_array(p.medical_history->>'allergies', ',')
                ELSE ARRAY[]::text[]
            END as allergies,
            CASE 
                WHEN p.medical_history ? 'chronicConditions' AND jsonb_typeof(p.medical_history->'chronicConditions') = 'array'
                THEN ARRAY(SELECT jsonb_array_elements_text(p.medical_history->'chronicConditions'))
                WHEN p.medical_history ? 'chronic_conditions' AND jsonb_typeof(p.medical_history->'chronic_conditions') = 'array'
                THEN ARRAY(SELECT jsonb_array_elements_text(p.medical_history->'chronic_conditions'))
                WHEN p.medical_history ? 'chronicConditions' AND p.medical_history->>'chronicConditions' != ''
                THEN string_to_array(p.medical_history->>'chronicConditions', ',')
                ELSE ARRAY[]::text[]
            END as chronic_conditions,
            CASE 
                WHEN p.medical_history ? 'currentMedications' AND jsonb_typeof(p.medical_history->'currentMedications') = 'array'
                THEN ARRAY(SELECT jsonb_array_elements_text(p.medical_history->'currentMedications'))
                WHEN p.medical_history ? 'current_medications' AND jsonb_typeof(p.medical_history->'current_medications') = 'array'
                THEN ARRAY(SELECT jsonb_array_elements_text(p.medical_history->'current_medications'))
                WHEN p.medical_history ? 'currentMedications' AND p.medical_history->>'currentMedications' != ''
                THEN string_to_array(p.medical_history->>'currentMedications', ',')
                ELSE ARRAY[]::text[]
            END as current_medications,
            CASE 
                WHEN p.medical_history ? 'pastDiagnoses' AND jsonb_typeof(p.medical_history->'pastDiagnoses') = 'array'
                THEN ARRAY(SELECT jsonb_array_elements_text(p.medical_history->'pastDiagnoses'))
                WHEN p.medical_history ? 'past_surgeries' AND jsonb_typeof(p.medical_history->'past_surgeries') = 'array'
                THEN ARRAY(SELECT jsonb_array_elements_text(p.medical_history->'past_surgeries'))
                WHEN p.medical_history ? 'pastDiagnoses' AND p.medical_history->>'pastDiagnoses' != ''
                THEN string_to_array(p.medical_history->>'pastDiagnoses', ',')
                ELSE ARRAY[]::text[]
            END as past_surgeries,
            CASE 
                WHEN p.medical_history ? 'familyHistory' THEN p.medical_history->>'familyHistory'
                WHEN p.medical_history ? 'family_history' THEN p.medical_history->>'family_history'
                ELSE NULL 
            END as family_history,
            CASE 
                WHEN p.medical_history ? 'smokingStatus' 
                AND p.medical_history->>'smokingStatus' IN ('never', 'former', 'current')
                THEN p.medical_history->>'smokingStatus'
                ELSE 'never'
            END as smoking_status,
            CASE 
                WHEN p.medical_history ? 'alcoholConsumption' 
                AND p.medical_history->>'alcoholConsumption' IN ('never', 'occasional', 'moderate', 'heavy')
                THEN p.medical_history->>'alcoholConsumption'
                ELSE 'never'
            END as alcohol_consumption
        FROM patients_backup p
        WHERE p.medical_history IS NOT NULL;

        -- Insert insurance_details data
        INSERT INTO insurance_details (
            patient_id, fund_name, member_number, plan
        )
        SELECT 
            p.id as patient_id,
            CASE 
                WHEN p.medical_aid ? 'fundName' THEN p.medical_aid->>'fundName'
                WHEN p.medical_aid ? 'fund_name' THEN p.medical_aid->>'fund_name'
                ELSE NULL 
            END as fund_name,
            CASE 
                WHEN p.medical_aid ? 'memberNumber' THEN p.medical_aid->>'memberNumber'
                WHEN p.medical_aid ? 'member_number' THEN p.medical_aid->>'member_number'
                ELSE NULL 
            END as member_number,
            CASE 
                WHEN p.medical_aid ? 'plan' THEN p.medical_aid->>'plan'
                ELSE NULL 
            END as plan
        FROM patients_backup p
        WHERE p.medical_aid IS NOT NULL;

    END IF;
END $$;

-- ========================================
-- 3. MIGRATE CONSULTATION NOTES
-- ========================================
-- Convert old consultation_notes format to SOAP format
DO $$
BEGIN
    -- Check if old consultation_notes_backup exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'consultation_notes_backup') THEN
        
        INSERT INTO consultation_notes (
            id, patient_id, doctor_id, date, reason_for_visit, icd10_code,
            subjective, objective, assessment, plan, created_at
        )
        SELECT 
            id,
            patient_id,
            doctor_id,
            date,
            reason_for_visit,
            icd10_code,
            -- Extract SOAP notes from old JSONB structure
            COALESCE(soap->>'subjective', '') as subjective,
            COALESCE(soap->>'objective', '') as objective,
            COALESCE(soap->>'assessment', '') as assessment,
            COALESCE(soap->>'plan', '') as plan,
            created_at
        FROM consultation_notes_backup;
        
    END IF;
END $$;

-- ========================================
-- 4. CLEANUP AND VERIFICATION
-- ========================================

-- Verify data migration counts
DO $$
DECLARE
    patient_count INTEGER;
    next_of_kin_count INTEGER;
    medical_history_count INTEGER;
    insurance_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO patient_count FROM patients;
    SELECT COUNT(*) INTO next_of_kin_count FROM next_of_kin;
    SELECT COUNT(*) INTO medical_history_count FROM medical_histories;
    SELECT COUNT(*) INTO insurance_count FROM insurance_details;
    
    RAISE NOTICE 'Migration completed:';
    RAISE NOTICE '- Patients: %', patient_count;
    RAISE NOTICE '- Next of Kin records: %', next_of_kin_count;
    RAISE NOTICE '- Medical History records: %', medical_history_count;
    RAISE NOTICE '- Insurance records: %', insurance_count;
END $$;

-- Optional: Drop backup tables after successful migration
-- Uncomment the following lines if you're confident the migration worked correctly
-- DROP TABLE IF EXISTS patients_backup;
-- DROP TABLE IF EXISTS consultation_notes_backup;
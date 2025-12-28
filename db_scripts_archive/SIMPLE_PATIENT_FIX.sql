-- Simple fix for patient edit form
-- This disables the broken function and fixes the constraint issue

-- 1. Drop the broken function so the app uses the working fallback
DROP FUNCTION IF EXISTS get_all_patients_with_medical();

-- 2. Fix the next_of_kin constraint for upserts to work
ALTER TABLE next_of_kin ADD CONSTRAINT IF NOT EXISTS next_of_kin_patient_id_unique UNIQUE (patient_id);

-- 3. Verify patients can be loaded
SELECT 'Patient data check:' as info, COUNT(*) as total_patients FROM patients;
SELECT 'Medical histories:' as info, COUNT(*) as total_medical FROM medical_histories;
SELECT 'Insurance details:' as info, COUNT(*) as total_insurance FROM insurance_details;
SELECT 'Next of kin:' as info, COUNT(*) as total_nextofkin FROM next_of_kin;
-- EHR Database Migration Script - Add Missing Columns
-- This script adds new columns to existing tables without dropping data
-- Run this in your Supabase SQL editor

-- =================================================================
-- 1. ADD MISSING COLUMNS TO PATIENTS TABLE
-- =================================================================

-- Add new contact information columns
ALTER TABLE patients 
ADD COLUMN IF NOT EXISTS alternate_number text,
ADD COLUMN IF NOT EXISTS email text,
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS postal_code text;

-- Update next_of_kin structure (if needed)
-- This will add new fields to the existing JSONB structure
UPDATE patients 
SET next_of_kin = next_of_kin || '{"alternatePhone": "", "email": ""}'
WHERE next_of_kin IS NOT NULL;

-- Update medical_history structure to include new fields
UPDATE patients 
SET medical_history = medical_history || '{
  "currentMedications": [],
  "familyHistory": "",
  "bloodType": "",
  "height": null,
  "weight": null,
  "smokingStatus": "never",
  "alcoholConsumption": "never"
}'
WHERE medical_history IS NOT NULL;

-- =================================================================
-- 2. UPDATE CONSULTATION_NOTES TABLE STRUCTURE
-- =================================================================

-- Add icd10_code column if it doesn't exist
ALTER TABLE consultation_notes 
ADD COLUMN IF NOT EXISTS icd10_code text;

-- For existing consultation notes, we need to convert the old format to SOAP
-- First, let's add the SOAP column if it doesn't exist
DO $$
BEGIN
    -- Check if soap column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'consultation_notes' AND column_name = 'soap'
    ) THEN
        -- Add SOAP column
        ALTER TABLE consultation_notes ADD COLUMN soap jsonb NOT NULL DEFAULT '{
            "subjective": "",
            "objective": "",
            "assessment": "",
            "plan": ""
        }';
        
        -- Migrate existing data from old columns to SOAP format
        UPDATE consultation_notes SET soap = jsonb_build_object(
            'subjective', COALESCE(notes, ''),
            'objective', 'Physical examination findings not recorded in legacy format',
            'assessment', COALESCE(diagnosis, ''),
            'plan', COALESCE(treatment, '')
        ) WHERE soap = '{"subjective": "", "objective": "", "assessment": "", "plan": ""}';
        
        RAISE NOTICE 'SOAP column added and existing data migrated';
    ELSE
        RAISE NOTICE 'SOAP column already exists';
    END IF;
END $$;

-- =================================================================
-- 3. UPDATE INDEXES FOR PERFORMANCE
-- =================================================================

-- Add new indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_patients_email ON patients(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_patients_city ON patients(city) WHERE city IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_consultation_notes_icd10 ON consultation_notes(icd10_code) WHERE icd10_code IS NOT NULL;

-- Update GIN indexes for enhanced JSONB search
DROP INDEX IF EXISTS idx_patients_medical_history_gin;
CREATE INDEX idx_patients_medical_history_gin ON patients USING GIN (medical_history);

DROP INDEX IF EXISTS idx_consultation_notes_soap_gin;
CREATE INDEX idx_consultation_notes_soap_gin ON consultation_notes USING GIN (soap);

-- =================================================================
-- 4. CLEAN UP OLD COLUMNS (Optional - Uncomment if you want to remove them)
-- =================================================================
-- WARNING: This will permanently delete the old columns and their data
-- Only uncomment these lines if you're sure you want to remove the old structure

-- ALTER TABLE consultation_notes DROP COLUMN IF EXISTS diagnosis;
-- ALTER TABLE consultation_notes DROP COLUMN IF EXISTS treatment;
-- ALTER TABLE consultation_notes DROP COLUMN IF EXISTS notes;

-- =================================================================
-- 5. UPDATE POLICIES FOR NEW STRUCTURE
-- =================================================================

-- Ensure RLS policies work with new structure
DROP POLICY IF EXISTS "Authenticated users can read consultation notes" ON consultation_notes;
CREATE POLICY "Authenticated users can read consultation notes"
  ON consultation_notes FOR SELECT TO authenticated
  USING (true);

-- =================================================================
-- 6. UPDATE SAMPLE DATA WITH NEW STRUCTURE
-- =================================================================

-- Update the existing sample patient with new fields
UPDATE patients 
SET 
    alternate_number = '081 555 9876',
    email = 'john.doe@email.com',
    city = 'Cape Town',
    postal_code = '8001',
    next_of_kin = '{
        "name": "Jane Doe",
        "relationship": "Wife", 
        "phone": "082 555 0124",
        "alternatePhone": "081 555 4321",
        "email": "jane.doe@email.com"
    }',
    medical_history = '{
        "allergies": ["Penicillin", "Shellfish"],
        "chronicConditions": ["Hypertension"],
        "pastDiagnoses": ["Pneumonia (2020)", "Ankle fracture (2018)"],
        "currentMedications": ["Amlodipine 5mg daily", "Aspirin 81mg daily"],
        "familyHistory": "Father - Heart disease, Mother - Diabetes Type 2",
        "bloodType": "O+",
        "height": 175,
        "weight": 78,
        "smokingStatus": "never",
        "alcoholConsumption": "occasional"
    }'
WHERE id_number = '8501015009087';

-- =================================================================
-- COMPLETION MESSAGE
-- =================================================================
DO $$
BEGIN
    RAISE NOTICE 'Database migration completed successfully!';
    RAISE NOTICE 'New columns added: alternate_number, email, city, postal_code';
    RAISE NOTICE 'SOAP structure added to consultation_notes';
    RAISE NOTICE 'Enhanced medical_history and next_of_kin structures';
    RAISE NOTICE 'Indexes updated for better performance';
    RAISE NOTICE 'Your existing data has been preserved and enhanced!';
END $$;
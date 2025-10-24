-- ========================================
-- ADD PRACTICE-BASED DATA ISOLATION
-- ========================================
-- This migration adds practice_code to patients and updates RLS policies
-- to ensure each practice only sees their own data

-- ========================================
-- 1. ADD PRACTICE_CODE TO PATIENTS TABLE
-- ========================================

ALTER TABLE patients ADD COLUMN IF NOT EXISTS practice_code VARCHAR(20);

-- Add foreign key constraint
ALTER TABLE patients
ADD CONSTRAINT patients_practice_code_fkey
FOREIGN KEY (practice_code) REFERENCES practices(code)
ON DELETE SET NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_patients_practice_code ON patients(practice_code);

-- ========================================
-- 2. UPDATE RLS POLICIES FOR PATIENTS
-- ========================================

-- Drop existing patient policies
DROP POLICY IF EXISTS "Authenticated users can view patients" ON patients;
DROP POLICY IF EXISTS "Authenticated users can insert patients" ON patients;
DROP POLICY IF EXISTS "Authenticated users can update patients" ON patients;
DROP POLICY IF EXISTS "Authenticated users can delete patients" ON patients;

-- New policy: Users can only view patients from their own practice
-- Admins can view all patients
CREATE POLICY "Users can view patients from their practice" ON patients
    FOR SELECT USING (
        -- Admin can view all patients
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid() AND users.role = 'admin'
        )
        OR
        -- Users can view patients from their practice
        practice_code IN (
            SELECT practice_code FROM users
            WHERE users.id = auth.uid()
        )
    );

-- New policy: Users can only insert patients to their own practice
CREATE POLICY "Users can insert patients to their practice" ON patients
    FOR INSERT WITH CHECK (
        -- Admin can insert patients to any practice
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid() AND users.role = 'admin'
        )
        OR
        -- Users can only insert patients to their own practice
        practice_code IN (
            SELECT practice_code FROM users
            WHERE users.id = auth.uid()
        )
    );

-- New policy: Users can only update patients from their own practice
CREATE POLICY "Users can update patients from their practice" ON patients
    FOR UPDATE USING (
        -- Admin can update all patients
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid() AND users.role = 'admin'
        )
        OR
        -- Users can update patients from their practice
        practice_code IN (
            SELECT practice_code FROM users
            WHERE users.id = auth.uid()
        )
    );

-- New policy: Users can only delete patients from their own practice
CREATE POLICY "Users can delete patients from their practice" ON patients
    FOR DELETE USING (
        -- Admin can delete all patients
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid() AND users.role = 'admin'
        )
        OR
        -- Users can delete patients from their practice
        practice_code IN (
            SELECT practice_code FROM users
            WHERE users.id = auth.uid()
        )
    );

-- ========================================
-- 3. UPDATE RLS POLICIES FOR CONSULTATION NOTES
-- ========================================

-- Drop existing consultation_notes policies
DROP POLICY IF EXISTS "Authenticated users can view consultation notes" ON consultation_notes;
DROP POLICY IF EXISTS "Authenticated users can insert consultation notes" ON consultation_notes;

-- New policy: Users can only view consultation notes for patients from their practice
CREATE POLICY "Users can view consultation notes from their practice" ON consultation_notes
    FOR SELECT USING (
        -- Admin can view all consultation notes
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid() AND users.role = 'admin'
        )
        OR
        -- Users can view consultation notes for patients from their practice
        patient_id IN (
            SELECT id FROM patients
            WHERE practice_code IN (
                SELECT practice_code FROM users
                WHERE users.id = auth.uid()
            )
        )
    );

-- New policy: Users can only insert consultation notes for patients from their practice
CREATE POLICY "Users can insert consultation notes for their practice" ON consultation_notes
    FOR INSERT WITH CHECK (
        -- Admin can insert consultation notes for any patient
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid() AND users.role = 'admin'
        )
        OR
        -- Users can only insert consultation notes for patients from their practice
        patient_id IN (
            SELECT id FROM patients
            WHERE practice_code IN (
                SELECT practice_code FROM users
                WHERE users.id = auth.uid()
            )
        )
    );

-- ========================================
-- 4. UPDATE RLS POLICIES FOR RELATED TABLES
-- ========================================

-- Next of Kin - inherits from patients (already cascades via foreign key)
DROP POLICY IF EXISTS "Authenticated users can view next of kin" ON next_of_kin;
CREATE POLICY "Users can view next of kin from their practice" ON next_of_kin
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid() AND users.role = 'admin'
        )
        OR
        patient_id IN (
            SELECT id FROM patients
            WHERE practice_code IN (
                SELECT practice_code FROM users
                WHERE users.id = auth.uid()
            )
        )
    );

DROP POLICY IF EXISTS "Authenticated users can insert next of kin" ON next_of_kin;
CREATE POLICY "Users can insert next of kin for their practice" ON next_of_kin
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid() AND users.role = 'admin'
        )
        OR
        patient_id IN (
            SELECT id FROM patients
            WHERE practice_code IN (
                SELECT practice_code FROM users
                WHERE users.id = auth.uid()
            )
        )
    );

DROP POLICY IF EXISTS "Authenticated users can update next of kin" ON next_of_kin;
CREATE POLICY "Users can update next of kin for their practice" ON next_of_kin
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid() AND users.role = 'admin'
        )
        OR
        patient_id IN (
            SELECT id FROM patients
            WHERE practice_code IN (
                SELECT practice_code FROM users
                WHERE users.id = auth.uid()
            )
        )
    );

-- Medical Histories
DROP POLICY IF EXISTS "Authenticated users can view medical histories" ON medical_histories;
CREATE POLICY "Users can view medical histories from their practice" ON medical_histories
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid() AND users.role = 'admin'
        )
        OR
        patient_id IN (
            SELECT id FROM patients
            WHERE practice_code IN (
                SELECT practice_code FROM users
                WHERE users.id = auth.uid()
            )
        )
    );

DROP POLICY IF EXISTS "Authenticated users can insert medical histories" ON medical_histories;
CREATE POLICY "Users can insert medical histories for their practice" ON medical_histories
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid() AND users.role = 'admin'
        )
        OR
        patient_id IN (
            SELECT id FROM patients
            WHERE practice_code IN (
                SELECT practice_code FROM users
                WHERE users.id = auth.uid()
            )
        )
    );

DROP POLICY IF EXISTS "Authenticated users can update medical histories" ON medical_histories;
CREATE POLICY "Users can update medical histories for their practice" ON medical_histories
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid() AND users.role = 'admin'
        )
        OR
        patient_id IN (
            SELECT id FROM patients
            WHERE practice_code IN (
                SELECT practice_code FROM users
                WHERE users.id = auth.uid()
            )
        )
    );

-- Insurance Details
DROP POLICY IF EXISTS "Authenticated users can view insurance details" ON insurance_details;
CREATE POLICY "Users can view insurance details from their practice" ON insurance_details
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid() AND users.role = 'admin'
        )
        OR
        patient_id IN (
            SELECT id FROM patients
            WHERE practice_code IN (
                SELECT practice_code FROM users
                WHERE users.id = auth.uid()
            )
        )
    );

DROP POLICY IF EXISTS "Authenticated users can insert insurance details" ON insurance_details;
CREATE POLICY "Users can insert insurance details for their practice" ON insurance_details
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid() AND users.role = 'admin'
        )
        OR
        patient_id IN (
            SELECT id FROM patients
            WHERE practice_code IN (
                SELECT practice_code FROM users
                WHERE users.id = auth.uid()
            )
        )
    );

DROP POLICY IF EXISTS "Authenticated users can update insurance details" ON insurance_details;
CREATE POLICY "Users can update insurance details for their practice" ON insurance_details
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid() AND users.role = 'admin'
        )
        OR
        patient_id IN (
            SELECT id FROM patients
            WHERE practice_code IN (
                SELECT practice_code FROM users
                WHERE users.id = auth.uid()
            )
        )
    );

-- ========================================
-- 5. CREATE HELPER FUNCTION TO GET USER'S PRACTICE CODE
-- ========================================

CREATE OR REPLACE FUNCTION get_user_practice_code()
RETURNS VARCHAR(20)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    user_practice VARCHAR(20);
BEGIN
    SELECT practice_code INTO user_practice
    FROM users
    WHERE id = auth.uid();

    RETURN user_practice;
END;
$$;

COMMENT ON FUNCTION get_user_practice_code() IS
'Returns the practice_code of the currently authenticated user';

-- ========================================
-- COMMENTS FOR DOCUMENTATION
-- ========================================

COMMENT ON COLUMN patients.practice_code IS
'Links patient to a specific medical practice for data isolation';

-- ========================================
-- SUMMARY
-- ========================================
-- After this migration:
-- 1. Each patient belongs to a specific practice
-- 2. Users can only see/edit patients from their own practice
-- 3. Admins can see/edit all patients from all practices
-- 4. Consultation notes and all related data automatically inherit practice isolation

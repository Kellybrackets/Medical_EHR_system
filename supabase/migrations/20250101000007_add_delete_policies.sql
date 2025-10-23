-- ========================================
-- ADD DELETE POLICIES FOR PATIENTS
-- ========================================
-- This migration adds DELETE policies to allow receptionists to delete patients

-- Add DELETE policy for patients table
CREATE POLICY "Authenticated users can delete patients" ON patients
    FOR DELETE USING (auth.role() = 'authenticated');

-- Add DELETE policy for next_of_kin (cascade handles this, but explicit is better)
CREATE POLICY "Authenticated users can delete next_of_kin" ON next_of_kin
    FOR DELETE USING (auth.role() = 'authenticated');

-- Add DELETE policy for medical_histories
CREATE POLICY "Authenticated users can delete medical_histories" ON medical_histories
    FOR DELETE USING (auth.role() = 'authenticated');

-- Add DELETE policy for insurance_details
CREATE POLICY "Authenticated users can delete insurance_details" ON insurance_details
    FOR DELETE USING (auth.role() = 'authenticated');

-- Add DELETE policy for consultation_notes (doctors should be able to delete their own notes)
CREATE POLICY "Authenticated users can delete consultation_notes" ON consultation_notes
    FOR DELETE USING (auth.role() = 'authenticated');

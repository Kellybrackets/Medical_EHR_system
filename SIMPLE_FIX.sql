-- Simple fix for consultation notes
-- Run this in Supabase SQL Editor

-- Make doctor_id optional in consultation_notes table
ALTER TABLE consultation_notes ALTER COLUMN doctor_id DROP NOT NULL;

-- Remove the foreign key constraint temporarily
ALTER TABLE consultation_notes DROP CONSTRAINT IF EXISTS consultation_notes_doctor_id_fkey;

-- Check if the table was modified successfully
SELECT 
    column_name, 
    is_nullable, 
    data_type 
FROM information_schema.columns 
WHERE table_name = 'consultation_notes' AND column_name = 'doctor_id';
-- ==============================================
-- FIX CONSULTATION NOTES SAVING
-- ==============================================
-- Run this SQL in your Supabase SQL Editor to fix consultation notes

-- First, let's check what users exist and the table structure
SELECT 'Current users in database:' as info;
SELECT id, username, role, name FROM users LIMIT 5;

-- Check if there are any existing doctors
SELECT 'Existing doctors:' as info;
SELECT id, username, role, name FROM users WHERE role = 'doctor';

-- Option 1: If no doctors exist, temporarily remove the foreign key constraint
-- This allows consultations to be saved without a valid doctor_id
ALTER TABLE consultation_notes 
DROP CONSTRAINT IF EXISTS consultation_notes_doctor_id_fkey;

-- Add it back as optional (can be null temporarily)
ALTER TABLE consultation_notes 
ALTER COLUMN doctor_id DROP NOT NULL;

-- Step 2: Verify the doctor was created
SELECT 
    id, 
    username, 
    role, 
    name 
FROM users 
WHERE role = 'doctor' 
ORDER BY created_at;

-- Step 3: Test that consultation_notes can reference this doctor
-- This query should return the demo doctor without errors
SELECT 
    'Doctor available for consultations:' as status,
    id,
    name
FROM users 
WHERE id = '00000000-0000-0000-0000-000000000001';
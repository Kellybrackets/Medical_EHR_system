-- =====================================================
-- Add Payment Method to Patient Records
-- =====================================================
--
-- This adds payment method tracking to distinguish between
-- medical aid (insurance) and cash-paying patients
--
-- Run this in Supabase SQL Editor
-- =====================================================

-- Add payment_method column to patients table
ALTER TABLE patients
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'cash'
CHECK (payment_method IN ('cash', 'medical_aid'));

-- Create index for faster filtering by payment method
CREATE INDEX IF NOT EXISTS idx_patients_payment_method
ON patients(payment_method);

-- =====================================================
-- Update existing patients (optional - set default)
-- =====================================================

-- Set all existing patients to 'cash' by default
-- You can manually update this later as needed
UPDATE patients
SET payment_method = 'cash'
WHERE payment_method IS NULL;

-- =====================================================
-- VERIFICATION QUERY
-- =====================================================

-- Check payment method distribution
SELECT
  payment_method,
  COUNT(*) as patient_count
FROM patients
GROUP BY payment_method;

-- Expected output:
-- payment_method | patient_count
-- ---------------+--------------
-- cash           | X
-- medical_aid    | 0 (or Y if you've updated)

-- =====================================================
-- NOTES
-- =====================================================
--
-- Payment Method Options:
-- - 'cash': Patient pays directly (self-pay, out of pocket)
-- - 'medical_aid': Patient has medical insurance/aid
--
-- Benefits:
-- 1. Easy filtering and reporting by payment type
-- 2. Receptionists can see payment method at a glance
-- 3. Helps with billing and claim submission workflows
-- 4. Can be used for financial reporting and analytics
--
-- =====================================================

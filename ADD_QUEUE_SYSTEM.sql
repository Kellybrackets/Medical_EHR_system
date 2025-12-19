-- =====================================================
-- Add Minimal Queue System to Existing EHR
-- =====================================================
--
-- This adds patient status tracking without changing
-- existing workflow or tables structure
--
-- Run this in Supabase SQL Editor
-- =====================================================

-- Add consultation_status column to patients table
ALTER TABLE patients
ADD COLUMN IF NOT EXISTS consultation_status TEXT DEFAULT 'waiting'
CHECK (consultation_status IN ('waiting', 'in_consultation', 'served'));

-- Add current_doctor_id to track which doctor is consulting
ALTER TABLE patients
ADD COLUMN IF NOT EXISTS current_doctor_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- Add last_status_change timestamp
ALTER TABLE patients
ADD COLUMN IF NOT EXISTS last_status_change TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_patients_consultation_status
ON patients(consultation_status, last_status_change);

-- Create index for doctor's current patients
CREATE INDEX IF NOT EXISTS idx_patients_current_doctor
ON patients(current_doctor_id) WHERE current_doctor_id IS NOT NULL;

-- =====================================================
-- Trigger to update last_status_change automatically
-- =====================================================

CREATE OR REPLACE FUNCTION update_patient_status_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.consultation_status IS DISTINCT FROM NEW.consultation_status THEN
    NEW.last_status_change = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS patient_status_change ON patients;
CREATE TRIGGER patient_status_change
  BEFORE UPDATE ON patients
  FOR EACH ROW
  EXECUTE FUNCTION update_patient_status_timestamp();

-- =====================================================
-- Function to start consultation (ensures only ONE per doctor)
-- =====================================================

CREATE OR REPLACE FUNCTION start_consultation(
  p_patient_id UUID,
  p_doctor_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_existing_consultation UUID;
  v_result JSON;
BEGIN
  -- Check if doctor already has a patient in consultation
  SELECT id INTO v_existing_consultation
  FROM patients
  WHERE current_doctor_id = p_doctor_id
    AND consultation_status = 'in_consultation'
  LIMIT 1;

  IF v_existing_consultation IS NOT NULL THEN
    v_result = json_build_object(
      'success', false,
      'error', 'You already have a patient in consultation. Please complete that consultation first.',
      'existing_patient_id', v_existing_consultation
    );
    RETURN v_result;
  END IF;

  -- Start consultation
  UPDATE patients
  SET
    consultation_status = 'in_consultation',
    current_doctor_id = p_doctor_id,
    last_status_change = NOW()
  WHERE id = p_patient_id
    AND consultation_status = 'waiting';

  IF FOUND THEN
    v_result = json_build_object('success', true);
  ELSE
    v_result = json_build_object(
      'success', false,
      'error', 'Patient not in waiting status or not found'
    );
  END IF;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Function to complete consultation
-- =====================================================

CREATE OR REPLACE FUNCTION complete_consultation(
  p_patient_id UUID,
  p_doctor_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_result JSON;
BEGIN
  UPDATE patients
  SET
    consultation_status = 'served',
    current_doctor_id = NULL,
    last_status_change = NOW()
  WHERE id = p_patient_id
    AND current_doctor_id = p_doctor_id
    AND consultation_status = 'in_consultation';

  IF FOUND THEN
    v_result = json_build_object('success', true);
  ELSE
    v_result = json_build_object(
      'success', false,
      'error', 'Patient not in consultation with this doctor'
    );
  END IF;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Set all existing patients to 'waiting' status
-- =====================================================

UPDATE patients
SET consultation_status = 'waiting'
WHERE consultation_status IS NULL;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check status distribution
SELECT consultation_status, COUNT(*)
FROM patients
GROUP BY consultation_status;

-- Expected output:
-- consultation_status | count
-- -------------------+-------
-- waiting            | X
-- in_consultation    | 0
-- served             | 0

-- =====================================================
-- NOTES
-- =====================================================
--
-- 1. All existing patients set to 'waiting' status
-- 2. When doctor starts consultation:
--    - Patient status → 'in_consultation'
--    - current_doctor_id set to doctor's ID
--    - Only ONE patient per doctor allowed
-- 3. When consultation completes:
--    - Patient status → 'served'
--    - current_doctor_id cleared
-- 4. Realtime will broadcast these changes automatically
-- 5. Patients are queued by created_at (FIFO - First In First Out)
--
-- =====================================================

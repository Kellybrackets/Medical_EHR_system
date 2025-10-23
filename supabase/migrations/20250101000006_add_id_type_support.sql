-- ========================================
-- ADD ID TYPE SUPPORT FOR PASSPORTS
-- ========================================
-- This migration adds support for both SA ID numbers and passport numbers

-- 1. Add id_type column to patients table
ALTER TABLE patients
ADD COLUMN IF NOT EXISTS id_type VARCHAR(20) NOT NULL DEFAULT 'id_number'
CHECK (id_type IN ('id_number', 'passport'));

-- 2. Update the id_number field to be more flexible
-- First, we need to drop the unique constraint temporarily
ALTER TABLE patients
DROP CONSTRAINT IF EXISTS patients_id_number_key;

-- 3. Modify the id_number column to allow longer values (for passports)
ALTER TABLE patients
ALTER COLUMN id_number TYPE VARCHAR(50);

-- 4. Add a comment to clarify the field
COMMENT ON COLUMN patients.id_number IS 'Can store either SA ID number (13 digits) or passport number (alphanumeric)';
COMMENT ON COLUMN patients.id_type IS 'Type of identification: id_number or passport';

-- 5. Create a unique constraint on the combination of id_type and id_number
-- This allows the same number to exist if types are different (edge case)
ALTER TABLE patients
ADD CONSTRAINT unique_id_per_type UNIQUE (id_type, id_number);

-- 6. Create an index for better query performance
CREATE INDEX IF NOT EXISTS idx_patients_id_type ON patients(id_type);

-- 7. Update existing records to have id_type set to 'id_number'
-- (This is safe because the DEFAULT above already handles new inserts)
UPDATE patients
SET id_type = 'id_number'
WHERE id_type IS NULL OR id_type = '';

-- 8. Drop the old index on id_number since we have a new composite constraint
DROP INDEX IF EXISTS idx_patients_id_number;

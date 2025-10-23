-- Updated EHR System Database Schema v2.0
-- This script includes all the enhanced features for comprehensive patient management
-- Run this in your Supabase SQL editor to update your database

-- =================================================================
-- 1. DROP EXISTING TABLES (if you want to start fresh)
-- =================================================================
-- Uncomment the following lines if you want to start completely fresh
-- DROP TABLE IF EXISTS consultation_notes CASCADE;
-- DROP TABLE IF EXISTS patients CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;

-- =================================================================
-- 2. CREATE UPDATED USERS TABLE
-- =================================================================
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  role text NOT NULL CHECK (role IN ('doctor', 'receptionist')),
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =================================================================
-- 3. CREATE ENHANCED PATIENTS TABLE
-- =================================================================
CREATE TABLE IF NOT EXISTS patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Personal Information
  first_name text NOT NULL,
  surname text NOT NULL,
  id_number text UNIQUE NOT NULL,
  sex text NOT NULL CHECK (sex IN ('Male', 'Female', 'Other')),
  date_of_birth date NOT NULL,
  age integer NOT NULL,
  
  -- Contact Information  
  contact_number text NOT NULL,
  alternate_number text,
  email text,
  address text NOT NULL,
  city text,
  postal_code text,
  
  -- Emergency Contact (Next of Kin)
  next_of_kin jsonb NOT NULL DEFAULT '{
    "name": "",
    "relationship": "",
    "phone": "",
    "alternatePhone": "",
    "email": ""
  }',
  
  -- Medical Aid Information
  medical_aid jsonb NOT NULL DEFAULT '{
    "fundName": "",
    "memberNumber": "",
    "plan": ""
  }',
  
  -- Enhanced Medical History
  medical_history jsonb NOT NULL DEFAULT '{
    "allergies": [],
    "chronicConditions": [],
    "pastDiagnoses": [],
    "currentMedications": [],
    "familyHistory": "",
    "bloodType": "",
    "height": null,
    "weight": null,
    "smokingStatus": "never",
    "alcoholConsumption": "never"
  }',
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =================================================================
-- 4. CREATE CONSULTATION_NOTES TABLE WITH SOAP STRUCTURE
-- =================================================================
CREATE TABLE IF NOT EXISTS consultation_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Consultation Details
  date date NOT NULL DEFAULT CURRENT_DATE,
  reason_for_visit text NOT NULL DEFAULT '',
  icd10_code text, -- ICD-10 diagnostic code (optional)
  
  -- SOAP Notes Structure
  soap jsonb NOT NULL DEFAULT '{
    "subjective": "",
    "objective": "",
    "assessment": "",
    "plan": ""
  }',
  
  -- Metadata
  created_at timestamptz DEFAULT now()
);

-- =================================================================
-- 5. ENABLE ROW LEVEL SECURITY
-- =================================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultation_notes ENABLE ROW LEVEL SECURITY;

-- =================================================================
-- 6. CREATE SECURITY POLICIES
-- =================================================================

-- Users table policies
DROP POLICY IF EXISTS "Users can read own data" ON users;
CREATE POLICY "Users can read own data"
  ON users FOR SELECT TO authenticated
  USING (auth.uid() = id);

-- Patients table policies
DROP POLICY IF EXISTS "Authenticated users can read patients" ON patients;
DROP POLICY IF EXISTS "Receptionists and doctors can insert patients" ON patients;
DROP POLICY IF EXISTS "Receptionists and doctors can update patients" ON patients;

CREATE POLICY "Authenticated users can read patients"
  ON patients FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Receptionists and doctors can insert patients"
  ON patients FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Receptionists and doctors can update patients"
  ON patients FOR UPDATE TO authenticated
  USING (true);

-- Consultation notes policies
DROP POLICY IF EXISTS "Doctors can read all consultation notes" ON consultation_notes;
DROP POLICY IF EXISTS "Doctors can insert consultation notes" ON consultation_notes;
DROP POLICY IF EXISTS "Doctors can update their own consultation notes" ON consultation_notes;

CREATE POLICY "Authenticated users can read consultation notes"
  ON consultation_notes FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Doctors can insert consultation notes"
  ON consultation_notes FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'doctor'
    )
  );

CREATE POLICY "Doctors can update their own consultation notes"
  ON consultation_notes FOR UPDATE TO authenticated
  USING (
    doctor_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'doctor'
    )
  );

-- =================================================================
-- 7. CREATE PERFORMANCE INDEXES
-- =================================================================
CREATE INDEX IF NOT EXISTS idx_patients_id_number ON patients(id_number);
CREATE INDEX IF NOT EXISTS idx_patients_name ON patients(first_name, surname);
CREATE INDEX IF NOT EXISTS idx_patients_created_at ON patients(created_at);
CREATE INDEX IF NOT EXISTS idx_consultation_notes_patient_id ON consultation_notes(patient_id);
CREATE INDEX IF NOT EXISTS idx_consultation_notes_doctor_id ON consultation_notes(doctor_id);
CREATE INDEX IF NOT EXISTS idx_consultation_notes_date ON consultation_notes(date);
CREATE INDEX IF NOT EXISTS idx_consultation_notes_created_at ON consultation_notes(created_at);

-- GIN indexes for JSONB fields for better search performance
CREATE INDEX IF NOT EXISTS idx_patients_medical_history_gin ON patients USING GIN (medical_history);
CREATE INDEX IF NOT EXISTS idx_patients_next_of_kin_gin ON patients USING GIN (next_of_kin);
CREATE INDEX IF NOT EXISTS idx_consultation_notes_soap_gin ON consultation_notes USING GIN (soap);

-- =================================================================
-- 8. CREATE UPDATED_AT TRIGGER FUNCTION
-- =================================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to patients table
DROP TRIGGER IF EXISTS update_patients_updated_at ON patients;
CREATE TRIGGER update_patients_updated_at 
  BEFORE UPDATE ON patients 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();

-- =================================================================
-- 9. USER REGISTRATION TRIGGER (Auto-create users record)
-- =================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, username, role, name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'doctor'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create or replace the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =================================================================
-- 10. SAMPLE DATA (Optional - for testing)
-- =================================================================
-- Insert demo users (only if they don't exist)
INSERT INTO users (id, username, role, name) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'dr.smith', 'doctor', 'Dr. Sarah Smith'),
  ('550e8400-e29b-41d4-a716-446655440002', 'receptionist', 'receptionist', 'Mary Johnson')
ON CONFLICT (username) DO NOTHING;

-- Insert demo patient with comprehensive information
INSERT INTO patients (
  id, first_name, surname, id_number, sex, date_of_birth, age, 
  contact_number, alternate_number, email, address, city, postal_code,
  next_of_kin, medical_aid, medical_history
) VALUES (
  '550e8400-e29b-41d4-a716-446655440003',
  'John', 'Doe', '8501015009087', 'Male', '1985-01-01', 39,
  '082 555 0123', '081 555 9876', 'john.doe@email.com', 
  '123 Main Street', 'Cape Town', '8001',
  '{
    "name": "Jane Doe",
    "relationship": "Wife", 
    "phone": "082 555 0124",
    "alternatePhone": "081 555 4321",
    "email": "jane.doe@email.com"
  }',
  '{
    "fundName": "Discovery Health",
    "memberNumber": "123456789", 
    "plan": "Comprehensive"
  }',
  '{
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
) ON CONFLICT (id_number) DO NOTHING;

-- Insert demo consultation with SOAP notes
INSERT INTO consultation_notes (
  id, patient_id, doctor_id, date, reason_for_visit, icd10_code, soap
) VALUES (
  '550e8400-e29b-41d4-a716-446655440005',
  '550e8400-e29b-41d4-a716-446655440003',
  '550e8400-e29b-41d4-a716-446655440001',
  CURRENT_DATE - INTERVAL '7 days',
  'Hypertension follow-up',
  'I10',
  '{
    "subjective": "Patient reports feeling well. Taking medication as prescribed. No chest pain or shortness of breath. Occasional mild headaches in the morning.",
    "objective": "BP: 135/85 mmHg, HR: 72 bpm, Weight: 78kg, Height: 175cm. Heart sounds normal, no peripheral edema. Alert and oriented.",
    "assessment": "Essential hypertension, well controlled. Patient compliant with medication regimen. Mild morning headaches likely related to sleep pattern.",
    "plan": "Continue current Amlodipine 5mg daily. Recommended sleep hygiene improvements. Return in 3 months for follow-up. Home BP monitoring advised."
  }'
) ON CONFLICT (id) DO NOTHING;

-- =================================================================
-- COMPLETION MESSAGE
-- =================================================================
DO $$
BEGIN
    RAISE NOTICE 'Database schema updated successfully!';
    RAISE NOTICE 'Tables created: users, patients, consultation_notes';
    RAISE NOTICE 'Features added: SOAP notes, comprehensive patient data, enhanced medical history';
    RAISE NOTICE 'Security policies and triggers configured';
    RAISE NOTICE 'Sample data inserted for testing';
END $$;
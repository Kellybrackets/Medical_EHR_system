/*
  # Initial EHR System Schema

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `username` (text, unique)
      - `role` (text, check constraint for 'doctor' or 'receptionist')
      - `name` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `patients`
      - `id` (uuid, primary key)
      - `first_name` (text)
      - `surname` (text)
      - `id_number` (text, unique)
      - `sex` (text, check constraint)
      - `date_of_birth` (date)
      - `age` (integer)
      - `contact_number` (text)
      - `address` (text)
      - `next_of_kin` (jsonb)
      - `medical_aid` (jsonb)
      - `medical_history` (jsonb)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `consultation_notes`
      - `id` (uuid, primary key)
      - `patient_id` (uuid, foreign key)
      - `doctor_id` (uuid, foreign key)
      - `date` (date)
      - `reason_for_visit` (text)
      - `icd10_code` (text, nullable)
      - `soap` (jsonb)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users based on roles
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  role text NOT NULL CHECK (role IN ('doctor', 'receptionist')),
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create patients table
CREATE TABLE IF NOT EXISTS patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  surname text NOT NULL,
  id_number text UNIQUE NOT NULL,
  sex text NOT NULL CHECK (sex IN ('Male', 'Female', 'Other')),
  date_of_birth date NOT NULL,
  age integer NOT NULL,
  contact_number text NOT NULL,
  address text NOT NULL,
  next_of_kin jsonb NOT NULL DEFAULT '{}',
  medical_aid jsonb NOT NULL DEFAULT '{}',
  medical_history jsonb NOT NULL DEFAULT '{"allergies": [], "chronicConditions": [], "pastDiagnoses": []}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create consultation_notes table
CREATE TABLE IF NOT EXISTS consultation_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  reason_for_visit text NOT NULL DEFAULT '',
  icd10_code text,
  soap jsonb NOT NULL DEFAULT '{"subjective": "", "objective": "", "assessment": "", "plan": ""}',
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultation_notes ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Create policies for patients table
CREATE POLICY "Authenticated users can read patients"
  ON patients
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Receptionists and doctors can insert patients"
  ON patients
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Receptionists and doctors can update patients"
  ON patients
  FOR UPDATE
  TO authenticated
  USING (true);

-- Create policies for consultation_notes table
CREATE POLICY "Doctors can read all consultation notes"
  ON consultation_notes
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'doctor'
    )
  );

CREATE POLICY "Doctors can insert consultation notes"
  ON consultation_notes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'doctor'
    )
  );

CREATE POLICY "Doctors can update their own consultation notes"
  ON consultation_notes
  FOR UPDATE
  TO authenticated
  USING (
    doctor_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'doctor'
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_patients_id_number ON patients(id_number);
CREATE INDEX IF NOT EXISTS idx_patients_name ON patients(first_name, surname);
CREATE INDEX IF NOT EXISTS idx_consultation_notes_patient_id ON consultation_notes(patient_id);
CREATE INDEX IF NOT EXISTS idx_consultation_notes_doctor_id ON consultation_notes(doctor_id);
CREATE INDEX IF NOT EXISTS idx_consultation_notes_date ON consultation_notes(date);

-- Insert demo users
INSERT INTO users (id, username, role, name) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'dr.smith', 'doctor', 'Dr. Sarah Smith'),
  ('550e8400-e29b-41d4-a716-446655440002', 'receptionist', 'receptionist', 'Mary Johnson')
ON CONFLICT (username) DO NOTHING;

-- Insert demo patients
INSERT INTO patients (
  id, first_name, surname, id_number, sex, date_of_birth, age, 
  contact_number, address, next_of_kin, medical_aid, medical_history
) VALUES
  (
    '550e8400-e29b-41d4-a716-446655440003',
    'John', 'Doe', '8501015009087', 'Male', '1985-01-01', 39,
    '082 555 0123', '123 Main Street, Cape Town, 8001',
    '{"name": "Jane Doe", "relationship": "Wife", "phone": "082 555 0124"}',
    '{"fundName": "Discovery Health", "memberNumber": "123456789", "plan": "Comprehensive"}',
    '{"allergies": ["Penicillin", "Shellfish"], "chronicConditions": ["Hypertension"], "pastDiagnoses": ["Pneumonia (2020)", "Ankle fracture (2018)"]}'
  ),
  (
    '550e8400-e29b-41d4-a716-446655440004',
    'Sarah', 'Wilson', '9203122345082', 'Female', '1992-03-12', 32,
    '081 444 5678', '456 Oak Avenue, Johannesburg, 2001',
    '{"name": "Mike Wilson", "relationship": "Husband", "phone": "081 444 5679"}',
    '{"fundName": "Momentum Health", "memberNumber": "987654321", "plan": "Standard"}',
    '{"allergies": ["None known"], "chronicConditions": [], "pastDiagnoses": ["Appendicitis (2019)"]}'
  )
ON CONFLICT (id_number) DO NOTHING;

-- Insert demo consultation note
INSERT INTO consultation_notes (
  id, patient_id, doctor_id, date, reason_for_visit, icd10_code, soap
) VALUES
  (
    '550e8400-e29b-41d4-a716-446655440005',
    '550e8400-e29b-41d4-a716-446655440003',
    '550e8400-e29b-41d4-a716-446655440001',
    '2024-01-10',
    'Hypertension follow-up',
    'I10',
    '{"subjective": "Patient reports feeling well. Taking medication as prescribed. No chest pain or shortness of breath.", "objective": "BP: 135/85 mmHg, HR: 72 bpm, normal heart sounds, no peripheral edema", "assessment": "Hypertension, well controlled", "plan": "Continue current medication. Return in 3 months. Lifestyle counseling provided."}'
  )
ON CONFLICT (id) DO NOTHING;
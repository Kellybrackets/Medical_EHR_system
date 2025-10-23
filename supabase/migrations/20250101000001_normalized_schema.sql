-- ========================================
-- NORMALIZED EHR DATABASE SCHEMA
-- ========================================
-- This migration creates a properly normalized database schema
-- replacing the malformed JSONB approach with separate tables

-- Drop existing tables and recreate with proper structure
DROP TABLE IF EXISTS consultation_notes CASCADE;
DROP TABLE IF EXISTS patients CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ========================================
-- 1. USERS TABLE
-- ========================================
CREATE TABLE users (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('doctor', 'receptionist')),
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- 2. PATIENTS TABLE (Normalized)
-- ========================================
CREATE TABLE patients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    surname VARCHAR(100) NOT NULL,
    id_number VARCHAR(20) UNIQUE NOT NULL,
    sex VARCHAR(10) NOT NULL CHECK (sex IN ('Male', 'Female', 'Other')),
    date_of_birth DATE NOT NULL,
    age INTEGER NOT NULL,
    contact_number VARCHAR(20) NOT NULL,
    alternate_number VARCHAR(20),
    email VARCHAR(100),
    address TEXT NOT NULL,
    city VARCHAR(100),
    postal_code VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- 3. NEXT OF KIN TABLE
-- ========================================
CREATE TABLE next_of_kin (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(100) NOT NULL,
    relationship VARCHAR(50) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    alternate_phone VARCHAR(20),
    email VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- 4. MEDICAL HISTORIES TABLE
-- ========================================
CREATE TABLE medical_histories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
    height NUMERIC(5,2), -- in cm
    weight NUMERIC(5,2), -- in kg
    blood_type VARCHAR(5),
    allergies TEXT[], -- array of allergies
    chronic_conditions TEXT[], -- array of conditions
    current_medications TEXT[], -- array of medications
    past_surgeries TEXT[], -- array of past surgeries
    family_history TEXT,
    smoking_status VARCHAR(20) CHECK (smoking_status IN ('never', 'former', 'current')) DEFAULT 'never',
    alcohol_consumption VARCHAR(20) CHECK (alcohol_consumption IN ('never', 'occasional', 'moderate', 'heavy')) DEFAULT 'never',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure one medical history per patient
    UNIQUE(patient_id)
);

-- ========================================
-- 5. INSURANCE DETAILS TABLE
-- ========================================
CREATE TABLE insurance_details (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
    fund_name VARCHAR(100),
    member_number VARCHAR(50),
    plan VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure one insurance record per patient
    UNIQUE(patient_id)
);

-- ========================================
-- 6. CONSULTATION NOTES TABLE
-- ========================================
CREATE TABLE consultation_notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
    doctor_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    reason_for_visit TEXT NOT NULL,
    icd10_code VARCHAR(10),
    
    -- SOAP Notes
    subjective TEXT NOT NULL,
    objective TEXT NOT NULL,
    assessment TEXT NOT NULL,
    plan TEXT NOT NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- INDEXES FOR PERFORMANCE
-- ========================================
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_patients_id_number ON patients(id_number);
CREATE INDEX idx_patients_name ON patients(first_name, surname);
CREATE INDEX idx_next_of_kin_patient_id ON next_of_kin(patient_id);
CREATE INDEX idx_medical_histories_patient_id ON medical_histories(patient_id);
CREATE INDEX idx_insurance_details_patient_id ON insurance_details(patient_id);
CREATE INDEX idx_consultation_notes_patient_id ON consultation_notes(patient_id);
CREATE INDEX idx_consultation_notes_doctor_id ON consultation_notes(doctor_id);
CREATE INDEX idx_consultation_notes_date ON consultation_notes(date);

-- ========================================
-- UPDATED_AT TRIGGER FUNCTION
-- ========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ========================================
-- TRIGGERS FOR UPDATED_AT
-- ========================================
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patients_updated_at 
    BEFORE UPDATE ON patients 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_next_of_kin_updated_at 
    BEFORE UPDATE ON next_of_kin 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_medical_histories_updated_at 
    BEFORE UPDATE ON medical_histories 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_insurance_details_updated_at 
    BEFORE UPDATE ON insurance_details 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- ROW LEVEL SECURITY (RLS)
-- ========================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE next_of_kin ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_histories ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurance_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultation_notes ENABLE ROW LEVEL SECURITY;

-- ========================================
-- RLS POLICIES
-- ========================================

-- Users policies
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Allow insert during registration" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Patients policies
CREATE POLICY "Authenticated users can view patients" ON patients
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert patients" ON patients
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update patients" ON patients
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Next of kin policies
CREATE POLICY "Authenticated users can view next_of_kin" ON next_of_kin
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert next_of_kin" ON next_of_kin
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update next_of_kin" ON next_of_kin
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Medical histories policies
CREATE POLICY "Authenticated users can view medical_histories" ON medical_histories
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert medical_histories" ON medical_histories
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update medical_histories" ON medical_histories
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Insurance details policies
CREATE POLICY "Authenticated users can view insurance_details" ON insurance_details
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert insurance_details" ON insurance_details
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update insurance_details" ON insurance_details
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Consultation notes policies
CREATE POLICY "Authenticated users can view consultation_notes" ON consultation_notes
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert consultation_notes" ON consultation_notes
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update consultation_notes" ON consultation_notes
    FOR UPDATE USING (auth.role() = 'authenticated');
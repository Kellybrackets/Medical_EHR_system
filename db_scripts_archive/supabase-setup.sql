-- Supabase Database Setup Script
-- Run this in your Supabase SQL editor to create the necessary tables

-- Enable RLS (Row Level Security)
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('doctor', 'receptionist')),
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create patients table
CREATE TABLE IF NOT EXISTS public.patients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    surname VARCHAR(100) NOT NULL,
    id_number VARCHAR(20) UNIQUE NOT NULL,
    sex VARCHAR(10) NOT NULL CHECK (sex IN ('Male', 'Female', 'Other')),
    date_of_birth DATE NOT NULL,
    age INTEGER NOT NULL,
    contact_number VARCHAR(20) NOT NULL,
    address TEXT NOT NULL,
    next_of_kin JSONB NOT NULL,
    medical_aid JSONB NOT NULL,
    medical_history JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create consultation_notes table
CREATE TABLE IF NOT EXISTS public.consultation_notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
    doctor_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    reason_for_visit TEXT NOT NULL,
    icd10_code VARCHAR(10),
    soap JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultation_notes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users table
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Allow insert for new user registration
CREATE POLICY "Allow insert during registration" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Create RLS policies for patients table
-- Allow all authenticated users to read patients
CREATE POLICY "Authenticated users can view patients" ON public.patients
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert patients (receptionists typically)
CREATE POLICY "Authenticated users can insert patients" ON public.patients
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update patients
CREATE POLICY "Authenticated users can update patients" ON public.patients
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Create RLS policies for consultation_notes table
-- Allow doctors to view consultation notes
CREATE POLICY "Authenticated users can view consultation notes" ON public.consultation_notes
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow doctors to insert consultation notes
CREATE POLICY "Authenticated users can insert consultation notes" ON public.consultation_notes
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
CREATE INDEX IF NOT EXISTS idx_patients_id_number ON public.patients(id_number);
CREATE INDEX IF NOT EXISTS idx_consultation_notes_patient_id ON public.consultation_notes(patient_id);
CREATE INDEX IF NOT EXISTS idx_consultation_notes_doctor_id ON public.consultation_notes(doctor_id);
CREATE INDEX IF NOT EXISTS idx_consultation_notes_date ON public.consultation_notes(date);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON public.patients 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
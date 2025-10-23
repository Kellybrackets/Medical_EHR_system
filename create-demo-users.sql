-- Run this in your Supabase SQL Editor to create demo users

-- Insert demo doctor user
INSERT INTO users (
    id,
    username,
    role,
    name,
    created_at,
    updated_at
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    'demo_doctor',
    'doctor',
    'Dr. Demo',
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insert demo receptionist user  
INSERT INTO users (
    id,
    username,
    role,
    name,
    created_at,
    updated_at
) VALUES (
    '00000000-0000-0000-0000-000000000002',
    'demo_receptionist',
    'receptionist', 
    'Demo Receptionist',
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;
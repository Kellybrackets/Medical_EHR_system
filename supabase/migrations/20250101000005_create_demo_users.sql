-- ========================================
-- CREATE DEMO USERS FOR CONSULTATION NOTES
-- ========================================
-- This migration creates demo users so consultation notes can be saved

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

-- Verify the users were created
DO $$
DECLARE
    doctor_count INTEGER;
    receptionist_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO doctor_count FROM users WHERE role = 'doctor';
    SELECT COUNT(*) INTO receptionist_count FROM users WHERE role = 'receptionist';
    
    RAISE NOTICE 'Demo users created successfully:';
    RAISE NOTICE '- Doctors: %', doctor_count;
    RAISE NOTICE '- Receptionists: %', receptionist_count;
END $$;
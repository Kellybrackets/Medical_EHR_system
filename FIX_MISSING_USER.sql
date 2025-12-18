-- ========================================
-- FIX MISSING USER IN PUBLIC.USERS
-- ========================================

-- First, let's manually create the missing user record
-- User: tshenolomatiya22@gmail.com (ID: 875f99c0-def2-4acd-816b-9b16413bd5a3)

INSERT INTO public.users (id, username, role, name, practice_code, created_at, updated_at)
VALUES (
    '875f99c0-def2-4acd-816b-9b16413bd5a3',
    'tshenolomatiya22',  -- Username (extracted from email or you can change this)
    'doctor',
    'Dr. Tsheno',  -- You can update this name later
    NULL,  -- practice_code was null in metadata
    '2025-10-23 20:42:32.596709+00',  -- Use the original created_at from auth.users
    NOW()
)
ON CONFLICT (id) DO UPDATE SET
    practice_code = EXCLUDED.practice_code,
    updated_at = NOW();

-- ========================================
-- VERIFY THE TRIGGER IS WORKING
-- ========================================

-- Check if the trigger exists and is enabled
SELECT
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- ========================================
-- OPTIONAL: UPDATE PRACTICE CODE
-- ========================================

-- If you want to assign this doctor to a practice, uncomment and run:
-- UPDATE public.users
-- SET practice_code = 'CGH001'  -- Change to desired practice code
-- WHERE id = '875f99c0-def2-4acd-816b-9b16413bd5a3';

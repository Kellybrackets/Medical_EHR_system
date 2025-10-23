-- ========================================
-- FIX USER SYNCHRONIZATION BETWEEN AUTH AND PUBLIC.USERS
-- ========================================
-- This migration fixes the synchronization issues between auth.users and public.users

-- ========================================
-- 1. CREATE FUNCTION TO HANDLE NEW USER REGISTRATION
-- ========================================
-- This function automatically creates a record in public.users when a new auth.users record is created

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, username, role, name, created_at, updated_at)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'role', 'doctor'),
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- 2. CREATE TRIGGER ON AUTH.USERS
-- ========================================
-- This trigger fires whenever a new user signs up via auth

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ========================================
-- 3. CREATE FUNCTION TO PROPERLY DELETE USERS
-- ========================================
-- This function ensures both auth.users and public.users are deleted together

CREATE OR REPLACE FUNCTION public.delete_user_completely(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- First delete from public.users (this will cascade to related tables due to foreign keys)
    DELETE FROM public.users WHERE id = user_id;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;

    -- Then delete from auth.users (requires admin privileges)
    -- Note: This should be done via Supabase Dashboard or Admin API in production
    -- The CASCADE on public.users will handle related data

    RETURN deleted_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- 4. FIX ORPHANED RECORDS
-- ========================================

-- Step 4a: First, identify and fix orphaned consultation notes
-- Option 1: Delete consultation notes with non-existent doctors (recommended for clean slate)
DELETE FROM consultation_notes
WHERE doctor_id NOT IN (SELECT id FROM users);

-- Option 2 (Alternative - uncomment if you want to preserve consultation notes):
-- Set doctor_id to NULL for orphaned consultation notes
-- UPDATE consultation_notes
-- SET doctor_id = NULL
-- WHERE doctor_id NOT IN (SELECT id FROM users);

-- Step 4b: Clean up any users in public.users that don't have corresponding auth.users
DELETE FROM public.users
WHERE id NOT IN (SELECT id FROM auth.users);

-- ========================================
-- 5. ADD RLS POLICY FOR USER DELETION
-- ========================================
-- Allow users to be deleted (this will cascade to consultation_notes via doctor_id FK)

CREATE POLICY "Authenticated users can delete own profile" ON users
    FOR DELETE USING (auth.uid() = id);

-- ========================================
-- 6. CREATE VIEW FOR USER MANAGEMENT (OPTIONAL)
-- ========================================
-- Useful view to see all users with their auth status

CREATE OR REPLACE VIEW user_management_view AS
SELECT
    u.id,
    u.username,
    u.role,
    u.name,
    u.created_at,
    au.email,
    au.email_confirmed_at,
    au.last_sign_in_at,
    CASE WHEN au.id IS NULL THEN 'orphaned' ELSE 'active' END as status
FROM public.users u
LEFT JOIN auth.users au ON u.id = au.id;

-- ========================================
-- 7. FIX CONSULTATION_NOTES FOREIGN KEY
-- ========================================
-- Drop the existing constraint if it exists, then recreate with proper CASCADE
-- This ensures orphaned records don't prevent the constraint from being added

-- First, drop the existing constraint if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'consultation_notes_doctor_id_fkey'
    ) THEN
        ALTER TABLE consultation_notes
        DROP CONSTRAINT consultation_notes_doctor_id_fkey;
    END IF;
END $$;

-- Now add the constraint (after orphaned records have been cleaned up)
ALTER TABLE consultation_notes
ADD CONSTRAINT consultation_notes_doctor_id_fkey
FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE CASCADE;

-- ========================================
-- COMMENT FOR DOCUMENTATION
-- ========================================

COMMENT ON FUNCTION public.handle_new_user() IS
'Automatically creates a record in public.users when a new user signs up via Supabase Auth';

COMMENT ON FUNCTION public.delete_user_completely(UUID) IS
'Helper function to delete user from public.users. Auth.users should be deleted via Supabase Dashboard or Admin API';

COMMENT ON VIEW user_management_view IS
'View showing all users with their auth status for easier user management';

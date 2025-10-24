-- ========================================
-- FIX ADMIN LOGIN RLS CIRCULAR DEPENDENCY
-- ========================================
-- The "Admins can view all users" policy creates a circular dependency
-- during login because it checks if the user is an admin by querying
-- the users table, which requires the query to succeed first.
--
-- Solution: Keep the existing "Users can view own profile" policy
-- which already allows any user (including admins) to view their own record.
-- The admin policy should be ADDITIVE, not REPLACING.

-- Drop and recreate the admin policies to ensure they work correctly
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can update any user" ON users;

-- Admins can view ALL users (in addition to viewing their own profile)
-- This policy is additive to "Users can view own profile"
CREATE POLICY "Admins can view all users" ON users
    FOR SELECT USING (
        -- First check: user can always view their own record (fixes circular dependency)
        auth.uid() = id
        OR
        -- Second check: if user is admin, they can view all records
        EXISTS (
            SELECT 1 FROM users admin_check
            WHERE admin_check.id = auth.uid() AND admin_check.role = 'admin'
        )
    );

-- Admins can update any user (but regular users can still update themselves)
CREATE POLICY "Admins can update any user" ON users
    FOR UPDATE USING (
        -- First check: user can update their own record
        auth.uid() = id
        OR
        -- Second check: admins can update any record
        EXISTS (
            SELECT 1 FROM users admin_check
            WHERE admin_check.id = auth.uid() AND admin_check.role = 'admin'
        )
    );

-- Comment for clarity
COMMENT ON POLICY "Admins can view all users" ON users IS
'Allows users to view their own record (fixes login circular dependency) and allows admins to view all user records';

COMMENT ON POLICY "Admins can update any user" ON users IS
'Allows users to update their own record and allows admins to update any user record';

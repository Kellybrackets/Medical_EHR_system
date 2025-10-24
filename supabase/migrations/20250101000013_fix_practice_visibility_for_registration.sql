-- ========================================
-- FIX PRACTICE VISIBILITY FOR REGISTRATION
-- ========================================
-- Allow unauthenticated users to view active practices during registration
-- This is needed because users are not authenticated yet when they're registering

-- Drop the existing policy that requires authentication
DROP POLICY IF EXISTS "Authenticated users can view practices" ON practices;

-- Create new policy: Anyone can view ACTIVE practices (for registration dropdown)
-- This is safe because:
-- 1. Only active practices are shown
-- 2. Practice info is not sensitive (just name, city, etc.)
-- 3. Users need to see practices to register
CREATE POLICY "Anyone can view active practices" ON practices
    FOR SELECT USING (status = 'active');

-- Additional policy: Authenticated users can view ALL practices (including inactive)
-- This allows admins and staff to see inactive practices in management pages
CREATE POLICY "Authenticated users can view all practices" ON practices
    FOR SELECT USING (
        auth.role() = 'authenticated' AND status = 'inactive'
    );

COMMENT ON POLICY "Anyone can view active practices" ON practices IS
'Allows unauthenticated users to see active practices during registration. Only active practices are visible for security.';

COMMENT ON POLICY "Authenticated users can view all practices" ON practices IS
'Allows authenticated users (staff and admins) to view inactive practices for management purposes.';

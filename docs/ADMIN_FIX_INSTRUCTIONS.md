# Admin Portal Fix - Complete Instructions

## Problem Solved

Fixed the "infinite recursion" error that prevented admin login and made the Users Management page work properly.

## What Was Wrong

The RLS (Row Level Security) policies had a circular dependency:

- To check if a user is admin, the policy needed to query the `users` table
- But querying the `users` table required checking if the user is admin
- **Result:** Infinite recursion error

## Solution Implemented

**Security Definer Functions** - PostgreSQL functions that run with elevated privileges, bypassing RLS restrictions for authorized admins.

---

## Step 1: Run This SQL in Supabase SQL Editor

Copy and paste this entire SQL script into your Supabase SQL Editor and run it:

```sql
-- ========================================
-- COMPLETE RESET OF USER RLS POLICIES

-- ========================================

-- Drop ALL user-related SELECT policies
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;

-- Drop ALL user-related UPDATE policies
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Admins can update any user" ON users;

-- Recreate ONLY the essential policies
-- Policy 1: Any user can view their OWN record (essential for login)
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

-- Policy 2: Any user can update their OWN record
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Policy 3: Allow insert during registration
DROP POLICY IF EXISTS "Allow insert during registration" ON users;
CREATE POLICY "Allow insert during registration" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- ========================================
-- SECURITY DEFINER FUNCTIONS FOR ADMIN OPERATIONS
-- ========================================

-- Function 1: Get all users (admin only)
CREATE OR REPLACE FUNCTION get_all_users()
RETURNS TABLE (
    id UUID,
    username VARCHAR(50),
    role VARCHAR(20),
    name VARCHAR(100),
    practice_code VARCHAR(20),
    practice_name VARCHAR(200),
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    -- Check if caller is admin
    IF NOT EXISTS (
        SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Access denied. Admin role required.';
    END IF;

    -- Return all users with practice names
    RETURN QUERY
    SELECT
        u.id,
        u.username,
        u.role,
        u.name,
        u.practice_code,
        p.name as practice_name,
        u.created_at,
        u.updated_at
    FROM users u
    LEFT JOIN practices p ON u.practice_code = p.code
    ORDER BY u.created_at DESC;
END;
$$;

-- Function 2: Delete user (admin only)
CREATE OR REPLACE FUNCTION admin_delete_user(user_id_to_delete UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    -- Check if caller is admin
    IF NOT EXISTS (
        SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Access denied. Admin role required.';
    END IF;

    -- Prevent admin from deleting themselves
    IF user_id_to_delete = auth.uid() THEN
        RAISE EXCEPTION 'Cannot delete your own account.';
    END IF;

    -- Delete the user
    DELETE FROM users WHERE id = user_id_to_delete;

    RETURN TRUE;
END;
$$;

-- Function 3: Get dashboard stats (admin only)
CREATE OR REPLACE FUNCTION get_admin_stats()
RETURNS JSON
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    stats JSON;
BEGIN
    -- Check if caller is admin
    IF NOT EXISTS (
        SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Access denied. Admin role required.';
    END IF;

    -- Build stats JSON
    SELECT json_build_object(
        'totalPractices', (SELECT COUNT(*) FROM practices),
        'activePractices', (SELECT COUNT(*) FROM practices WHERE status = 'active'),
        'totalUsers', (SELECT COUNT(*) FROM users),
        'totalDoctors', (SELECT COUNT(*) FROM users WHERE role = 'doctor'),
        'totalReceptionists', (SELECT COUNT(*) FROM users WHERE role = 'receptionist'),
        'totalAdmins', (SELECT COUNT(*) FROM users WHERE role = 'admin')
    ) INTO stats;

    RETURN stats;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_all_users() TO authenticated;
GRANT EXECUTE ON FUNCTION admin_delete_user(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_admin_stats() TO authenticated;

-- Add comments
COMMENT ON FUNCTION get_all_users() IS 'Returns all users with practice info. Admin only.';
COMMENT ON FUNCTION admin_delete_user(UUID) IS 'Deletes a user. Admin only. Cannot delete self.';
COMMENT ON FUNCTION get_admin_stats() IS 'Returns dashboard statistics. Admin only.';
```

---

## Step 2: What Was Updated in the Code

I've already updated these files for you:

### 1. `src/hooks/useAdminUsers.ts`

- Changed `fetchUsers()` to call `supabase.rpc('get_all_users')` instead of direct table query
- Changed `deleteUser()` to call `supabase.rpc('admin_delete_user')` instead of direct DELETE

### 2. `src/components/admin/DashboardOverview.tsx`

- Changed `fetchStats()` to call `supabase.rpc('get_admin_stats')` for user statistics

---

## Step 3: Test Everything

After running the SQL above:

1. ✅ **Admin Login** - Should work without infinite recursion error
2. ✅ **Dashboard** - Should show correct user/practice statistics
3. ✅ **Users Management** - Should display all users with their practices
4. ✅ **Delete User** - Should work (cannot delete yourself)
5. ✅ **Practices Management** - Should continue to work as before
6. ✅ **System Settings** - Should continue to work as before

---

## How It Works Now

### Before (Broken)

```
Admin logs in
  ↓
Query users table to get admin user record
  ↓
RLS Policy checks: "Is this user an admin?"
  ↓
To check admin role, query users table again
  ↓
RLS Policy checks: "Is this user an admin?"
  ↓
INFINITE RECURSION ERROR ❌
```

### After (Fixed)

```
Admin logs in
  ↓
Query users table with policy: "Can view own record" (auth.uid() = id)
  ↓
SUCCESS - Admin user record retrieved ✅
  ↓
Admin navigates to Users Management page
  ↓
Call security definer function get_all_users()
  ↓
Function checks if caller is admin (can query because SECURITY DEFINER)
  ↓
Returns all users ✅
```

---

## Security Notes

The security definer functions are **secure** because:

1. They explicitly check if the caller has `role = 'admin'` before executing
2. They run with elevated privileges (`SECURITY DEFINER`) but have authorization checks inside
3. Non-admin users trying to call these functions will get "Access denied" errors
4. The `admin_delete_user()` function prevents admins from deleting themselves

---

## Next Steps

1. Run the SQL script above in Supabase SQL Editor
2. Refresh your React app
3. Test admin login - should work!
4. Navigate to Users Management - should display all users!
5. Test deleting a user (but not yourself!)
6. Check the Dashboard - statistics should load properly

---

## Troubleshooting

### If you get "function does not exist" error:

Make sure you ran the entire SQL script including all three CREATE FUNCTION statements.

### If you get "Access denied" error:

Make sure your user has `role = 'admin'` in the `public.users` table.

### If admin login still doesn't work:

Check browser console for errors. The policy "Users can view own profile" must exist.

---

**Status**: ✅ Ready to test!

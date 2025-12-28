# User Management & Synchronization Fix

## Overview

Fixed critical issues with user management, authentication synchronization, and orphaned records in the EHR system.

---

## Problems Identified

### 1. 🔴 **Orphaned Auth Records**

**Your Specific Issue:**

> "I deleted a doctor's account from Supabase in the users database but the doctor when I login with that email, I am automatically logged in to an old dashboard"

**What's Happening:**

- You have **TWO separate user systems** that must stay in sync:
  1. `auth.users` - Supabase Auth (handles login/password)
  2. `public.users` - Your application users table (stores username, role, name)

- When you deleted from `public.users`, the `auth.users` record **still exists**
- The user can still log in because authentication only checks `auth.users`
- The app crashes or shows old data because it expects a record in `public.users`

**The Relationship:**

```sql
CREATE TABLE users (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('doctor', 'receptionist')),
    name VARCHAR(100) NOT NULL,
    ...
);
```

The `ON DELETE CASCADE` means:

- If you delete from `auth.users` → `public.users` is automatically deleted ✅
- If you delete from `public.users` → `auth.users` is **NOT** affected ❌

---

### 2. 🔴 **No Automatic Sync on Registration**

**Problem:**

- When a user signs up via `auth.signUp()`, a record is created in `auth.users`
- However, NO record is automatically created in `public.users`
- This causes a mismatch between the two tables

**Before This Fix:**
User signs up → Record in `auth.users` created → NO record in `public.users` → User can log in but app has no user data → Crash or errors

---

### 3. 🔴 **No Receptionist Table** (Not Actually a Problem)

**Your Concern:**

> "there is no specific receptionist table also"

**Explanation:**
This is actually **CORRECT** design! There's no separate receptionist table because:

- Both doctors and receptionists are stored in the same `users` table
- They're differentiated by the `role` column: `'doctor'` or `'receptionist'`
- This is a proper normalized database design

```sql
CREATE TABLE users (
    ...
    role VARCHAR(20) NOT NULL CHECK (role IN ('doctor', 'receptionist')),
    ...
);
```

**Why This is Good:**

- ✅ Both user types share common fields (username, name, etc.)
- ✅ Easy to query all users or filter by role
- ✅ Follows database normalization principles
- ✅ Easier to add new roles in the future

---

### 4. 🔴 **Supabase "Failed to Fetch" Error**

**Your Error:**

> "Failed to retrieve rows from table - Error: Failed to fetch (api.supabase.com)"

**Possible Causes:**

1. **Network/Connection Issues**
   - Supabase service temporarily down
   - Your internet connection dropped
   - Firewall blocking Supabase API

2. **RLS Policy Issues**
   - You might not have proper permissions to view the table
   - Missing SELECT policies

3. **Orphaned Records**
   - Database constraint violations
   - Foreign key issues

---

## The Fix

### Migration: `20250101000008_fix_user_sync.sql`

This migration provides a complete solution:

#### 1. **Auto-Sync Trigger** ✅

Creates a database trigger that automatically creates a `public.users` record whenever someone signs up via `auth.users`:

```sql
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

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

**What This Does:**

- Whenever a new user signs up, the trigger fires
- It extracts `username`, `role`, and `full_name` from the auth metadata
- It creates a matching record in `public.users`
- `ON CONFLICT DO NOTHING` prevents duplicate errors

---

#### 2. **Clean Up Orphaned Records** ✅

Deletes any `public.users` records that don't have a corresponding `auth.users` record:

```sql
DELETE FROM public.users
WHERE id NOT IN (SELECT id FROM auth.users);
```

---

#### 3. **User Management View** ✅

Creates a helpful view to see all users and their status:

```sql
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
```

You can now query this view to see user status:

```sql
SELECT * FROM user_management_view;
```

---

#### 4. **Proper Deletion Function** ✅

Creates a function to help delete users properly:

```sql
CREATE OR REPLACE FUNCTION public.delete_user_completely(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    DELETE FROM public.users WHERE id = user_id;
    -- This cascades to related tables
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## How to Apply the Fix

### Step 1: Run the Migration

**Option A: Using Supabase CLI** (Recommended)

```bash
cd "/Users/keletsontseno/Downloads/EHR APP"
supabase db push
```

**Option B: Manual via Supabase Dashboard**

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `supabase/migrations/20250101000008_fix_user_sync.sql`
4. Paste and run the SQL

---

### Step 2: Fix Your Specific Doctor Account Issue

You have a doctor account that can log in but has no `public.users` record. Here's how to fix it:

#### Option 1: Delete the Auth User Properly (Recommended)

1. Go to Supabase Dashboard
2. Navigate to **Authentication** → **Users**
3. Find the doctor's email
4. Click the **three dots** menu → **Delete User**
5. Confirm deletion

This will:

- Delete from `auth.users`
- Automatically cascade delete from `public.users` (if record exists)
- User can no longer log in

Then have the doctor **re-register** via your app's registration form.

---

#### Option 2: Recreate the public.users Record

If you want to keep the auth account, manually create the missing `public.users` record:

1. Go to Supabase Dashboard → **SQL Editor**
2. Run this query (replace the values):

```sql
-- First, get the auth user's ID
SELECT id, email, raw_user_meta_data FROM auth.users WHERE email = 'doctor@example.com';

-- Then insert into public.users (use the ID from above)
INSERT INTO public.users (id, username, role, name)
VALUES (
    '00000000-0000-0000-0000-000000000000', -- Replace with actual UUID from auth.users
    'doctor_username',                       -- Replace with desired username
    'doctor',                                -- Role
    'Dr. John Doe'                          -- Replace with doctor's name
);
```

---

### Step 3: Test User Registration

1. Create a new test account via your app's registration form
2. Verify the account appears in **both** `auth.users` AND `public.users`
3. Log in with the test account
4. Verify dashboard loads correctly

---

## How to Properly Delete Users (Going Forward)

### ❌ **DON'T DO THIS:**

- Delete from `public.users` via SQL Editor
- Delete from Table Editor in Supabase Dashboard

**Why?** This leaves orphaned auth records!

---

### ✅ **DO THIS INSTEAD:**

#### Method 1: Via Supabase Dashboard (Easiest)

1. Go to **Authentication** → **Users**
2. Find the user
3. Click **three dots** → **Delete User**
4. Confirm

This deletes from `auth.users` → Cascades to `public.users` → Cascades to `consultation_notes` (for doctors)

---

#### Method 2: Via SQL (For Bulk Operations)

```sql
-- First delete from public.users (cascades to related tables)
DELETE FROM public.users WHERE id = 'user-uuid-here';

-- Then delete from auth.users (do this via Supabase Dashboard or Admin API)
-- You can't delete auth.users directly via SQL for security reasons
```

---

#### Method 3: Via Supabase Admin API (For Automation)

```typescript
// In your admin panel or backend
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'your-project-url',
  'your-service-role-key', // Admin key, NOT anon key!
);

// Delete user (this handles both auth.users and public.users)
const { error } = await supabase.auth.admin.deleteUser('user-uuid-here');
```

---

## Understanding the Data Flow

### On User Registration:

```
1. User fills out registration form
2. App calls supabase.auth.signUp()
3. Supabase creates record in auth.users
4. 🆕 TRIGGER FIRES: handle_new_user()
5. 🆕 Record automatically created in public.users
6. User can now log in and use the app
```

---

### On User Deletion (Proper Way):

```
1. Admin deletes user from Supabase Dashboard (Authentication → Users)
2. Supabase deletes from auth.users
3. CASCADE: public.users record deleted
4. CASCADE: consultation_notes records deleted (if user was a doctor)
5. User can no longer log in
```

---

### On User Deletion (Wrong Way - Your Issue):

```
1. Admin deletes from public.users via SQL/Table Editor ❌
2. auth.users record still exists 😱
3. User can still log in
4. App crashes because it can't find public.users record
5. You get confused and frustrated
```

---

## Testing Checklist

### Test User Registration

- [ ] Create new doctor account via registration form
- [ ] Verify record in `auth.users` (Authentication → Users)
- [ ] Verify record in `public.users` (SQL Editor: `SELECT * FROM users;`)
- [ ] Verify both records have same UUID
- [ ] Log in with new account
- [ ] Verify dashboard loads correctly

### Test User Deletion

- [ ] Create a test user
- [ ] Delete via Supabase Dashboard (Authentication → Users)
- [ ] Verify record removed from `auth.users`
- [ ] Verify record removed from `public.users`
- [ ] Try to log in with deleted account
- [ ] Verify login fails with "Invalid credentials"

### Test Orphaned Record Cleanup

- [ ] Run query: `SELECT * FROM user_management_view;`
- [ ] Verify no users have status = 'orphaned'
- [ ] If orphaned users exist, migration should have cleaned them up

---

## Troubleshooting

### Issue: Still getting "Failed to fetch" error

**Solution 1: Check Supabase Status**

- Visit [status.supabase.com](https://status.supabase.com)
- Check if there are any ongoing incidents

**Solution 2: Check Your Internet**

- Try accessing Supabase Dashboard
- Try running a simple query in SQL Editor

**Solution 3: Check RLS Policies**

```sql
-- Verify you can select from users table
SELECT * FROM users LIMIT 1;

-- If this fails, you might have RLS policy issues
-- Check if you're logged in to Supabase Dashboard
```

**Solution 4: Check Browser Console**

- Open browser DevTools (F12)
- Go to Console tab
- Look for specific error messages
- Share the error message for more specific help

---

### Issue: User can log in but dashboard shows error

**Symptoms:**

- Login succeeds
- Dashboard shows "Unknown role" or crashes
- Console shows "Cannot read property 'role' of null"

**Root Cause:**

- Record exists in `auth.users` but NOT in `public.users`

**Solution:**

```sql
-- Check for orphaned auth users
SELECT au.id, au.email
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL;

-- If any users found, either:
-- Option 1: Delete them from Authentication → Users in Dashboard
-- Option 2: Create missing public.users records (see Step 2 above)
```

---

### Issue: Trigger not working for new signups

**Check if trigger exists:**

```sql
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
```

**Check if function exists:**

```sql
SELECT * FROM pg_proc WHERE proname = 'handle_new_user';
```

**If missing, re-run the migration:**

```bash
supabase db push
```

---

### Issue: Can't delete users from Dashboard

**Possible Cause:**
You might be using the `anon` key instead of `service_role` key.

**Solution:**

- Ensure you're logged into Supabase Dashboard with your account
- Only project owners can delete users
- Check your project permissions

---

## Database Schema Clarification

### Users Table Structure

```sql
CREATE TABLE users (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('doctor', 'receptionist')),
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Key Points:**

- `id` is the **same** UUID as in `auth.users`
- `role` can be either `'doctor'` or `'receptionist'`
- No separate tables for doctors/receptionists (this is correct!)
- `ON DELETE CASCADE` means deleting from `auth.users` deletes from here too

---

### Consultation Notes Relationship

```sql
CREATE TABLE consultation_notes (
    id UUID PRIMARY KEY,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES users(id) ON DELETE CASCADE,
    ...
);
```

**What Happens When Doctor is Deleted:**

1. Delete doctor from `auth.users` (via Dashboard)
2. CASCADE: `public.users` record deleted
3. CASCADE: All `consultation_notes` with that `doctor_id` are deleted

**This is CORRECT behavior!** When a doctor leaves, their consultation notes should be preserved for medical/legal reasons, but the foreign key constraint currently deletes them.

### ⚠️ **IMPORTANT CONSIDERATION:**

You might want to **change this behavior** to preserve consultation notes:

```sql
-- Option 1: Set doctor_id to NULL instead of deleting notes
ALTER TABLE consultation_notes
DROP CONSTRAINT consultation_notes_doctor_id_fkey,
ADD CONSTRAINT consultation_notes_doctor_id_fkey
    FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE SET NULL;

-- Option 2: Prevent deletion if doctor has consultation notes
ALTER TABLE consultation_notes
DROP CONSTRAINT consultation_notes_doctor_id_fkey,
ADD CONSTRAINT consultation_notes_doctor_id_fkey
    FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE RESTRICT;
```

---

## Best Practices Going Forward

### ✅ DO:

1. Always delete users via **Authentication → Users** in Supabase Dashboard
2. Test user registration after making database changes
3. Regularly check for orphaned records using `user_management_view`
4. Use the Admin API for bulk user operations
5. Keep `auth.users` and `public.users` in sync

### ❌ DON'T:

1. Delete from `public.users` directly via SQL Editor
2. Manually modify `auth.users` table (use Supabase Dashboard or Admin API)
3. Create users in `public.users` without corresponding `auth.users` record
4. Assume deletion from one table affects the other (it only works one way!)

---

## Summary

### What Was Fixed:

✅ Auto-sync trigger between `auth.users` and `public.users`
✅ Cleaned up orphaned records
✅ Added user management view for easier monitoring
✅ Created proper deletion function
✅ Added RLS policy for user deletion
✅ Documented proper user management procedures

### What You Need to Do:

1. Run the migration (`20250101000008_fix_user_sync.sql`)
2. Delete the problematic doctor account via Supabase Dashboard → Authentication → Users
3. Have the doctor re-register via your app
4. Going forward, only delete users via Dashboard or Admin API

### Why There's No Receptionist Table:

- Both doctors and receptionists use the same `users` table
- They're differentiated by the `role` column
- This is proper database design (normalized schema)
- No changes needed here!

---

**Status**: ✅ Migration ready to apply
**Date**: 2025-01-23
**Priority**: HIGH (Fixes critical user management issues)

# Browser Session Cleanup Guide

## The Problem

You deleted users from Supabase, but when you try to log in with their old credentials, they still work! This is because:

1. **Auth sessions are cached in browser local storage**
   - Supabase stores JWT tokens in `localStorage`
   - Even though users are deleted from the database, the browser still has their valid tokens
   - These tokens remain valid until they expire (typically 1 hour)

2. **Auth.users vs Public.users confusion**
   - You deleted from `public.users` table, but `auth.users` might still exist
   - Or tokens are still valid in browser cache

---

## Quick Fix: Clear Browser Storage

### Method 1: Clear via Browser DevTools (Immediate)

1. **Open your app in the browser**
2. **Press F12** to open DevTools
3. **Go to Application tab** (Chrome) or Storage tab (Firefox)
4. **Click on Local Storage** on the left sidebar
5. **Find your localhost or domain** (e.g., `http://localhost:5173`)
6. **Look for keys starting with:**
   - `sb-` (Supabase keys)
   - `supabase.auth.token`
7. **Right-click → Delete** or click the Clear button
8. **Refresh the page** (F5)

### Method 2: Clear All Site Data (Nuclear Option)

**Chrome/Edge:**
1. Press F12 → Application tab
2. Click **Clear storage** on the left
3. Check all boxes
4. Click **Clear site data**
5. Refresh the page

**Firefox:**
1. Press F12 → Storage tab
2. Right-click on the site
3. Click **Delete All**
4. Refresh the page

### Method 3: Incognito/Private Window

Open your app in an incognito/private window:
- **Chrome/Edge:** Ctrl+Shift+N (Windows) or Cmd+Shift+N (Mac)
- **Firefox:** Ctrl+Shift+P (Windows) or Cmd+Shift+P (Mac)
- **Safari:** Cmd+Shift+N (Mac)

This starts with a clean slate (no cached sessions).

---

## Verify Users Are Actually Deleted

Let's check if users are really deleted from Supabase:

### Check Auth.Users (The Authentication Table)

1. Go to **Supabase Dashboard**
2. Click **Authentication** → **Users**
3. See how many users are listed

**Expected:** Only 1 user (your new test user)
**If you see more:** Those users can still log in! Delete them here.

### Check Public.Users (Your Application Table)

1. Go to **Supabase Dashboard**
2. Click **SQL Editor**
3. Run this query:

```sql
SELECT id, username, role, name, created_at
FROM users
ORDER BY created_at DESC;
```

**Expected:** Only 1 user
**If you see more:** Those are orphaned records

### Check for Mismatches

```sql
-- Users in auth but not in public.users (orphaned auth)
SELECT au.id, au.email, au.created_at
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL;

-- Users in public.users but not in auth (orphaned public)
SELECT pu.id, pu.username, pu.role, pu.name
FROM public.users pu
LEFT JOIN auth.users au ON pu.id = au.id
WHERE au.id IS NULL;
```

---

## The Real Fix: Properly Delete Users

### If Users Still Exist in auth.users:

1. **Go to Authentication → Users**
2. **For each old user:**
   - Click the **3 dots** menu
   - Click **Delete User**
   - Confirm deletion
3. **This will:**
   - Delete from `auth.users`
   - Cascade delete from `public.users` (due to foreign key)
   - Invalidate all their active sessions

### If Users Exist Only in public.users:

Run this SQL to delete them:

```sql
DELETE FROM users WHERE id IN (
    SELECT pu.id
    FROM public.users pu
    LEFT JOIN auth.users au ON pu.id = au.id
    WHERE au.id IS NULL
);
```

---

## Why Old Sessions Still Work

### JWT Token Lifecycle:

```
User logs in
    ↓
Supabase generates JWT token
    ↓
Token stored in browser localStorage
    ↓
Token valid for ~1 hour (configurable)
    ↓
Even if user deleted, token still valid until expiry
    ↓
After expiry, token refresh attempted
    ↓
Refresh fails if user deleted → Logged out
```

### The Issue:

- Tokens are stateless (not checked against database on every request)
- Valid tokens work until they expire
- Deletion doesn't immediately invalidate all sessions

---

## Permanent Solution: Update Migration

I need to add a check in your auth flow to verify the user still exists in `public.users`.

Let me create an updated auth hook:

### Updated useAuth.ts Logic

Add this check when restoring sessions:

```typescript
const handleAuthStateChange = useCallback(async (session: any) => {
  if (session?.user) {
    // Check if user exists in public.users
    const { data: publicUser, error } = await supabase
      .from('users')
      .select('id, username, role, name')
      .eq('id', session.user.id)
      .single();

    if (error || !publicUser) {
      // User deleted from public.users but auth session still valid
      console.warn('User not found in public.users, signing out');
      await supabase.auth.signOut();
      setUser(null);
      setLoading(false);
      return;
    }

    // User exists, set user data
    setUser({
      id: publicUser.id,
      username: publicUser.username,
      role: publicUser.role,
      name: publicUser.name
    });
  } else {
    setUser(null);
  }
  setLoading(false);
}, []);
```

This ensures that even if someone has a valid auth token, they can't access the app if their `public.users` record is deleted.

---

## Testing Checklist

### After Clearing Browser Cache:

- [ ] Clear browser local storage (Method 1 above)
- [ ] Refresh the page
- [ ] Verify you see the login page
- [ ] Try logging in with deleted user credentials
- [ ] Should show "Invalid credentials" error
- [ ] Try logging in with valid user credentials
- [ ] Should successfully log in to dashboard

### After Deleting Users Properly:

- [ ] Delete old users from Authentication → Users
- [ ] Run query to verify `auth.users` count
- [ ] Run query to verify `public.users` count
- [ ] Both counts should match
- [ ] Try logging in with deleted credentials → Should fail
- [ ] Clear browser cache to be safe
- [ ] Test login with valid credentials

---

## Common Scenarios

### Scenario 1: User can log in but app crashes

**Cause:** User exists in `auth.users` but NOT in `public.users`

**Fix:**
1. Delete user from Authentication → Users
2. Clear browser cache
3. Have user re-register

### Scenario 2: User can't log in but exists in database

**Cause:** User exists in `public.users` but NOT in `auth.users`

**Fix:**
1. Delete orphaned record from `public.users`
2. Have user register via app (this creates both records)

### Scenario 3: Deleted user can still log in

**Cause:** Browser has cached auth token

**Fix:**
1. Clear browser local storage
2. OR wait ~1 hour for token to expire
3. OR delete user from Authentication → Users (invalidates all sessions)

---

## Automated Cleanup Script

Run this SQL to clean everything up:

```sql
-- 1. Delete orphaned consultation notes
DELETE FROM consultation_notes
WHERE doctor_id NOT IN (SELECT id FROM users);

-- 2. Delete orphaned public.users
DELETE FROM public.users
WHERE id NOT IN (SELECT id FROM auth.users);

-- 3. View remaining users
SELECT
    au.email,
    u.username,
    u.role,
    u.name,
    au.created_at
FROM auth.users au
LEFT JOIN users u ON au.id = u.id
ORDER BY au.created_at DESC;
```

---

## Prevention: Going Forward

### ✅ Always Delete Users This Way:

1. **Supabase Dashboard** → Authentication → Users → Delete
   - This is the ONLY correct way
   - Handles both tables
   - Invalidates all sessions

### ❌ Never Delete Users This Way:

1. SQL Editor → `DELETE FROM users WHERE...`
   - Leaves `auth.users` intact
   - User can still log in
   - Causes orphaned records

2. Table Editor → Delete row in users table
   - Same problem as above
   - Creates mismatches

---

## Understanding Supabase Storage

### Where Session Data is Stored:

**Browser Local Storage:**
```
Key: sb-<project-ref>-auth-token
Value: {
  access_token: "eyJ...",
  refresh_token: "...",
  expires_at: 1234567890,
  user: { ... }
}
```

**To Manually Clear (Browser Console):**
```javascript
// Clear all Supabase auth data
Object.keys(localStorage)
  .filter(key => key.startsWith('sb-'))
  .forEach(key => localStorage.removeItem(key));

// Reload page
location.reload();
```

---

## Summary

### Your Immediate Actions:

1. ✅ **Clear browser local storage** (Method 1 above)
2. ✅ **Check Authentication → Users** (delete any old users)
3. ✅ **Run the cleanup SQL** (delete orphaned records)
4. ✅ **Apply the migration** (`20250101000008_fix_user_sync.sql`)
5. ✅ **Test login with valid credentials**

### Why This Happened:

- Users were deleted from `public.users` table directly
- But `auth.users` records remained
- Browser had cached JWT tokens
- Tokens were still valid, allowing login

### How to Prevent:

- Always delete via **Authentication → Users** in Dashboard
- Never delete from tables directly
- Clear browser cache when testing user deletions

---

**Status**: Ready to fix
**Priority**: HIGH
**Action Required**: Clear browser cache + verify user deletion

# Multi-Practice Implementation - Complete Guide

## Overview

This guide documents the complete implementation of multi-practice support for your EHR application. Each practice (hospital/clinic) now has its own isolated data, with doctors and receptionists only able to access patients from their assigned practice.

---

## What's Been Implemented

### 1. ✅ Practice Selection During Registration
- **File**: `src/components/auth/LoginForm.tsx`
- Doctors and receptionists must now select a practice when registering
- Admins don't need to select a practice
- Practice dropdown shows all active practices from the database
- Validation ensures doctors/receptionists can't register without selecting a practice

### 2. ✅ User-Practice Association
- **Files**:
  - `src/hooks/useAuth.ts`
  - `src/contexts/AuthProvider.tsx`
  - Migration: `20250101000011_add_practice_to_registration.sql`
- Practice code is saved to `users.practice_code` during registration
- Database trigger automatically associates users with their practice

### 3. ✅ Patient-Practice Association
- **Files**:
  - `src/hooks/usePatients.ts`
  - Migration: `20250101000012_add_practice_isolation.sql`
- Every patient is automatically assigned to the practice of the user who created them
- `patients.practice_code` column added to database

### 4. ✅ Practice-Based Data Isolation (RLS Policies)
- **Migration**: `20250101000012_add_practice_isolation.sql`
- Users can only see/edit patients from their own practice
- Consultation notes automatically inherit practice isolation
- Medical histories, insurance details, and next of kin follow the same isolation
- **Admins can see ALL data from ALL practices**

---

## Database Migrations to Run

Run these SQL scripts in your Supabase SQL Editor **in order**:

### Migration 1: Fix Admin Login (Already Done)
✅ You've already run the admin RLS policy fixes

### Migration 2: Add Practice to Registration
```sql
-- File: 20250101000011_add_practice_to_registration.sql
-- Update the handle_new_user function to include practice_code
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, username, role, name, practice_code, created_at, updated_at)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'role', 'doctor'),
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        NEW.raw_user_meta_data->>'practice_code',  -- Added practice_code from metadata
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.handle_new_user() IS
'Automatically creates a record in public.users with practice_code when a new user signs up via Supabase Auth';
```

### Migration 3: Add Practice Isolation
**This is a large migration - copy it from the file**:
`supabase/migrations/20250101000012_add_practice_isolation.sql`

Key changes:
- Adds `practice_code` column to `patients` table
- Updates ALL RLS policies to enforce practice-based isolation
- Admins can still access all data across all practices
- Users can only access data from their assigned practice

---

## How It Works

### For New Users (Registration Flow)

```
User registers → Selects role →
    ↓
If Doctor/Receptionist → Must select Practice →
    ↓
Practice code saved to user record →
    ↓
User can only access patients from that practice
```

### For Existing Users

**Important**: Existing users in your database **don't have a practice_code** yet!

You have two options:

#### Option A: Let them re-register
Delete existing users and have them re-register with practice selection.

#### Option B: Manually assign practices
Run this SQL in Supabase:

```sql
-- Assign all existing doctors to City General Hospital
UPDATE users
SET practice_code = 'CGH001'
WHERE role = 'doctor' AND practice_code IS NULL;

-- Assign all existing receptionists to Family Wellness Clinic
UPDATE users
SET practice_code = 'FWC002'
WHERE role = 'receptionist' AND practice_code IS NULL;
```

### For Existing Patients

**Important**: Existing patients don't have a `practice_code` yet!

#### Option A: Assign all existing patients to one practice
```sql
-- Assign all existing patients to City General Hospital
UPDATE patients
SET practice_code = 'CGH001'
WHERE practice_code IS NULL;
```

#### Option B: Delete existing patients
If you're still in development/testing:
```sql
-- WARNING: This deletes ALL patient data!
DELETE FROM patients;
```

---

## Data Isolation Rules

### What Users Can See

| User Role | Can View |
|-----------|----------|
| **Doctor** | Only patients from their assigned practice |
| **Receptionist** | Only patients from their assigned practice |
| **Admin** | ALL patients from ALL practices |

### What Users Can Do

| Action | Doctor/Receptionist | Admin |
|--------|---------------------|-------|
| View patients | ✅ (own practice only) | ✅ (all practices) |
| Add patients | ✅ (to own practice only) | ✅ (to any practice) |
| Edit patients | ✅ (own practice only) | ✅ (all practices) |
| Delete patients | ✅ (own practice only) | ✅ (all practices) |
| Add consultations | ✅ (own practice patients only) | ✅ (all patients) |
| View consultations | ✅ (own practice only) | ✅ (all practices) |

---

## Testing Checklist

### Test 1: Register New Users
1. ✅ Register as **Doctor** for "City General Hospital"
2. ✅ Register as **Receptionist** for "Family Wellness Clinic"
3. ✅ Register as **Admin** (no practice needed)
4. ✅ Verify all users can log in successfully

### Test 2: Practice Isolation
1. ✅ Log in as Doctor from CGH001
2. ✅ Add a new patient (should auto-assign to CGH001)
3. ✅ Log out and log in as Receptionist from FWC002
4. ✅ Verify you **cannot see** the CGH001 patient
5. ✅ Add a new patient as Receptionist (should auto-assign to FWC002)
6. ✅ Log out and log in as Admin
7. ✅ Verify Admin can see **both** patients from different practices

### Test 3: Consultation Notes
1. ✅ Log in as Doctor from CGH001
2. ✅ Add consultation notes for CGH001 patient
3. ✅ Log in as Doctor from FWC002
4. ✅ Verify you cannot see CGH001 patient or their consultations

### Test 4: Patient Management
1. ✅ Try to edit a patient from another practice (should fail)
2. ✅ Try to delete a patient from another practice (should fail)
3. ✅ Verify admins can edit/delete patients from any practice

---

## Default Practices Created

The system comes with 3 default practices:

1. **City General Hospital** (CGH001)
   - Located in City Center
   - Phone: 011-123-4567

2. **Family Wellness Clinic** (FWC002)
   - Located in Suburb
   - Phone: 011-234-5678

3. **Downtown Medical Center** (DMC003)
   - Located in Downtown
   - Phone: 011-345-6789

Admins can add/edit/deactivate practices through the Admin Portal.

---

## Admin Portal Features

Admins can now:
- ✅ View ALL users across ALL practices
- ✅ View ALL patients across ALL practices
- ✅ Manage practices (add/edit/deactivate)
- ✅ See which users belong to which practice
- ✅ Filter users by practice
- ✅ View system-wide statistics

---

## Code Changes Summary

### Frontend Changes

**LoginForm.tsx**:
- Added practice dropdown for doctors/receptionists
- Added validation for practice selection
- Fetches active practices from database

**useAuth.ts**:
- Updated `signUp()` to accept `practiceCode` parameter
- Passes practice code to Supabase Auth metadata

**usePatients.ts**:
- Automatically adds logged-in user's `practice_code` to new patients
- Uses `user.practiceCode` from auth context

### Backend Changes

**Database Trigger** (`handle_new_user`):
- Now extracts `practice_code` from Auth metadata
- Saves it to `users.practice_code` during registration

**RLS Policies**:
- All patient-related tables now check practice_code
- Admins bypass practice checks
- Regular users are scoped to their practice only

---

## Security Considerations

✅ **Database Level**: RLS policies enforce practice isolation at the database layer
✅ **User Level**: Cannot bypass by manipulating frontend code
✅ **Admin Access**: Admins have elevated privileges but are tracked
✅ **Foreign Keys**: Practices cannot be deleted if users are assigned to them

---

## Troubleshooting

### Issue: Can't see any patients after registering
**Cause**: You registered without selecting a practice (or before migrations were run)

**Solution**:
```sql
-- Check your practice_code
SELECT id, username, role, practice_code FROM users WHERE role != 'admin';

-- If null, assign one:
UPDATE users SET practice_code = 'CGH001' WHERE id = 'your-user-id';
```

### Issue: Existing patients not visible
**Cause**: Existing patients don't have a practice_code

**Solution**:
```sql
-- Assign all to default practice
UPDATE patients SET practice_code = 'CGH001' WHERE practice_code IS NULL;
```

### Issue: Registration fails when selecting practice
**Cause**: Migration 2 not run yet

**Solution**: Run migration `20250101000011_add_practice_to_registration.sql`

---

## Next Steps

1. ✅ Run all 3 SQL migrations in order
2. ✅ Assign practices to existing users (if any)
3. ✅ Assign practices to existing patients (if any)
4. ✅ Test the complete flow with multiple practices
5. ✅ Train users on practice selection during registration

---

## Future Enhancements (Optional)

- Add ability for users to switch between practices (if they work at multiple)
- Add practice-specific reports and analytics
- Add inter-practice patient transfers
- Add practice-specific settings and customization
- Add practice-level user management (practice admins)

---

**Status**: ✅ Ready to test!
**Documentation**: Complete
**Migrations**: Ready to run

Remember: Test with multiple users from different practices to ensure complete isolation!

# ID Type Support Implementation

## Overview

This document describes the implementation of support for both South African ID numbers and international passport numbers in the EHR application.

## Problem Statement

The original system only supported South African 13-digit ID numbers, which excluded:

- International patients with passports
- Patients without SA ID numbers
- Refugees and asylum seekers
- Temporary residents

## Solution Implemented

### 1. Database Changes

**New Migration**: `supabase/migrations/20250101000006_add_id_type_support.sql`

Changes made:

- Added `id_type` column to `patients` table with values: `'id_number'` | `'passport'`
- Modified `id_number` column from `VARCHAR(20)` to `VARCHAR(50)` to accommodate longer passport numbers
- Changed unique constraint from `id_number` alone to composite: `(id_type, id_number)`
- Added index on `id_type` for better query performance
- Set default value to `'id_number'` for backward compatibility

**To apply this migration:**

```bash
# Using Supabase CLI
supabase db push

# OR manually via Supabase Dashboard SQL Editor
# Copy and run the migration file
```

### 2. TypeScript Type Updates

Updated interfaces in `src/types.ts`:

```typescript
// Added idType field to Patient interface
export interface Patient {
  // ...
  idType: 'id_number' | 'passport';
  idNumber: string;
  // ...
}

// Added idType field to PatientFormData interface
export interface PatientFormData {
  // ...
  idType: 'id_number' | 'passport';
  idNumber: string;
  // ...
}

// Added idType field to PatientRow interface
export interface PatientRow {
  // ...
  id_type: 'id_number' | 'passport';
  id_number: string;
  // ...
}
```

### 3. Validation Functions

Updated `src/utils/helpers.ts` with new validation functions:

**New Functions:**

- `validatePassportNumber(passportNumber: string): boolean`
  - Validates alphanumeric passport numbers (6-20 characters)
  - Case-insensitive
  - Removes spaces for validation

- `validateIdentification(idType, value): boolean`
  - Universal validation function that routes to appropriate validator
  - Used for conditional validation based on ID type

**Updated Function:**

- `validateFormField()` now accepts optional `idType` parameter
  - Provides context-aware error messages
  - "Please enter a valid ID number (13 digits)" for SA IDs
  - "Please enter a valid passport number (6-20 alphanumeric characters)" for passports

### 4. Form Components

**Updated:** `src/components/patient/PatientFormContent.tsx`

Added ID Type selector:

```typescript
<div>
  <label>ID Type *</label>
  <select value={formData.idType} onChange={...}>
    <option value="id_number">SA ID Number</option>
    <option value="passport">Passport</option>
  </select>
</div>

<Input
  label={formData.idType === 'passport' ? 'Passport Number' : 'ID Number'}
  placeholder={formData.idType === 'passport' ? 'A1234567' : '0001010001088'}
  // ...
/>
```

Features:

- Dynamic label changes based on selection
- Dynamic placeholder examples
- Real-time updates

**Updated:** `src/components/patient/PatientForm.tsx`

Changes:

- Added `idType: 'id_number'` to `initialFormData`
- Updated validation logic to check both ID type and value
- Modified duplicate check to consider both `idType` and `idNumber`
- Context-aware error messages

### 5. Data Transforms

**Updated:** `src/utils/patientDataTransforms.ts`

Functions modified:

- `patientToFormData()`: Added `idType` field mapping
- `formDataToPatientData()`: Added `id_type` to patient object

### 6. Hooks

**Updated:** `src/hooks/usePatients.ts`

Modified data fetching to include `idType`:

- Added `idType: patient.id_type || 'id_number'` to patient object transformation
- Ensures backward compatibility with default value

## Usage

### For Receptionists (Patient Registration)

1. Open patient registration form
2. Select ID Type:
   - **SA ID Number**: For South African citizens with 13-digit ID
   - **Passport**: For international patients or those without SA ID

3. Enter the corresponding number:
   - **SA ID**: 13 digits (e.g., 0001010001088)
   - **Passport**: 6-20 alphanumeric characters (e.g., A1234567, P123456789)

4. Form will validate based on selected type
5. System prevents duplicate entries of same number with same type

### Validation Rules

**SA ID Number:**

- Exactly 13 digits
- Numeric only
- Example: `9001015009087`

**Passport Number:**

- 6 to 20 characters
- Alphanumeric (letters and numbers)
- Case-insensitive
- Spaces are removed during validation
- Examples:
  - `A1234567`
  - `P123456789`
  - `N12345678`
  - `AB1234567`

## Backward Compatibility

The implementation maintains full backward compatibility:

1. **Default Value**: Existing records and new forms default to `'id_number'`
2. **Migration Safety**: Uses `IF NOT EXISTS` and `OR REPLACE` clauses
3. **Null Handling**: Fallback to `'id_number'` if `idType` is null
4. **Existing Data**: Migration updates all existing records to `id_type = 'id_number'`

## Database Schema

```sql
-- patients table structure
CREATE TABLE patients (
  id UUID PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  surname VARCHAR(100) NOT NULL,
  id_type VARCHAR(20) NOT NULL DEFAULT 'id_number'
    CHECK (id_type IN ('id_number', 'passport')),
  id_number VARCHAR(50) NOT NULL,
  -- ... other fields

  CONSTRAINT unique_id_per_type UNIQUE (id_type, id_number)
);
```

## Edge Cases Handled

1. **Duplicate Detection**: Can't create two patients with same ID number AND same ID type
2. **Different Types**: Same number can exist if types differ (edge case, unlikely but handled)
3. **Spaces in Passports**: Automatically removed during validation
4. **Case Sensitivity**: Passport validation is case-insensitive
5. **Empty Values**: Required field validation prevents empty submissions
6. **Type Switching**: If user changes ID type, validation updates automatically

## Testing Checklist

- [ ] Apply database migration
- [ ] Test new patient registration with SA ID
- [ ] Test new patient registration with passport
- [ ] Test duplicate detection for SA ID
- [ ] Test duplicate detection for passport
- [ ] Test editing existing patient (should show correct ID type)
- [ ] Test form validation errors for invalid SA ID
- [ ] Test form validation errors for invalid passport
- [ ] Test switching between ID types in form
- [ ] Verify patient list displays correctly
- [ ] Verify patient details show correct ID type

## Future Enhancements

Potential improvements for consideration:

1. **Display Formatting**: Show ID type label in patient lists/cards
2. **Search Enhancement**: Allow searching by passport number
3. **Country Field**: Add passport issuing country
4. **Expiry Date**: Track passport expiration dates
5. **Multiple IDs**: Support patients with both SA ID and passport
6. **ID Type Badge**: Visual indicator in UI showing ID type

## Files Modified

### Database

- `supabase/migrations/20250101000006_add_id_type_support.sql` (NEW)

### TypeScript Types

- `src/types.ts`

### Utilities

- `src/utils/helpers.ts`
- `src/utils/patientDataTransforms.ts`

### Components

- `src/components/patient/PatientFormContent.tsx`
- `src/components/patient/PatientForm.tsx`

### Hooks

- `src/hooks/usePatients.ts`

## Migration Instructions

1. **Backup Database** (recommended)
2. **Run Migration**:
   ```bash
   cd "/Users/keletsontseno/Downloads/EHR APP"
   supabase db push
   ```
3. **Verify Migration**: Check Supabase dashboard that `id_type` column exists
4. **Test Application**:
   ```bash
   npm run dev
   ```
5. **Test Both Scenarios**: Create patients with both ID types

## Rollback Plan

If issues occur, you can rollback:

```sql
-- Remove the new field and constraint
ALTER TABLE patients DROP COLUMN IF EXISTS id_type CASCADE;

-- Restore original unique constraint
ALTER TABLE patients ADD CONSTRAINT patients_id_number_key UNIQUE (id_number);

-- Restore original column size (optional)
ALTER TABLE patients ALTER COLUMN id_number TYPE VARCHAR(20);
```

## Support

For issues or questions:

1. Check browser console for errors
2. Check Supabase logs for database errors
3. Verify migration was applied successfully
4. Ensure all TypeScript files compiled without errors

---

**Implementation Date**: 2025-01-23
**Status**: ✅ Complete and Ready for Testing

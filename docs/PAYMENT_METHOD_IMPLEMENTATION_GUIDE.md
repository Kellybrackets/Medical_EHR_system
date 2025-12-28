# Payment Method Implementation Guide

## Overview

This guide shows how to implement payment method tracking (Cash vs Medical Aid) for patients in your EHR system. Receptionists can easily toggle between payment methods when registering or editing patients.

---

## Features Implemented

- **Payment Method Selector**: Easy toggle between Cash and Medical Aid during patient registration
- **Visual Badges**: Color-coded badges showing payment method on all dashboards
- **Smart Filtering**: Filter patients by payment method in Receptionist Dashboard
- **Conditional Fields**: Medical Aid details only show when Medical Aid is selected
- **Database Integration**: Full database support with indexing for performance

---

## Step 1: Database Setup (5 minutes)

### Run SQL Script

**File:** `ADD_PAYMENT_METHOD.sql`

**In Supabase SQL Editor, run:**

```sql
ALTER TABLE patients
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'cash'
CHECK (payment_method IN ('cash', 'medical_aid'));

CREATE INDEX IF NOT EXISTS idx_patients_payment_method
ON patients(payment_method);

UPDATE patients
SET payment_method = 'cash'
WHERE payment_method IS NULL;
```

**What this does:**

- Adds `payment_method` column with cash/medical_aid options
- Sets default to 'cash' for all existing patients
- Creates index for fast filtering

---

## Step 2: TypeScript Types (Already Done ✅)

**File:** `src/types.ts`

```typescript
export type PaymentMethod = 'cash' | 'medical_aid';

export interface Patient {
  // ... existing fields ...
  paymentMethod?: PaymentMethod;
}

export interface PatientFormData {
  // ... existing fields ...
  paymentMethod: 'cash' | 'medical_aid';
  medicalAidProvider: string;
  medicalAidNumber: string;
  medicalAidPlan: string;
}
```

---

## Step 3: Data Loading (Already Done ✅)

**File:** `src/hooks/usePatients.ts`

Added payment_method to patient data loading:

```typescript
paymentMethod: patient.payment_method || 'cash',
```

**File:** `src/utils/patientDataTransforms.ts`

Added payment_method to form transforms:

```typescript
// When loading patient to form
paymentMethod: patient.paymentMethod || 'cash',

// When saving patient from form
payment_method: cleaned.paymentMethod,
```

---

## Step 4: Patient Form UI (Already Done ✅)

**File:** `src/components/patient/PatientFormContent.tsx`

### Payment Method Selector

Added a beautiful toggle-style selector:

```tsx
<div className="grid grid-cols-2 gap-4">
  <button
    type="button"
    onClick={() => updateFormField('paymentMethod', 'cash')}
    className={`
      p-4 border-2 rounded-lg text-center transition-all
      ${
        formData.paymentMethod === 'cash'
          ? 'border-blue-500 bg-blue-50 text-blue-700'
          : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
      }
    `}
  >
    <div className="font-semibold mb-1">Cash / Self Pay</div>
    <div className="text-xs text-gray-600">Patient pays directly</div>
  </button>

  <button
    type="button"
    onClick={() => updateFormField('paymentMethod', 'medical_aid')}
    className={`
      p-4 border-2 rounded-lg text-center transition-all
      ${
        formData.paymentMethod === 'medical_aid'
          ? 'border-blue-500 bg-blue-50 text-blue-700'
          : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
      }
    `}
  >
    <div className="font-semibold mb-1">Medical Aid</div>
    <div className="text-xs text-gray-600">Insured patient</div>
  </button>
</div>
```

### Conditional Medical Aid Fields

Medical Aid fields only show when "Medical Aid" is selected:

```tsx
{formData.paymentMethod === 'medical_aid' && (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    <Input label="Medical Aid Provider" ... />
    <Input label="Member Number" ... />
    <Input label="Plan" ... />
  </div>
)}
```

---

## Step 5: Dashboard Badges (Already Done ✅)

### Receptionist Dashboard

**File:** `src/components/dashboards/ReceptionistDashboard.tsx`

Added payment method badges next to consultation status:

```tsx
{
  patient.paymentMethod === 'medical_aid' ? (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-medium text-xs">
      Medical Aid
    </span>
  ) : (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-100 text-gray-800 font-medium text-xs">
      Cash
    </span>
  );
}
```

### Doctor Dashboard

**File:** `src/components/dashboards/DoctorDashboard.tsx`

Added payment method badges in patient queue:

```tsx
<div className="mt-1">
  {patient.paymentMethod === 'medical_aid' ? (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-medium text-xs">
      Medical Aid
    </span>
  ) : (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-100 text-gray-800 font-medium text-xs">
      Cash
    </span>
  )}
</div>
```

---

## Step 6: Filtering (Already Done ✅)

### Filter Component

**File:** `src/components/ui/PatientSearchFilter.tsx`

Added payment method filter dropdown:

```tsx
<select
  value={paymentFilter}
  onChange={(e) => onPaymentFilterChange(e.target.value as 'all' | 'cash' | 'medical_aid')}
  className="rounded-md border border-gray-300 px-3 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
>
  <option value="all">All Payment Methods</option>
  <option value="cash">Cash</option>
  <option value="medical_aid">Medical Aid</option>
</select>
```

### Filter Logic

**File:** `src/utils/patientUtils.ts`

Updated filterPatients function:

```typescript
export const filterPatients = (
  patients: Patient[],
  searchTerm: string,
  genderFilter: 'all' | 'Male' | 'Female',
  paymentFilter: 'all' | 'cash' | 'medical_aid' = 'all',
): Patient[] => {
  return patients.filter((patient) => {
    // Gender filter
    if (genderFilter !== 'all' && patient.sex !== genderFilter) {
      return false;
    }

    // Payment method filter
    if (paymentFilter !== 'all' && patient.paymentMethod !== paymentFilter) {
      return false;
    }

    // Search filter
    // ... existing search logic
  });
};
```

---

## 🎯 Summary of Changes

| File                                                  | Change                    | Lines Added |
| ----------------------------------------------------- | ------------------------- | ----------- |
| `ADD_PAYMENT_METHOD.sql`                              | NEW - Database schema     | ~50 lines   |
| `src/types.ts`                                        | Add PaymentMethod type    | +3 lines    |
| `src/hooks/usePatients.ts`                            | Load payment_method field | +2 lines    |
| `src/utils/patientDataTransforms.ts`                  | Transform payment method  | +4 lines    |
| `src/components/patient/PatientFormContent.tsx`       | Payment selector UI       | +50 lines   |
| `src/components/patient/PatientForm.tsx`              | Initial form data         | +1 line     |
| `src/components/dashboards/ReceptionistDashboard.tsx` | Badges + filtering        | +25 lines   |
| `src/components/dashboards/DoctorDashboard.tsx`       | Badge display             | +10 lines   |
| `src/components/ui/PatientSearchFilter.tsx`           | Filter dropdown           | +20 lines   |
| `src/utils/patientUtils.ts`                           | Filter logic              | +8 lines    |

**Total:** ~173 lines of code

---

## ✅ What You Get

### Patient Registration

- **Easy Toggle**: Click Cash or Medical Aid - that's it!
- **Smart UI**: Medical Aid fields only show when needed
- **Visual Feedback**: Selected option highlights in blue
- **Default**: All patients default to Cash

### Dashboard Features

- **Color-Coded Badges**:
  - 🟣 **Purple**: Medical Aid patients
  - ⚪ **Gray**: Cash patients
- **Quick Filtering**: Filter entire patient list by payment method
- **Instant Visibility**: See payment method at a glance

### Receptionist Workflow

1. Click "Add New Patient"
2. Toggle Cash or Medical Aid
3. If Medical Aid selected, fill in provider details
4. Save patient
5. Badge shows immediately on dashboard

### Doctor Workflow

- See patient payment method in queue
- Helps prioritize billing procedures
- No need to ask patient about payment

---

## 🧪 Testing

1. **Run SQL script** in Supabase
2. **Restart dev server**: `npm run dev`
3. **Login as Receptionist**
4. **Add new patient**:
   - Select "Medical Aid"
   - Fill in provider details
   - Save
5. **Check Dashboard**:
   - Purple "Medical Aid" badge appears
   - Filter by "Medical Aid" - patient shows up
   - Filter by "Cash" - patient doesn't show up
6. **Edit patient**:
   - Change to "Cash"
   - Medical Aid fields disappear
   - Badge updates to gray "Cash"

---

## 🎨 Design Decisions

### Why Purple for Medical Aid?

- Distinct from status colors (yellow/green/blue)
- Associated with healthcare/premium services
- High visibility and contrast

### Why Conditional Fields?

- Reduces form clutter for cash patients
- Prevents incomplete Medical Aid data
- Cleaner UX - only show what's relevant

### Why Default to Cash?

- Most clinics have more cash patients
- Safer assumption (no insurance to claim)
- Can easily change if needed

---

## 🔧 Customization

### Change Default Payment Method

**File:** `ADD_PAYMENT_METHOD.sql`

```sql
ALTER TABLE patients
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'medical_aid'  -- Changed from 'cash'
CHECK (payment_method IN ('cash', 'medical_aid'));
```

### Add More Payment Types

**File:** `src/types.ts`

```typescript
export type PaymentMethod = 'cash' | 'medical_aid' | 'private_insurance' | 'company';
```

Then update SQL constraint:

```sql
CHECK (payment_method IN ('cash', 'medical_aid', 'private_insurance', 'company'))
```

---

## 📊 Benefits

### For Clinic Management

- **Better Reporting**: Track cash vs insured patient ratio
- **Billing Efficiency**: Know immediately who needs claims
- **Financial Planning**: Forecast based on payment methods

### For Receptionists

- **Faster Registration**: No confusion about payment
- **Easy Filtering**: Find all Medical Aid patients quickly
- **Clear Records**: Visual badges prevent errors

### For Doctors

- **Quick Reference**: See payment method in queue
- **Treatment Planning**: Consider insurance coverage
- **Documentation**: Know what's covered vs out-of-pocket

---

## 🎉 Done!

You now have a complete payment method tracking system with:

- ✅ Easy toggle selector in registration form
- ✅ Conditional Medical Aid fields
- ✅ Color-coded badges on all dashboards
- ✅ Powerful filtering capability
- ✅ Database indexing for performance
- ✅ Minimal code changes (~173 lines)

**Total implementation time:** ~45 minutes

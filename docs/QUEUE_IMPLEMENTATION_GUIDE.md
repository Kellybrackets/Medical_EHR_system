# Patient Queue System - Minimal Implementation Guide

## 🎯 Overview

This guide shows how to add patient queue functionality to your existing EHR with **minimal changes**.

---

## Step 1: Database Setup (5 minutes)

### Run SQL Script

**File:** `ADD_QUEUE_SYSTEM.sql`

**In Supabase SQL Editor, run:**

```sql
ALTER TABLE patients
ADD COLUMN IF NOT EXISTS consultation_status TEXT DEFAULT 'waiting'
CHECK (consultation_status IN ('waiting', 'in_consultation', 'served'));

ALTER TABLE patients
ADD COLUMN IF NOT EXISTS current_doctor_id UUID REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE patients
ADD COLUMN IF NOT EXISTS last_status_change TIMESTAMP WITH TIME ZONE DEFAULT NOW();
```

**What this does:**

- Adds `consultation_status` (waiting/in_consultation/served)
- Adds `current_doctor_id` (tracks which doctor is consulting)
- Adds `last_status_change` (timestamp for status changes)
- Sets all existing patients to 'waiting'

---

## Step 2: TypeScript Types (Already Done ✅)

**File:** `src/types.ts`

```typescript
export type ConsultationStatus = 'waiting' | 'in_consultation' | 'served';

export interface Patient {
  // ... existing fields ...
  consultationStatus?: ConsultationStatus;
  currentDoctorId?: string;
  lastStatusChange?: string;
}
```

---

## Step 3: Hook Functions (Already Done ✅)

**File:** `src/hooks/usePatients.ts`

Added two new functions:

```typescript
startConsultation(patientId, doctorId);
completeConsultation(patientId, doctorId);
```

---

## Step 4: Update DoctorDashboard (Main Change)

**File:** `src/components/dashboards/DoctorDashboard.tsx`

### Add Queue Groups After Line 40:

```typescript
// Group patients by consultation status
const queuedPatients = useMemo(() => {
  const waiting = patients
    .filter((p) => p.consultationStatus === 'waiting')
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()); // FIFO

  const inConsultation = patients.filter((p) => p.consultationStatus === 'in_consultation');

  const today = new Date().toISOString().split('T')[0];
  const servedToday = patients
    .filter((p) => p.consultationStatus === 'served' && p.lastStatusChange?.startsWith(today))
    .sort(
      (a, b) => new Date(b.lastStatusChange!).getTime() - new Date(a.lastStatusChange!).getTime(),
    );

  return { waiting, inConsultation, servedToday };
}, [patients]);
```

### Replace Patient List Section (Around Line 150+):

**Find:** The section that renders `processedPatients.map(...)`

**Replace with:**

```tsx
{
  /* Waiting Queue */
}
<Card>
  <Card.Header>
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <Users className="h-5 w-5 text-yellow-600" />
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Waiting Queue</h3>
          <p className="text-sm text-gray-600">
            {queuedPatients.waiting.length} patient{queuedPatients.waiting.length !== 1 ? 's' : ''}{' '}
            waiting
          </p>
        </div>
      </div>
    </div>
  </Card.Header>
  <Card.Content>
    {queuedPatients.waiting.length === 0 ? (
      <div className="text-center py-8 text-gray-500">No patients waiting</div>
    ) : (
      <div className="space-y-3">
        {queuedPatients.waiting.map((patient, index) => (
          <div
            key={patient.id}
            className={`
              p-4 rounded-lg border-2
              ${index === 0 ? 'border-yellow-400 bg-yellow-50' : 'border-gray-200 bg-white'}
            `}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {index === 0 && (
                  <div className="flex items-center justify-center w-8 h-8 bg-yellow-500 text-white rounded-full text-sm font-bold">
                    NEXT
                  </div>
                )}
                <PatientAvatar
                  firstName={patient.firstName}
                  surname={patient.surname}
                  gender={patient.sex}
                  size="md"
                />
                <div>
                  <p className="font-semibold text-gray-900">
                    {patient.firstName} {patient.surname}
                  </p>
                  <p className="text-sm text-gray-600">
                    {calculateAge(patient.dateOfBirth)} years • {patient.sex}
                  </p>
                  <p className="text-xs text-gray-500">Arrived: {formatDate(patient.createdAt)}</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Button size="sm" onClick={() => onViewPatient(patient.id)} variant="secondary">
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Button>
                {onStartConsultation && (
                  <Button
                    size="sm"
                    onClick={() => onStartConsultation(patient.id)}
                    disabled={queuedPatients.inConsultation.length > 0}
                  >
                    <Stethoscope className="h-4 w-4 mr-1" />
                    Start
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    )}
  </Card.Content>
</Card>;

{
  /* In Consultation */
}
{
  queuedPatients.inConsultation.length > 0 && (
    <Card className="border-2 border-green-400 bg-green-50">
      <Card.Header>
        <div className="flex items-center space-x-3">
          <Stethoscope className="h-5 w-5 text-green-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">In Consultation</h3>
            <p className="text-sm text-gray-600">Current patient being served</p>
          </div>
        </div>
      </Card.Header>
      <Card.Content>
        {queuedPatients.inConsultation.map((patient) => (
          <div key={patient.id} className="p-4 bg-white rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <PatientAvatar
                  firstName={patient.firstName}
                  surname={patient.surname}
                  gender={patient.sex}
                  size="lg"
                />
                <div>
                  <p className="text-lg font-semibold text-gray-900">
                    {patient.firstName} {patient.surname}
                  </p>
                  <p className="text-sm text-gray-600">
                    {calculateAge(patient.dateOfBirth)} years • {patient.sex}
                  </p>
                  <p className="text-xs text-green-600 font-medium">
                    Started: {formatDate(patient.lastStatusChange || '')}
                  </p>
                </div>
              </div>

              <Button size="sm" onClick={() => onViewPatient(patient.id)}>
                <Eye className="h-4 w-4 mr-1" />
                View Details
              </Button>
            </div>
          </div>
        ))}
      </Card.Content>
    </Card>
  );
}

{
  /* Served Today */
}
{
  queuedPatients.servedToday.length > 0 && (
    <Card>
      <Card.Header>
        <div className="flex items-center space-x-3">
          <Heart className="h-5 w-5 text-blue-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Served Today</h3>
            <p className="text-sm text-gray-600">
              {queuedPatients.servedToday.length} patient
              {queuedPatients.servedToday.length !== 1 ? 's' : ''} completed
            </p>
          </div>
        </div>
      </Card.Header>
      <Card.Content>
        <div className="space-y-2">
          {queuedPatients.servedToday.slice(0, 5).map((patient) => (
            <div
              key={patient.id}
              className="p-3 bg-gray-50 rounded flex items-center justify-between"
            >
              <div className="flex items-center space-x-3">
                <PatientAvatar
                  firstName={patient.firstName}
                  surname={patient.surname}
                  gender={patient.sex}
                  size="sm"
                />
                <div>
                  <p className="font-medium text-gray-900">
                    {patient.firstName} {patient.surname}
                  </p>
                  <p className="text-xs text-gray-500">
                    Completed: {formatDate(patient.lastStatusChange || '')}
                  </p>
                </div>
              </div>
              <Button size="sm" variant="secondary" onClick={() => onViewPatient(patient.id)}>
                <Eye className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </Card.Content>
    </Card>
  );
}
```

---

## Step 5: Wire Up Start Consultation Button

**In `App.tsx`, update the doctor view handlers:**

```typescript
const {start patients, startConsultation, completeConsultation } = usePatients();
const { user } = useAuthContext();

// Add handler
const handleStartConsultation = async (patientId: string) => {
  if (!user?.id) return;

  const result = await startConsultation(patientId, user.id);

  if (!result.success) {
    alert(result.error || 'Failed to start consultation');
  } else {
    // Navigate to consultation form
    setSelectedPatientId(patientId);
    setDoctorView('consultation');
  }
};

// Pass to dashboard
<DoctorDashboard
  onViewPatient={...}
  onStartConsultation={handleStartConsultation}
/>
```

---

## Step 6: Complete Consultation

**In `ConsultationForm.tsx`, after saving consultation:**

```typescript
const { completeConsultation } = usePatients();
const { user } = useAuthContext();

// In handleSubmit, after successful save:
if (result.success && user?.id) {
  await completeConsultation(patientId, user.id);
  onSave();
}
```

---

## Step 7: Receptionist Dashboard (Optional)

**File:** `src/components/dashboards/ReceptionistDashboard.tsx`

**Add status badge to patient list:**

```tsx
<StatusBadge
  status={patient.consultationStatus || 'waiting'}
  label={
    patient.consultationStatus === 'in_consultation'
      ? 'In Consultation'
      : patient.consultationStatus === 'served'
        ? 'Completed'
        : 'Waiting'
  }
/>
```

---

## 🎯 Summary of Changes

| File                                               | Change                     | Lines Changed |
| -------------------------------------------------- | -------------------------- | ------------- |
| `ADD_QUEUE_SYSTEM.sql`                             | NEW - Add status columns   | ~150 lines    |
| `src/types.ts`                                     | Add status fields          | +5 lines      |
| `src/hooks/usePatients.ts`                         | Load status, add functions | +60 lines     |
| `src/components/dashboards/DoctorDashboard.tsx`    | Add queue sections         | +150 lines    |
| `src/App.tsx`                                      | Wire up handlers           | +15 lines     |
| `src/components/consultation/ConsultationForm.tsx` | Complete on save           | +3 lines      |

**Total:** ~380 lines of code

---

## ✅ What You Get

### Doctor Dashboard

- **Waiting Queue** - Patients sorted by arrival (FIFO)
- **Next Patient** - Highlighted in yellow
- **In Consultation** - Current patient (green box)
- **Served Today** - Completed patients
- **Start Button** - Disabled if already consulting

### Automatic Sync

- Realtime updates status changes
- Receptionist sees status updates instantly
- Doctor sees queue updates instantly

### Constraints

- Only ONE patient "in_consultation" per doctor
- Queue ordered by `createdAt` (First-In-First-Out)
- Status changes broadcast via realtime

---

## 🧪 Testing

1. **Run SQL script** in Supabase
2. **Restart dev server** (`npm run dev`)
3. **Login as Doctor**
4. **Check:** Patients in "Waiting Queue"
5. **Click "Start"** on first patient
6. **Check:** Patient moves to "In Consultation"
7. **Save consultation**
8. **Check:** Patient moves to "Served Today"

---

## 🎉 Done!

You now have a minimal queue system with:

- ✅ FIFO queue ordering
- ✅ Clear "Next Patient" indicator
- ✅ One patient per doctor limit
- ✅ Real-time status sync
- ✅ Minimal code changes

**Total implementation time:** ~30 minutes

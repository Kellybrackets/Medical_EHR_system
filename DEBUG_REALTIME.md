# Debugging Realtime Issues

## Step 1: Check if SQL Script Was Run

**Open Supabase Dashboard → SQL Editor**

Run this query:
```sql
SELECT schemaname, tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime';
```

**Expected Output:**
```
schemaname | tablename
-----------+----------
public     | patients
```

**If `patients` is NOT listed:**
→ Run: `ALTER PUBLICATION supabase_realtime ADD TABLE patients;`

---

## Step 2: Check Realtime is Enabled in Project

**Supabase Dashboard → Database → Replication**

- Look for "Realtime" section
- Ensure it's enabled (toggle should be ON)
- Check if `patients` table is listed

**If disabled:**
→ Enable it in the dashboard

---

## Step 3: Check Browser Console

**Open DevTools → Console**

**When doctor opens dashboard, you should see:**
```
🔔 Setting up realtime subscription for patients table...
📡 Realtime subscription status: SUBSCRIBED
```

**If you see:**
```
⚠️ Supabase not configured, skipping realtime subscription
```
→ Check your `.env` file has Supabase credentials

**If you see:**
```
📡 Realtime subscription status: CHANNEL_ERROR
```
→ SQL script wasn't run or realtime not enabled

---

## Step 4: Check WebSocket Connection

**DevTools → Network → WS (WebSocket filter)**

**You should see:**
- Active WebSocket connection to Supabase
- Connection state: "101 Switching Protocols"

**If no WebSocket:**
→ Firewall blocking OR Supabase realtime not enabled

---

## Step 5: Test Event Broadcasting

**With two browser windows open (Doctor + Receptionist):**

**In RECEPTIONIST window console, add this:**
```javascript
// Check if events are being sent
console.log('Testing patient creation...');
```

**After creating patient, check DOCTOR console for:**
```
🆕 New patient inserted: { ... }
✅ Adding new patient to list
```

**If no message:**
→ Events not being broadcast (SQL issue)

---

## Common Issues & Fixes

### Issue 1: "SUBSCRIBED" but no events

**Problem:** Subscription connected but events not received

**Fix:** Realtime might be filtering by RLS policies

**Check RLS policy:**
```sql
-- Ensure doctors can SELECT patients
SELECT * FROM patients; -- Should return patients
```

---

### Issue 2: Events received but list not updating

**Problem:** Console shows "🆕 New patient inserted" but UI doesn't update

**Fix:** React state not updating correctly

**Add this to usePatients.ts for debugging:**
```typescript
setPatients(prev => {
  console.log('Current patients:', prev.length);
  console.log('Adding patient:', completePatient);
  return [...prev, completePatient];
});
```

---

### Issue 3: Duplicate patients

**Problem:** Same patient appears multiple times

**Fix:** Already handled, but check:
```typescript
const exists = prev.find(p => p.id === completePatient.id);
if (exists) {
  console.log('⚠️ Duplicate detected:', completePatient.id);
  return prev;
}
```

---

## Quick Diagnostic Commands

**Run in Browser Console (Doctor's tab):**

```javascript
// Check if Supabase is configured
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);

// Check realtime channels
console.log('Active channels:', window.supabase?.getChannels());
```

---

## Nuclear Option: Force Reload All Data

**If nothing works, add manual polling as fallback:**

In `usePatients.ts`, add:
```typescript
// Fallback: Poll every 30 seconds if realtime fails
useEffect(() => {
  const interval = setInterval(() => {
    console.log('🔄 Polling for updates (fallback)...');
    loadPatients();
  }, 30000); // 30 seconds

  return () => clearInterval(interval);
}, [loadPatients]);
```

This ensures data refreshes even if realtime fails.

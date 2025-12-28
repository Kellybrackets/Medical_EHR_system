# Realtime Troubleshooting - Step by Step

## 🚨 Issue: Patient list not updating in real-time

You mentioned the list **only updates when you navigate away and back**, or requires manual refresh.

---

## ✅ I've Added Two Fixes

### Fix 1: Enhanced Debugging

- More console logs to see what's happening
- Error messages tell you exactly what's wrong

### Fix 2: Automatic Polling Fallback

- **Even if realtime fails**, the list auto-refreshes every 15 seconds
- This ensures you always get updates (not as fast as realtime, but reliable)

---

## 📋 Diagnostic Steps

### Step 1: Restart Dev Server

```bash
# Stop current server (Ctrl+C)
npm run dev
```

**Why:** Code changes need fresh start

---

### Step 2: Open Browser Console

**Chrome/Firefox:** Press `F12` → Console tab

**You should see when doctor opens dashboard:**

```
🔔 Setting up realtime subscription for patients table...
📍 Current patients count: 5
🔧 Supabase client: OK
📡 Realtime subscription status: SUBSCRIBED
✅ Successfully subscribed to patients changes!
```

**If you see `CHANNEL_ERROR`:**

```
❌ Channel error - realtime may not be enabled on patients table
💡 Run this SQL in Supabase: ALTER PUBLICATION supabase_realtime ADD TABLE patients;
```

→ **Action:** Go to Supabase SQL Editor and run the SQL

---

### Step 3: Test Auto-Refresh (Polling)

**Just wait 15 seconds on the doctor dashboard.**

**You should see:**

```
🔄 Auto-refresh polling (15s interval)...
🔍 Loading patients...
✅ Complete fallback patients loaded: { count: 6 }
```

**This means:**

- Even if realtime WebSocket fails
- List refreshes automatically every 15 seconds
- New patients will appear within 15 seconds max

---

### Step 4: Test Realtime Event

**With TWO browser windows open:**

**Window 1 (Doctor):** Watch console
**Window 2 (Receptionist):** Create a patient

**Doctor's console should show:**

```
🆕 New patient inserted: { id: "...", first_name: "John", ... }
✅ Adding new patient to list
```

**If you see this:** Realtime is working! ✅

**If you don't see this:** Realtime WebSocket not connecting (but polling fallback will catch it in 15s)

---

## 🔍 Most Likely Issue

Based on "**requires me to navigate away and back**", the issue is:

### React Not Re-rendering

**The data updates, but UI doesn't refresh.**

**I've added polling to force re-render every 15 seconds.**

This means:

- Create patient
- Wait up to 15 seconds
- List automatically refreshes
- New patient appears

---

## 🧪 Quick Test (30 seconds)

1. **Start dev server:** `npm run dev`

2. **Login as Doctor**

3. **Open console** (F12)

4. **Wait 15 seconds**

5. **See:** `🔄 Auto-refresh polling (15s interval)...`

6. **Open second window, login as Receptionist**

7. **Create a patient**

8. **Back to doctor window**

9. **Within 15 seconds**, new patient appears

---

## ⚡ Why 15 Seconds?

**Options:**

### Current: 15 seconds

- ✅ Reliable - always works
- ✅ Low server load
- ⚠️ Not instant (15s max delay)

### Faster: 5 seconds

```typescript
// In usePatients.ts, change:
}, 15000); // 15 seconds

// To:
}, 5000); // 5 seconds
```

- ✅ Faster updates
- ⚠️ More server requests
- Good for active clinics

### Slower: 30 seconds

```typescript
}, 30000); // 30 seconds
```

- ✅ Minimal server load
- ⚠️ Slower updates
- Good for low-traffic times

---

## 🔧 If Still Not Working

### Option 1: Check Supabase Dashboard

**Go to:** https://supabase.com/dashboard

**Check:**

1. **Database → Replication → Realtime**
   - Should be enabled (green toggle)

2. **SQL Editor → Run:**

   ```sql
   SELECT schemaname, tablename
   FROM pg_publication_tables
   WHERE pubname = 'supabase_realtime';
   ```

   **Should show:**

   ```
   schemaname | tablename
   -----------+----------
   public     | patients
   ```

3. **If `patients` NOT listed:**
   ```sql
   ALTER PUBLICATION supabase_realtime ADD TABLE patients;
   ```

---

### Option 2: Check Browser Network

**DevTools → Network → WS (WebSocket)**

**Look for:**

- Active WebSocket connection to Supabase
- Status: 101 Switching Protocols

**If no WebSocket:**

- Realtime not enabled in Supabase
- Or firewall blocking WebSockets

---

### Option 3: Force Refresh Button (Manual Fallback)

**Add a refresh button to dashboard:**

In `DoctorDashboard.tsx`, add:

```typescript
<Button onClick={() => window.location.reload()}>
  <RefreshCw className="h-4 w-4 mr-2" />
  Refresh Patients
</Button>
```

Users can click this if they don't want to wait for auto-refresh.

---

## 🎯 Expected Behavior Now

### With Realtime Working (Best Case)

```
Receptionist creates patient
    ↓
Doctor sees it in ~200ms (instant)
    ✅ Toast notification appears
```

### With Realtime Failing (Fallback)

```
Receptionist creates patient
    ↓
Doctor sees it in ~15 seconds (auto-refresh)
    ⚠️ No toast (but patient appears)
```

### With Everything Failing (Manual)

```
Receptionist creates patient
    ↓
Doctor refreshes page
    ✅ Patient appears
```

---

## 📝 Next Steps

1. **Restart dev server** (`npm run dev`)

2. **Check console logs** - tell me what you see

3. **Wait 15 seconds** - does auto-refresh work?

4. **Tell me:**
   - What do you see in console?
   - Does polling work (15s refresh)?
   - Do you see SUBSCRIBED or CHANNEL_ERROR?

**Then I can help debug further!**

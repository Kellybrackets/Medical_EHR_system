# Lab Results Integration - Complete Setup Guide

This guide will walk you through setting up the complete lab results integration with Chiron.

## Table of Contents

1. [System Architecture Overview](#system-architecture-overview)
2. [Prerequisites](#prerequisites)
3. [Database Setup](#database-setup)
4. [Edge Function Deployment](#edge-function-deployment)
5. [Chiron Integration Configuration](#chiron-integration-configuration)
6. [Frontend Integration](#frontend-integration)
7. [Testing](#testing)
8. [Security Checklist](#security-checklist)
9. [Monitoring & Troubleshooting](#monitoring--troubleshooting)
10. [Next Steps](#next-steps)

---

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    YOUR EHR SYSTEM                      │
│                                                         │
│  Frontend (React)                                       │
│  ├── LabResultsTab (Patient View)                      │
│  ├── CriticalLabAlerts (Doctor Dashboard)              │
│  └── Real-time Subscriptions                           │
│                                                         │
│  Backend (Supabase)                                     │
│  ├── PostgreSQL Database                               │
│  ├── Row Level Security (RLS)                          │
│  ├── Edge Functions                                    │
│  └── Real-time Engine                                  │
└─────────────────────────────────────────────────────────┘
                           ↕ HTTPS/Webhooks
┌─────────────────────────────────────────────────────────┐
│               CHIRON LAB SYSTEM                         │
│  ├── Lab Information System (LIS)                      │
│  ├── Test Processing                                   │
│  └── Results API/Webhook                               │
└─────────────────────────────────────────────────────────┘
```

---

## Prerequisites

### Required Tools

1. **Supabase CLI** (v1.50.0 or higher)
   ```bash
   npm install -g supabase
   ```

2. **Node.js** (v18 or higher)
   ```bash
   node --version  # Should be v18+
   ```

3. **Git** (for version control)

### Access Requirements

1. Supabase project with service role access
2. Chiron API credentials (will be provided by Chiron support)
3. Database admin access
4. Production deployment access

---

## Database Setup

### Step 1: Apply Database Migration

The database migration creates all necessary tables, indexes, RLS policies, and functions.

```bash
# Navigate to your project directory
cd /path/to/EHR-APP

# Link to your Supabase project (if not already linked)
supabase link --project-ref your-project-ref

# Apply the migration
supabase db push
```

Alternatively, you can run the migration file directly in the Supabase SQL editor:

1. Go to Supabase Dashboard → SQL Editor
2. Open the file: `supabase/migrations/20260107000001_create_lab_results_system.sql`
3. Click "Run"

### Step 2: Verify Database Setup

Run this SQL query to verify tables were created:

```sql
-- Check if tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'lab_results',
    'lab_orders',
    'lab_test_catalog',
    'lab_integration_logs',
    'lab_result_comments'
  );
```

You should see all 5 tables listed.

### Step 3: Enable Realtime

Verify realtime is enabled for lab_results:

```sql
-- Check realtime publications
SELECT * FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND tablename IN ('lab_results', 'lab_orders');
```

---

## Edge Function Deployment

### Step 1: Set Environment Variables (Secrets)

Set the required secrets in Supabase:

```bash
# Set Chiron API Key (you'll receive this from Chiron support)
supabase secrets set CHIRON_API_KEY=your-chiron-api-key-here

# Set Webhook Secret for HMAC verification (you'll receive this from Chiron)
supabase secrets set CHIRON_WEBHOOK_SECRET=your-webhook-secret-here

# Set IP Whitelist (Chiron will provide their server IPs)
# Format: comma-separated list of IPs
supabase secrets set CHIRON_IP_WHITELIST=192.168.1.100,203.0.113.0

# Verify secrets were set
supabase secrets list
```

### Step 2: Deploy Edge Function

```bash
# Deploy the webhook receiver function
supabase functions deploy chiron-webhook-receiver

# Get the function URL
supabase functions list
```

The webhook URL will be:
```
https://your-project-ref.supabase.co/functions/v1/chiron-webhook-receiver
```

### Step 3: Test Edge Function

Test the function is working:

```bash
# Test with curl (replace with your actual URL and API key)
curl -X POST https://your-project-ref.supabase.co/functions/v1/chiron-webhook-receiver \
  -H "Content-Type: application/json" \
  -H "x-chiron-api-key: your-api-key" \
  -d '{
    "accession_number": "TEST123",
    "patient": {
      "id_number": "8001015009087",
      "first_name": "Test",
      "surname": "Patient",
      "date_of_birth": "1980-01-01"
    },
    "test": {
      "code": "GLU",
      "name": "Glucose"
    },
    "specimen": {
      "type": "Blood",
      "collection_datetime": "2026-01-07T08:00:00Z"
    },
    "result": {
      "value": "5.5",
      "value_numeric": 5.5,
      "unit": "mmol/L",
      "flag": "N",
      "status": "final",
      "datetime": "2026-01-07T09:00:00Z"
    }
  }'
```

Expected response:
```json
{
  "success": true,
  "result_id": "uuid",
  "patient_id": "uuid",
  "accession_number": "TEST123",
  "processing_time_ms": 150
}
```

---

## Chiron Integration Configuration

### Step 1: Prepare Information for Chiron Support

Create a document with this information to send to Chiron:

```
CHIRON INTEGRATION REQUEST

System Details:
- System Name: [Your EHR System Name]
- Organization: [Your Clinic/Hospital Name]
- Integration Type: Lab Results (Inbound)

Technical Specifications:
- Webhook URL: https://your-project-ref.supabase.co/functions/v1/chiron-webhook-receiver
- Method: POST
- Content-Type: application/json
- Authentication: API Key (x-chiron-api-key header)
- Signature: HMAC SHA-256 (x-chiron-signature header)

Required Data Fields:
- Patient: ID Number, Name, DOB
- Test: Code, Name, Category, LOINC Code
- Specimen: Type, Collection DateTime
- Result: Value, Unit, Reference Range, Abnormal Flag, Status
- Personnel: Ordering Doctor, Verifying Pathologist

Abnormal Flags We Support:
- N (Normal)
- L (Low), H (High)
- LL (Very Low), HH (Very High)
- CRITICAL (Requires immediate attention)
- < (Below range), > (Above range)

Result Status Values:
- preliminary
- final
- corrected
- amended

Test Environment Required: Yes
Estimated Go-Live Date: [Your target date]
```

### Step 2: Email Template to Chiron

Use this template to contact Chiron support:

```
Subject: Lab Integration Request - [Your Organization Name]

Good day Chiron Support,

We would like to integrate our EHR system with Chiron for automated lab result delivery.

System Information:
- System Name: [Your EHR Name]
- Technology: Web-based EHR (React + PostgreSQL)
- Integration Method: REST API Webhook

Integration Requirements:

1. Webhook Configuration
   - URL: https://your-project-ref.supabase.co/functions/v1/chiron-webhook-receiver
   - Method: POST
   - Authentication: API Key in x-chiron-api-key header
   - Optional: HMAC signature in x-chiron-signature header

2. Data Requirements
   We require the following data in JSON format:
   - Complete patient demographics (ID number, name, DOB)
   - Test details (code, name, category, LOINC codes if available)
   - Specimen information (type, collection datetime)
   - Result data (value, unit, reference ranges, abnormal flags)
   - Clinical context (ordering doctor, lab comments)
   - Status tracking (preliminary, final, corrected, amended)

3. Patient Matching
   We will match patients by South African ID number.
   Please include the full 13-digit ID number in all result payloads.

4. Testing
   Could you please provide:
   - Test environment access
   - Sample result payloads
   - Test patient data
   - API documentation

5. Security
   - IP Whitelisting: Please provide your server IP addresses
   - API Key: Please generate and provide securely
   - Webhook Secret: For HMAC signature verification

Attached is our detailed integration specification document.

Timeline:
- Testing: [Date range]
- Production go-live: [Target date]

Please confirm receipt and advise on next steps.

Best regards,
[Your Name]
[Your Title]
[Contact Information]
```

---

## Frontend Integration

The frontend components are already integrated! Here's what was added:

### 1. Lab Results Tab (Patient View)

Located in: `src/components/patient/LabResultsTab.tsx`

Features:
- ✅ Real-time result updates
- ✅ Filtering by date, category, abnormal status
- ✅ Sorting and grouping options
- ✅ Trend analysis for repeated tests
- ✅ Critical value alerts
- ✅ Export to CSV
- ✅ Detailed result view with notes

Already integrated in: `src/components/patient/PatientView.tsx`

### 2. Critical Lab Alerts (Doctor Dashboard)

Located in: `src/components/dashboards/CriticalLabAlerts.tsx`

Features:
- ✅ Real-time critical result notifications
- ✅ Unacknowledged vs acknowledged separation
- ✅ One-click acknowledgment
- ✅ Age of result tracking

Already integrated in: `src/components/dashboards/DoctorDashboard.tsx`

### 3. Custom Hooks

- `useLabResults` - Fetch and manage lab results
- `useCriticalLabAlerts` - Monitor critical values
- `usePatientLabSummary` - Get patient summary
- `useLabResult` - Get single result details

### 4. Utility Functions

Located in: `src/utils/labHelpers.ts`

Provides:
- Formatting functions
- Classification functions
- Trend analysis
- Export utilities
- Validation

---

## Testing

### Phase 1: Local Database Testing

Create test data to verify the system works:

```sql
-- Insert a test lab result
INSERT INTO lab_results (
  patient_id,
  chiron_accession_number,
  test_code,
  test_name,
  test_category,
  result_value,
  result_value_numeric,
  result_unit,
  reference_range,
  reference_range_low,
  reference_range_high,
  abnormal_flag,
  result_status,
  collection_datetime,
  result_datetime,
  performing_lab,
  raw_data,
  practice_code
) VALUES (
  (SELECT id FROM patients LIMIT 1), -- Use existing patient
  'TEST-' || gen_random_uuid()::text,
  'GLU',
  'Glucose',
  'Chemistry',
  '5.5',
  5.5,
  'mmol/L',
  '3.9 - 6.1',
  3.9,
  6.1,
  'N',
  'final',
  NOW() - INTERVAL '2 hours',
  NOW() - INTERVAL '1 hour',
  'Chiron',
  '{"test": "data"}'::jsonb,
  (SELECT practice_code FROM patients LIMIT 1)
);

-- Verify it appears in the UI
SELECT * FROM lab_results ORDER BY created_at DESC LIMIT 1;
```

### Phase 2: Critical Value Testing

```sql
-- Insert a critical result
INSERT INTO lab_results (
  patient_id,
  chiron_accession_number,
  test_code,
  test_name,
  test_category,
  result_value,
  result_value_numeric,
  result_unit,
  reference_range,
  abnormal_flag,
  result_status,
  collection_datetime,
  result_datetime,
  performing_lab,
  raw_data,
  practice_code
) VALUES (
  (SELECT id FROM patients LIMIT 1),
  'CRIT-' || gen_random_uuid()::text,
  'K',
  'Potassium',
  'Chemistry',
  '6.8',
  6.8,
  'mmol/L',
  '3.5 - 5.0',
  'CRITICAL',
  'final',
  NOW(),
  NOW(),
  'Chiron',
  '{"test": "critical"}'::jsonb,
  (SELECT practice_code FROM patients LIMIT 1)
);

-- Check if it appears in critical alerts
SELECT * FROM get_critical_lab_results(NULL);
```

### Phase 3: Webhook Testing with Chiron

Once Chiron provides test environment:

1. **Ask Chiron to send test results** to your webhook URL
2. **Monitor the Edge Function logs**:
   ```bash
   supabase functions logs chiron-webhook-receiver --tail
   ```
3. **Check integration logs** for any errors:
   ```sql
   SELECT * FROM lab_integration_logs
   WHERE status = 'failure'
   ORDER BY created_at DESC;
   ```
4. **Verify results appear** in the UI immediately

### Phase 4: End-to-End Testing Checklist

- [ ] Chiron sends result → Appears in patient's lab results tab
- [ ] Critical result → Appears in doctor's critical alerts widget
- [ ] Doctor acknowledges critical → Alert marked as acknowledged
- [ ] Doctor adds note to result → Note saved and displayed
- [ ] Filter results by date → Shows correct results
- [ ] Export to CSV → Downloads correctly
- [ ] Trend analysis → Shows correct trend for repeated tests
- [ ] Real-time updates → New results appear without refresh
- [ ] Patient matching works → Correct patient assignment
- [ ] Unmatched results logged → Appears in integration logs

---

## Security Checklist

Before going to production, verify:

### Authentication & Authorization
- [ ] CHIRON_API_KEY is set and kept secret
- [ ] CHIRON_WEBHOOK_SECRET is set for HMAC verification
- [ ] IP whitelist is configured with Chiron's server IPs
- [ ] Edge Function has proper error handling
- [ ] RLS policies are enabled on all tables
- [ ] Practice isolation is working (users only see their practice's results)

### Data Privacy
- [ ] Patient data is encrypted in transit (HTTPS)
- [ ] Patient data is encrypted at rest (Supabase default)
- [ ] Access logs are enabled
- [ ] Audit trail is working (lab_integration_logs)
- [ ] POPIA compliance verified

### Error Handling
- [ ] Invalid API key returns 401
- [ ] Invalid signature returns 401
- [ ] Patient not found returns 404 (not 500)
- [ ] Invalid JSON returns 400
- [ ] All errors are logged
- [ ] No sensitive data in error messages

### Monitoring
- [ ] Edge Function logs are accessible
- [ ] Database logs are accessible
- [ ] Alerts configured for critical failures
- [ ] Dashboard for monitoring integration health

---

## Monitoring & Troubleshooting

### Monitoring Queries

**Check recent integration activity:**
```sql
SELECT
  event_type,
  severity,
  status,
  error_message,
  created_at
FROM lab_integration_logs
ORDER BY created_at DESC
LIMIT 50;
```

**Find failed integrations:**
```sql
SELECT *
FROM lab_integration_logs
WHERE status = 'failure'
  AND created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
```

**Unmatched patients:**
```sql
SELECT
  request_payload->>'patient' as patient_info,
  error_message,
  created_at
FROM lab_integration_logs
WHERE event_type = 'patient_not_matched'
ORDER BY created_at DESC;
```

**Critical results pending acknowledgment:**
```sql
SELECT
  lr.id,
  p.first_name || ' ' || p.surname as patient_name,
  lr.test_name,
  lr.result_value,
  lr.collection_datetime,
  EXTRACT(EPOCH FROM (NOW() - lr.reported_datetime))/3600 as hours_pending
FROM lab_results lr
JOIN patients p ON p.id = lr.patient_id
WHERE lr.abnormal_flag = 'CRITICAL'
  AND lr.critical_acknowledged = FALSE
ORDER BY lr.reported_datetime;
```

### Common Issues

**Issue: Results not appearing in UI**
```sql
-- Check if result was received
SELECT * FROM lab_results
ORDER BY created_at DESC LIMIT 10;

-- Check integration logs
SELECT * FROM lab_integration_logs
WHERE event_type = 'result_received'
ORDER BY created_at DESC LIMIT 10;
```

**Issue: Patient not found errors**
```sql
-- Find unmatched patients
SELECT
  request_payload->'patient'->>'id_number' as id_number,
  request_payload->'patient'->>'first_name' as first_name,
  request_payload->'patient'->>'surname' as surname,
  COUNT(*) as occurrences
FROM lab_integration_logs
WHERE event_type = 'patient_not_matched'
GROUP BY 1, 2, 3
ORDER BY occurrences DESC;

-- Check if patient exists with different ID number format
SELECT id, first_name, surname, id_number
FROM patients
WHERE first_name ILIKE '%searchterm%'
   OR surname ILIKE '%searchterm%';
```

**Issue: Webhook authentication failures**
```sql
SELECT
  error_code,
  error_message,
  ip_address,
  COUNT(*) as count
FROM lab_integration_logs
WHERE status = 'failure'
  AND error_code IN ('INVALID_API_KEY', 'INVALID_SIGNATURE', 'IP_NOT_WHITELISTED')
GROUP BY error_code, error_message, ip_address
ORDER BY count DESC;
```

### Edge Function Logs

View real-time logs:
```bash
supabase functions logs chiron-webhook-receiver --tail
```

Search logs:
```bash
supabase functions logs chiron-webhook-receiver | grep "ERROR"
```

---

## Next Steps

### Immediate (Week 1)

1. **Apply database migration** ✓
2. **Deploy Edge Function** ✓
3. **Send email to Chiron support** (use template above)
4. **Test with sample data** in your database

### Short Term (Weeks 2-3)

1. **Receive Chiron credentials** and configure
2. **Test in Chiron's staging environment**
3. **Verify patient matching** logic
4. **Train doctors** on using lab results features
5. **Create user documentation**

### Before Production Go-Live

1. **Security audit** - Review all security settings
2. **Load testing** - Test with high volume of results
3. **Backup strategy** - Verify database backups
4. **Rollback plan** - Document how to disable if needed
5. **Support plan** - Who to contact for issues

### Post Go-Live

1. **Monitor daily** for first week
2. **Review integration logs** regularly
3. **Gather doctor feedback**
4. **Optimize performance** based on usage patterns
5. **Plan Phase 2** - Sending orders to Chiron (optional)

---

## Support & Resources

### Documentation Files

- Database Schema: `supabase/migrations/20260107000001_create_lab_results_system.sql`
- Edge Function: `supabase/functions/chiron-webhook-receiver/index.ts`
- Edge Function README: `supabase/functions/chiron-webhook-receiver/README.md`
- TypeScript Types: `src/types/lab.ts`
- Utility Functions: `src/utils/labHelpers.ts`

### Key Components

- Patient Lab Results: `src/components/patient/LabResultsTab.tsx`
- Critical Alerts Widget: `src/components/dashboards/CriticalLabAlerts.tsx`
- Lab Results Hook: `src/hooks/useLabResults.ts`
- Critical Alerts Hook: `src/hooks/useCriticalLabAlerts.ts`

### Useful Commands

```bash
# View Edge Function logs
supabase functions logs chiron-webhook-receiver

# Deploy updated Edge Function
supabase functions deploy chiron-webhook-receiver

# Run database migrations
supabase db push

# Generate TypeScript types from database
npm run generate:types

# Start development server
npm run dev
```

---

## Appendix: Sample Chiron Result Payload

Expected JSON structure from Chiron:

```json
{
  "accession_number": "LAB2026010712345",
  "order_id": "ORD789456",
  "result_id": "RES123456",
  "patient": {
    "id_number": "8001015009087",
    "first_name": "John",
    "surname": "Doe",
    "date_of_birth": "1980-01-01"
  },
  "test": {
    "code": "CBC",
    "name": "Complete Blood Count",
    "category": "Hematology",
    "loinc_code": "58410-2"
  },
  "specimen": {
    "type": "Blood",
    "id": "SPEC12345",
    "collection_datetime": "2026-01-07T08:30:00Z",
    "received_datetime": "2026-01-07T09:00:00Z"
  },
  "result": {
    "value": "8.5",
    "value_numeric": 8.5,
    "unit": "10^9/L",
    "data_type": "numeric",
    "reference_range": "4.0 - 11.0",
    "reference_range_low": 4.0,
    "reference_range_high": 11.0,
    "flag": "N",
    "status": "final",
    "datetime": "2026-01-07T10:00:00Z",
    "verified_datetime": "2026-01-07T10:15:00Z"
  },
  "clinical": {
    "comment": "Normal findings. No action required.",
    "interpretation_codes": ["SNOMED:123456"]
  },
  "personnel": {
    "ordering_doctor": "Dr. Smith",
    "performing_technician": "Tech A. Johnson",
    "verifying_pathologist": "Dr. P. Jones"
  },
  "metadata": {
    "lab_site": "Chiron Central Lab",
    "instrument_id": "INST001"
  }
}
```

---

## Questions?

If you encounter any issues during setup, check:

1. **Database logs** - For SQL errors
2. **Edge Function logs** - For integration errors
3. **Integration logs table** - For detailed error messages
4. **Browser console** - For frontend errors

Need help? Review the implementation files or contact your development team.

Good luck with your lab integration! 🎉

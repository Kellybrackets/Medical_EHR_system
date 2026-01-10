# Chiron Webhook Receiver Edge Function

This Supabase Edge Function receives lab results from Chiron's webhook and stores them securely in the database.

## Security Features

- **API Key Authentication**: Validates `x-chiron-api-key` header
- **HMAC Signature Verification**: Ensures request authenticity using SHA-256
- **IP Whitelisting**: Restricts access to known Chiron server IPs
- **Comprehensive Audit Logging**: All requests logged to `lab_integration_logs`
- **Request Validation**: Validates payload structure before processing

## Deployment

### 1. Install Supabase CLI

```bash
npm install -g supabase
```

### 2. Link to your project

```bash
supabase link --project-ref your-project-ref
```

### 3. Set environment variables (secrets)

```bash
# Set Chiron API key
supabase secrets set CHIRON_API_KEY=your-api-key-from-chiron

# Set webhook secret for HMAC verification
supabase secrets set CHIRON_WEBHOOK_SECRET=your-webhook-secret

# Set IP whitelist (comma-separated)
supabase secrets set CHIRON_IP_WHITELIST=192.168.1.100,203.0.113.0
```

### 4. Deploy the function

```bash
supabase functions deploy chiron-webhook-receiver
```

### 5. Get the function URL

```bash
supabase functions list
```

The webhook URL will be:
```
https://your-project.supabase.co/functions/v1/chiron-webhook-receiver
```

## Configuration with Chiron

Provide Chiron support with:

1. **Webhook URL**: `https://your-project.supabase.co/functions/v1/chiron-webhook-receiver`
2. **API Key**: The value you set in `CHIRON_API_KEY`
3. **Webhook Secret**: The value you set in `CHIRON_WEBHOOK_SECRET` (for HMAC signing)

Request that Chiron:
- Sends `x-chiron-api-key` header with each request
- Signs payloads with HMAC-SHA256 and sends signature in `x-chiron-signature` header
- Uses POST method with JSON payload

## Request Format

Chiron should send POST requests with this structure:

```json
{
  "accession_number": "LAB123456",
  "order_id": "ORD789",
  "result_id": "RES001",
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
    "id": "SPEC123",
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
    "comment": "Normal findings",
    "interpretation_codes": ["SNOMED123"]
  },
  "personnel": {
    "ordering_doctor": "Dr. Smith",
    "performing_technician": "Tech A",
    "verifying_pathologist": "Dr. Jones"
  }
}
```

### Abnormal Flags

- `N` - Normal
- `L` - Low
- `H` - High
- `LL` - Very Low
- `HH` - Very High
- `CRITICAL` - Critical value (triggers alert)
- `<` - Below measurable range
- `>` - Above measurable range
- `A` - Abnormal
- `AA` - Very Abnormal

## Response Format

### Success Response (200)

```json
{
  "success": true,
  "result_id": "uuid-of-stored-result",
  "patient_id": "uuid-of-patient",
  "accession_number": "LAB123456",
  "processing_time_ms": 150
}
```

### Error Responses

**401 Unauthorized** - Invalid API key
```json
{
  "error": "Unauthorized"
}
```

**403 Forbidden** - IP not whitelisted
```json
{
  "error": "Forbidden"
}
```

**404 Not Found** - Patient not found
```json
{
  "error": "Patient not found",
  "accession_number": "LAB123456",
  "patient_id_number": "8001015009087"
}
```

**400 Bad Request** - Validation error
```json
{
  "error": "Validation failed",
  "details": ["Missing accession_number", "Missing test information"]
}
```

**500 Internal Server Error**
```json
{
  "error": "Internal server error",
  "request_id": "uuid-for-troubleshooting"
}
```

## Monitoring

### View Logs

```bash
supabase functions logs chiron-webhook-receiver
```

### View Integration Logs in Database

```sql
SELECT *
FROM lab_integration_logs
WHERE event_type = 'result_received'
ORDER BY created_at DESC
LIMIT 100;
```

### Check for Errors

```sql
SELECT *
FROM lab_integration_logs
WHERE status = 'failure'
  AND severity IN ('error', 'critical')
ORDER BY created_at DESC;
```

### Unmatched Patients

```sql
SELECT *
FROM lab_integration_logs
WHERE event_type = 'patient_not_matched'
ORDER BY created_at DESC;
```

## Testing

### Test with curl

```bash
curl -X POST https://your-project.supabase.co/functions/v1/chiron-webhook-receiver \
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

## Troubleshooting

### Enable Debug Logging

The function logs all events to console. View them with:

```bash
supabase functions logs chiron-webhook-receiver --tail
```

### Common Issues

1. **401 Unauthorized**: Check API key matches in both Chiron and Supabase secrets
2. **403 Forbidden**: Verify Chiron's IP is in whitelist
3. **404 Patient Not Found**: Patient's ID number doesn't match database
4. **500 Internal Error**: Check function logs for stack trace

## Security Best Practices

1. **Rotate API Keys**: Change `CHIRON_API_KEY` periodically
2. **Use IP Whitelist**: Always configure `CHIRON_IP_WHITELIST` in production
3. **Enable HMAC**: Request Chiron to implement HMAC signing
4. **Monitor Logs**: Set up alerts for failed authentication attempts
5. **Review Audit Trail**: Regularly check `lab_integration_logs` for anomalies

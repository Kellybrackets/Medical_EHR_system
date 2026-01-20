# Chiron Laboratory System Integration
## Technical Requirements Specification

**Document Version:** 1.0
**Date:** January 20, 2026
**Prepared For:** Chiron Laboratory Services
**Prepared By:** EHR Development Team
**System:** Electronic Health Records (EHR) Management Platform

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Overview](#system-overview)
3. [Current EHR Architecture](#current-ehr-architecture)
4. [Integration Objectives](#integration-objectives)
5. [Technical Stack](#technical-stack)
6. [Integration Architecture](#integration-architecture)
7. [API Requirements from Chiron](#api-requirements-from-chiron)
8. [Data Specifications](#data-specifications)
9. [Security Requirements](#security-requirements)
10. [Infrastructure Requirements](#infrastructure-requirements)
11. [What We Need from Chiron](#what-we-need-from-chiron)
12. [Implementation Phases](#implementation-phases)
13. [Testing Requirements](#testing-requirements)
14. [Support and Maintenance](#support-and-maintenance)
15. [Appendices](#appendices)

---

## 1. Executive Summary

This document outlines the technical requirements for integrating Chiron Laboratory Services with our Electronic Health Records (EHR) platform. The integration aims to automate the flow of laboratory test orders and results between our healthcare facilities and Chiron's laboratory information system.

### Key Integration Points
- **Inbound:** Automated receipt of lab results via webhooks
- **Outbound (Phase 2):** Electronic submission of lab orders
- **Real-time:** Live notifications for critical lab values
- **Audit:** Complete tracking of all integration events

### Expected Outcomes
- Elimination of manual data entry for lab results
- Real-time critical value alerts to physicians
- Comprehensive patient lab history accessible within EHR
- Reduced turnaround time for result availability
- Complete audit trail for compliance and troubleshooting

---

## 2. System Overview

### 2.1 EHR Platform Description

Our EHR platform serves multiple medical practices across South Africa, managing patient records, consultations, prescriptions, and laboratory results. The system is designed with multi-tenancy architecture, providing practice-level data isolation and role-based access control.

### 2.2 User Base
- **Practices:** Multiple independent medical practices
- **Users:** Doctors, receptionists, administrative staff
- **Patients:** 25+ active patients with growing user base
- **Daily Transactions:** Patient registrations, consultations, lab orders

### 2.3 Compliance Requirements
- POPIA (Protection of Personal Information Act) - South Africa
- HIPAA-equivalent standards for healthcare data
- Medical record retention requirements
- Audit trail for all patient data access

---

## 3. Current EHR Architecture

### 3.1 Technology Stack

#### Frontend
- **Framework:** React 18.3.1 with TypeScript 5.5.3
- **Build Tool:** Vite 5.4.2
- **UI Framework:** TailwindCSS 3.4.1
- **State Management:** React Hooks + Context API
- **Real-time Updates:** Supabase Realtime (WebSocket-based)
- **Routing:** React Router DOM 7.11.0
- **Form Validation:** React Hook Form 7.69.0 + Zod 4.2.1
- **Charts:** Recharts 3.6.0

#### Backend
- **Database:** PostgreSQL 17.4.1 (Supabase-hosted)
- **BaaS Platform:** Supabase
- **Authentication:** Supabase Auth (JWT-based)
- **Edge Functions:** Deno runtime (Supabase Edge Functions)
- **Real-time Engine:** Supabase Realtime subscriptions

#### DevOps & Infrastructure
- **Frontend Hosting:** Vercel (Singapore region: ap-southeast-1)
- **Database Hosting:** Supabase (Singapore region)
- **CI/CD:** GitHub Actions
- **Error Monitoring:** Sentry (production)
- **Version Control:** GitHub

### 3.2 Security Architecture

```
Authentication Layer (Supabase Auth)
    ↓
Authorization Layer (Row Level Security Policies)
    ↓
Practice Isolation Layer (practice_code filtering)
    ↓
Role-Based Access Control (admin/doctor/receptionist)
    ↓
Data Access
```

**Key Security Features:**
- JWT token-based authentication
- Row-level security (RLS) on all database tables
- Practice-level data isolation
- HTTPS/TLS encryption for all communication
- IP whitelisting capability for external integrations
- API key authentication for webhooks
- HMAC signature verification support

### 3.3 Current Lab System Implementation

We have already implemented the complete database schema and infrastructure for lab results management:

#### Database Tables (Production-Ready)
1. **lab_test_catalog** - Available tests from Chiron
2. **lab_orders** - Lab orders to be sent to Chiron (Phase 2)
3. **lab_results** - Lab results received from Chiron
4. **lab_integration_logs** - Complete audit trail
5. **lab_result_comments** - Clinician annotations

#### Implemented Features
- Webhook receiver (Deno Edge Function)
- Patient matching by ID number
- Critical value detection and alerting
- Real-time result notifications
- Result viewing and acknowledgment tracking
- Complete audit logging

**Sample Mock Data:** We have successfully loaded mock lab results for testing purposes, including:
- Complete Blood Count (CBC)
- Lipid Panel
- Kidney Function Tests
- Liver Function Tests
- Glucose monitoring
- HbA1c
- HIV serology

---

## 4. Integration Objectives

### 4.1 Phase 1: Inbound Results (Immediate Priority)
**Goal:** Automate receipt of lab results from Chiron into our EHR

**Functional Requirements:**
- Receive lab results via HTTPS webhook
- Match results to patients using South African ID number (13 digits)
- Store results with complete metadata (test name, values, reference ranges, flags)
- Trigger real-time notifications for critical values
- Support multiple test results per specimen/accession number
- Handle result amendments and corrections

**Non-Functional Requirements:**
- 99.9% uptime for webhook endpoint
- Process results within 30 seconds of receipt
- Support peak load of 100 results per hour
- Maintain complete audit trail

### 4.2 Phase 2: Outbound Orders (Future)
**Goal:** Submit lab orders electronically from EHR to Chiron

**Functional Requirements:**
- Submit lab orders with patient demographics
- Include clinical notes and diagnosis codes
- Support urgent/stat order priority
- Receive order acknowledgment from Chiron
- Track order status (pending → sent → acknowledged → in progress → completed)

### 4.3 Phase 3: Catalog Synchronization (Optional)
**Goal:** Maintain up-to-date test catalog

**Functional Requirements:**
- Download available tests from Chiron
- Update reference ranges and pricing
- Mark deprecated tests as inactive

---

## 5. Technical Stack

### 5.1 Integration Components

```
┌─────────────────────────────────────────┐
│          Chiron Lab System              │
└─────────────────┬───────────────────────┘
                  │
                  │ HTTPS Webhook (POST)
                  │
                  ▼
┌─────────────────────────────────────────┐
│   Supabase Edge Function                │
│   (chiron-webhook-receiver)             │
│   - Authentication validation           │
│   - Patient matching                    │
│   - Data transformation                 │
│   - Audit logging                       │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│   PostgreSQL Database (Supabase)        │
│   - lab_results table                   │
│   - lab_integration_logs table          │
└─────────────────┬───────────────────────┘
                  │
                  │ Realtime Subscription
                  │ (WebSocket)
                  ▼
┌─────────────────────────────────────────┐
│   React Frontend (Vercel)               │
│   - Doctor Dashboard                    │
│   - Patient View                        │
│   - Critical Alerts Widget              │
└─────────────────────────────────────────┘
```

### 5.2 Data Flow

**Result Receipt Flow:**
```
1. Chiron generates lab result
2. Chiron POSTs webhook to our endpoint:
   https://rgkwmmjnjwsvxmbirerc.supabase.co/functions/v1/chiron-webhook-receiver
3. Edge function validates authentication (API key + signature)
4. Edge function matches patient by ID number
5. Edge function inserts result into lab_results table
6. Edge function logs event to lab_integration_logs
7. PostgreSQL trigger updates lab_orders.results_count (if linked)
8. Realtime subscription broadcasts new result to frontend
9. Doctor's dashboard shows new result instantly
10. If critical value: alert shown prominently
```

**Order Submission Flow (Phase 2):**
```
1. Doctor creates order in EHR
2. Order saved to lab_orders table with status='pending'
3. Background job (or manual trigger) sends order to Chiron API
4. Chiron returns order acknowledgment with chiron_order_id
5. Update lab_orders.status = 'acknowledged'
6. Track order progress via status updates
```

---

## 6. API Requirements from Chiron

### 6.1 Webhook for Lab Results (Phase 1 - Critical)

**Endpoint Required:** None from Chiron (we provide the endpoint)

**What We Provide:**
- **URL:** `https://rgkwmmjnjwsvxmbirerc.supabase.co/functions/v1/chiron-webhook-receiver`
- **Method:** POST
- **Authentication:** API Key in header + optional HMAC signature
- **IP Whitelist:** We can whitelist Chiron's IP addresses for additional security

**Webhook Payload Specification (JSON):**

```json
{
  "event_type": "result_available",
  "timestamp": "2026-01-20T14:30:00Z",
  "accession_number": "ACC-2026012001234",
  "order_id": "CHR-ORD-2026-12345",
  "result_id": "CHR-RES-2026-67890",

  "patient": {
    "id_number": "9902240289086",
    "first_name": "Lesedi",
    "surname": "Matlala",
    "date_of_birth": "1999-02-24"
  },

  "test": {
    "code": "HGB",
    "name": "Hemoglobin",
    "category": "Hematology",
    "loinc_code": "718-7",
    "snomed_code": "259695003"
  },

  "specimen": {
    "type": "Blood",
    "id": "SPEC-2026-12345",
    "collection_datetime": "2026-01-20T08:00:00Z",
    "received_datetime": "2026-01-20T09:30:00Z"
  },

  "result": {
    "value": "14.2",
    "value_numeric": 14.2,
    "unit": "g/dL",
    "data_type": "numeric",
    "reference_range": "12.0-16.0 g/dL",
    "reference_range_low": 12.0,
    "reference_range_high": 16.0,
    "flag": "N",
    "status": "final",
    "datetime": "2026-01-20T12:00:00Z",
    "verified_datetime": "2026-01-20T13:00:00Z"
  },

  "clinical": {
    "comment": "Sample comment from pathologist (optional)",
    "interpretation_codes": ["SNOMED:123456"]
  },

  "personnel": {
    "ordering_doctor": "Dr. Tsenolo P Matiya",
    "performing_technician": "Tech Name",
    "verifying_pathologist": "Dr. Pathologist Name"
  }
}
```

**Result Flag Values:**
- `N` = Normal
- `L` = Low
- `H` = High
- `LL` = Very Low (critically low)
- `HH` = Very High (critically high)
- `CRITICAL` = Critical value requiring immediate physician notification
- `<` = Below measurable range
- `>` = Above measurable range
- `A` = Abnormal
- `AA` = Very abnormal

**Result Status Values:**
- `preliminary` = Initial result, may be updated
- `final` = Final verified result
- `corrected` = Previously final result has been corrected
- `amended` = Result has been amended with additional information
- `cancelled` = Result cancelled/withdrawn
- `entered_in_error` = Result was entered in error

**Result Data Types:**
- `numeric` = Quantitative result (with value_numeric populated)
- `text` = Text/qualitative result
- `coded` = Coded result (e.g., Positive/Negative)
- `ratio` = Ratio result (e.g., 1:64)
- `attachment` = Reference to attached document (PDF report)

**Expected HTTP Response Codes:**
- `200 OK` = Result successfully received and processed
- `201 Created` = Result created in database
- `400 Bad Request` = Invalid payload format
- `401 Unauthorized` = Invalid API key
- `403 Forbidden` = Signature verification failed
- `404 Not Found` = Patient not found in our system
- `422 Unprocessable Entity` = Valid format but business logic error (e.g., duplicate result_id)
- `500 Internal Server Error` = Server error on our side

**Response Payload (Success):**
```json
{
  "status": "success",
  "message": "Lab result processed successfully",
  "result_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "patient_matched": true,
  "processed_at": "2026-01-20T14:30:15Z"
}
```

**Response Payload (Patient Not Found):**
```json
{
  "status": "error",
  "error_code": "PATIENT_NOT_FOUND",
  "message": "Patient with ID 9902240289086 not found in EHR system",
  "id_number": "9902240289086",
  "recommendation": "Please verify patient registration or contact EHR support"
}
```

### 6.2 Order Submission API (Phase 2)

**Endpoint Needed from Chiron:**
- **URL:** `https://api.chiron.co.za/v1/orders` (example)
- **Method:** POST
- **Authentication:** API Key + Bearer token (or mutual TLS)
- **Content-Type:** application/json

**Order Payload We Will Send:**

```json
{
  "order_number": "EHR-ORD-2026-00123",
  "order_datetime": "2026-01-20T14:30:00Z",
  "priority": "routine",

  "patient": {
    "id_number": "9902240289086",
    "id_type": "south_african_id",
    "first_name": "Lesedi",
    "surname": "Matlala",
    "date_of_birth": "1999-02-24",
    "sex": "Female",
    "contact_number": "+27821234567",
    "email": "lesedi@example.com"
  },

  "ordering_provider": {
    "name": "Dr. Tsenolo P Matiya",
    "practice_number": "MP123456",
    "contact": "+27823456789",
    "email": "doctor@practice.com"
  },

  "practice": {
    "name": "City General Clinic",
    "code": "CG010",
    "address": "123 Main Street, Johannesburg",
    "contact": "+27114567890"
  },

  "tests": [
    {
      "code": "HGB",
      "name": "Hemoglobin",
      "urgent": false,
      "fasting_required": false
    },
    {
      "code": "CHOL",
      "name": "Total Cholesterol",
      "urgent": false,
      "fasting_required": true
    }
  ],

  "clinical": {
    "notes": "Patient complains of fatigue. Follow-up for previous abnormal cholesterol.",
    "diagnosis_codes": ["R53.83", "E78.0"],
    "fasting_status": "fasting"
  },

  "collection": {
    "datetime": "2026-01-20T08:00:00Z",
    "location": "City General Clinic",
    "collected_by": "Nurse Sarah"
  }
}
```

**Expected Response from Chiron:**
```json
{
  "status": "acknowledged",
  "chiron_order_id": "CHR-ORD-2026-12345",
  "accession_numbers": [
    {
      "test_code": "HGB",
      "accession_number": "ACC-2026012001234"
    },
    {
      "test_code": "CHOL",
      "accession_number": "ACC-2026012001235"
    }
  ],
  "expected_results_by": "2026-01-21T17:00:00Z",
  "collection_required": false,
  "special_instructions": "Patient must fast for 12 hours before blood draw"
}
```

### 6.3 Test Catalog API (Phase 3 - Optional)

**Endpoint Needed from Chiron:**
- **URL:** `https://api.chiron.co.za/v1/catalog/tests`
- **Method:** GET
- **Authentication:** API Key
- **Query Parameters:**
  - `category` (optional): Filter by test category
  - `active_only` (optional): Return only active tests (default: true)

**Expected Response:**
```json
{
  "tests": [
    {
      "code": "HGB",
      "name": "Hemoglobin",
      "category": "Hematology",
      "subcategory": "Complete Blood Count",
      "loinc_code": "718-7",
      "snomed_code": "259695003",
      "specimen_type": "Blood",
      "specimen_volume": "2-5 mL",
      "container_type": "EDTA tube (purple top)",
      "turnaround_time": "Same day",
      "requires_fasting": false,
      "patient_preparation": "No special preparation required",
      "reference_range_template": "12.0-16.0 g/dL (adult female)",
      "price": 85.00,
      "is_active": true,
      "is_urgent_available": true
    }
  ],
  "total_count": 250,
  "page": 1,
  "page_size": 50
}
```

### 6.4 Order Status Query API (Phase 2 - Optional)

**Endpoint Needed from Chiron:**
- **URL:** `https://api.chiron.co.za/v1/orders/{chiron_order_id}/status`
- **Method:** GET
- **Authentication:** API Key

**Expected Response:**
```json
{
  "chiron_order_id": "CHR-ORD-2026-12345",
  "status": "in_progress",
  "status_history": [
    {
      "status": "received",
      "timestamp": "2026-01-20T14:35:00Z"
    },
    {
      "status": "acknowledged",
      "timestamp": "2026-01-20T14:36:00Z"
    },
    {
      "status": "in_progress",
      "timestamp": "2026-01-20T15:00:00Z"
    }
  ],
  "results_available": 1,
  "results_pending": 1,
  "expected_completion": "2026-01-21T17:00:00Z"
}
```

---

## 7. Data Specifications

### 7.1 Patient Identification

**Primary Identifier:** South African ID Number (13 digits)
- Format: `YYMMDDGSSSCAZ`
- Example: `9902240289086`
- Validation: Must be exactly 13 digits

**Alternative Identifier (if ID not available):**
- Passport Number (for foreign nationals)
- Format: Alphanumeric, 6-15 characters
- Example: `A12345678`

**Patient Matching Logic:**
1. First attempt: Exact match on `id_number`
2. If no match: Log to `lab_integration_logs` as `patient_not_matched`
3. Manual intervention: Admin can link unmatched results to correct patient

### 7.2 Date/Time Format

**Standard:** ISO 8601 format with timezone
- Example: `2026-01-20T14:30:00Z` (UTC)
- Example: `2026-01-20T16:30:00+02:00` (South African time)

**Preferred:** UTC timestamps (we convert to local time in frontend)

### 7.3 Numeric Values

**Format:** Decimal numbers
- Use `.` (period) as decimal separator
- Example: `14.2` not `14,2`
- Precision: Up to 4 decimal places supported
- Range: -999999.9999 to 999999.9999

**Units:** Standard medical units
- Use standard abbreviations: g/dL, mmol/L, U/L, mIU/L, etc.
- Consistency is critical for trend analysis

### 7.4 Test Categories

We support the following test categories:
- Hematology
- Chemistry
- Microbiology
- Immunology
- Serology
- Toxicology
- Molecular
- Pathology
- Hormones
- Tumor Markers
- Cardiac Markers
- Urinalysis
- Coagulation

**Note:** If Chiron uses different category names, we can map them.

### 7.5 Specimen Types

Supported specimen types:
- Blood
- Serum
- Plasma
- Urine
- Swab
- Stool
- Cerebrospinal Fluid (CSF)
- Tissue
- Saliva
- Sputum

### 7.6 Character Encoding

**Standard:** UTF-8
- Supports South African characters and multilingual content
- All API requests and responses must use UTF-8 encoding

---

## 8. Security Requirements

### 8.1 Authentication Methods

We support the following authentication methods for webhook and API calls:

#### Option 1: API Key (Minimum Requirement)
- Chiron includes API key in HTTP header
- Header name: `X-Chiron-API-Key`
- We will provide Chiron with a unique API key
- Key rotation: Every 90 days (or on-demand if compromised)

**Example Request:**
```http
POST /functions/v1/chiron-webhook-receiver HTTP/1.1
Host: rgkwmmjnjwsvxmbirerc.supabase.co
Content-Type: application/json
X-Chiron-API-Key: sk_live_abc123xyz789_chiron_secret_key

{payload}
```

#### Option 2: HMAC Signature (Recommended)
- Additional security layer on top of API key
- Chiron signs payload with shared secret using HMAC-SHA256
- Signature included in `X-Chiron-Signature` header
- We verify signature matches payload

**Signature Generation (Chiron side):**
```javascript
const crypto = require('crypto');
const payload = JSON.stringify(body);
const signature = crypto
  .createHmac('sha256', SHARED_SECRET)
  .update(payload)
  .digest('hex');
```

**Example Request with Signature:**
```http
POST /functions/v1/chiron-webhook-receiver HTTP/1.1
Host: rgkwmmjnjwsvxmbirerc.supabase.co
Content-Type: application/json
X-Chiron-API-Key: sk_live_abc123xyz789_chiron_secret_key
X-Chiron-Signature: sha256=2f8d9a7b3c1e5f6a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a

{payload}
```

#### Option 3: Mutual TLS (Optional)
- Client certificate authentication
- Chiron provides client certificate
- We validate certificate against trusted CA
- Most secure but requires more setup

### 8.2 IP Whitelisting

We can restrict webhook endpoint to only accept requests from Chiron's IP addresses.

**What We Need from Chiron:**
- List of static IP addresses used for webhook delivery
- Notification of any IP address changes (30 days advance notice)

**Example IP Whitelist:**
```
41.185.29.123
197.242.150.45
196.216.191.100
```

### 8.3 Transport Security

**Requirements:**
- All communication must use HTTPS/TLS 1.2 or higher
- Valid SSL/TLS certificates (no self-signed certificates)
- Strong cipher suites only (no weak or deprecated ciphers)

### 8.4 Data Protection

**In Transit:**
- HTTPS/TLS encryption for all data transmission
- API keys and secrets never transmitted in URL parameters

**At Rest:**
- All data encrypted in PostgreSQL database
- Backup encryption enabled
- Sensitive fields (if any) additionally encrypted

**Retention:**
- Lab results retained indefinitely (medical record retention requirements)
- Integration logs retained for 12 months
- Personal data anonymized after patient deletion request (POPIA compliance)

### 8.5 Access Control

**Webhook Endpoint:**
- Only Chiron should have access to webhook URL
- URL should be kept confidential (treat as secret)
- No public documentation of webhook URL

**API Keys:**
- Generated using cryptographically secure random number generator
- Minimum 32 characters length
- Stored securely in environment variables (not in code)
- Rotated every 90 days

**Audit Trail:**
- All webhook requests logged to `lab_integration_logs`
- Failed authentication attempts logged with IP address
- Successful processing logged with metadata

---

## 9. Infrastructure Requirements

### 9.1 Webhook Endpoint Specifications

**Our Webhook URL:**
```
https://rgkwmmjnjwsvxmbirerc.supabase.co/functions/v1/chiron-webhook-receiver
```

**Availability:** 99.9% uptime SLA
- Hosted on Supabase Edge Functions (globally distributed)
- Automatic scaling to handle traffic spikes
- Regional deployment: Singapore (ap-southeast-1)

**Performance:**
- Response time: < 2 seconds (P95)
- Timeout: 30 seconds maximum
- Concurrent requests: Up to 100 simultaneous webhooks

**Rate Limiting:**
- No strict rate limit (reasonable use expected)
- If needed, can handle bursts of 100 requests/minute

### 9.2 Retry and Error Handling

**Our Behavior:**
- If we return 5xx error, Chiron should retry
- If we return 4xx error, Chiron should NOT retry (permanent error)

**Recommended Retry Logic (for Chiron):**
- Retry up to 3 times on 5xx or timeout errors
- Exponential backoff: 1 minute, 5 minutes, 15 minutes
- After 3 failures, escalate to manual intervention
- Email notification to both teams if delivery fails

**Idempotency:**
- Our system handles duplicate webhooks gracefully
- Results are identified by unique `result_id`
- Duplicate `result_id` returns 200 OK (idempotent operation)

### 9.3 Monitoring and Alerts

**Our Monitoring:**
- 24/7 uptime monitoring (via Sentry)
- Alert on failed webhook processing
- Dashboard showing integration health metrics

**What We Need from Chiron:**
- Notification of scheduled maintenance (24 hours advance notice)
- Incident notifications if webhook delivery fails repeatedly
- Contact information for emergency escalation

### 9.4 Network Requirements

**Firewall Rules:**
- Our webhook endpoint is publicly accessible via HTTPS
- No special firewall rules required from Chiron's side
- We can whitelist Chiron IP addresses if needed

**DNS:**
- Hostname: `rgkwmmjnjwsvxmbirerc.supabase.co`
- TLS Certificate: Valid Let's Encrypt certificate (auto-renewed)
- IPv4: Yes
- IPv6: Not required but supported

---

## 10. What We Need from Chiron

### 10.1 Documentation

Please provide:

1. **Webhook Integration Guide**
   - Complete webhook payload specification
   - All possible field values and formats
   - Example payloads for different scenarios (normal result, critical result, amended result, etc.)
   - Error scenarios and expected behavior

2. **API Documentation** (for Phase 2)
   - RESTful API endpoints for order submission
   - Authentication methods
   - Request/response schemas
   - Error codes and messages
   - Rate limits and quotas

3. **Test Catalog**
   - Complete list of available test codes
   - Test names and descriptions
   - Reference ranges (by age/sex if applicable)
   - Specimen requirements
   - Turnaround times
   - Pricing (if available)

4. **Standard Codes**
   - LOINC codes for each test (if available)
   - SNOMED codes for results and interpretations
   - Mapping between Chiron codes and international standards

### 10.2 Test Environment

Please provide:

1. **Sandbox/Staging Environment**
   - Sandbox URL for testing webhook delivery
   - Sandbox API endpoints (for Phase 2)
   - Test API keys (separate from production)
   - Sample test data we can use

2. **Test Patients**
   - Sample patient ID numbers we can use for testing
   - Test scenarios (normal results, abnormal, critical, amended, etc.)
   - Expected webhook payloads for each scenario

3. **Testing Credentials**
   - Test API keys
   - Test HMAC secrets (if using signature verification)
   - Test environment IP addresses (if different from production)

### 10.3 Production Credentials

Once testing is complete, please provide:

1. **Production API Keys**
   - Unique API key for our production environment
   - HMAC shared secret (if using signature verification)
   - Key rotation schedule and process

2. **IP Addresses**
   - Static IP addresses used for webhook delivery (for whitelisting)
   - Notification process if IPs change

3. **Support Contacts**
   - Technical contact for integration issues
   - Emergency contact (24/7) for critical issues
   - Email/phone for escalations

### 10.4 Onboarding Information

1. **Practice Registration**
   - Process to register our practices with Chiron
   - Practice codes/identifiers assigned by Chiron
   - Billing arrangements

2. **Provider Registration**
   - Process to register our doctors with Chiron
   - Provider numbers/identifiers
   - Authorization for electronic ordering

3. **Patient Registration Requirements**
   - What patient information must be provided
   - How to handle patients without ID numbers (foreign nationals)
   - Patient consent requirements (if any)

### 10.5 Service Level Agreement (SLA)

Please confirm:

1. **Availability**
   - Uptime guarantee for webhook delivery
   - Uptime guarantee for API endpoints (Phase 2)
   - Scheduled maintenance windows

2. **Performance**
   - Expected webhook delivery time after result finalization
   - Expected API response times
   - Peak load capacity

3. **Support**
   - Support hours (business hours vs 24/7)
   - Response time for critical issues
   - Response time for non-critical issues
   - Escalation procedures

---

## 11. Implementation Phases

### Phase 1: Inbound Results Integration (8 weeks)

**Week 1-2: Planning and Design**
- Kickoff meeting with Chiron team
- Review webhook payload specification
- Finalize data mapping
- Set up test environment access

**Week 3-4: Development and Testing**
- Implement webhook receiver (already done, need Chiron specs to adjust)
- Set up authentication (API key + signature)
- Implement patient matching logic
- Develop error handling and retry logic
- Create integration logs dashboard

**Week 5-6: Integration Testing**
- Test webhook delivery in sandbox environment
- Test all result scenarios (normal, abnormal, critical, amended)
- Test error scenarios (patient not found, invalid payload, etc.)
- Performance testing (load testing)
- Security testing (authentication, authorization)

**Week 7: User Acceptance Testing (UAT)**
- Train doctors on viewing lab results
- Test critical value alerting
- Test result acknowledgment workflow
- Gather feedback from users

**Week 8: Production Deployment**
- Deploy to production
- Monitor webhook delivery for first 48 hours
- Go-live with 1-2 pilot practices
- Gradual rollout to all practices

### Phase 2: Outbound Order Submission (12 weeks)

**Prerequisites:** Phase 1 must be stable for 4 weeks

**Week 1-2: Requirements Gathering**
- Gather doctor feedback on order workflow
- Define order form UI/UX
- Document test selection process
- Review Chiron order submission API

**Week 3-6: Development**
- Implement order creation UI
- Develop order submission API integration
- Implement order status tracking
- Create order management dashboard

**Week 7-9: Testing**
- Test order submission in sandbox
- Test order acknowledgment flow
- Test order status updates
- Integration testing with Phase 1 (orders → results)

**Week 10-11: UAT and Training**
- Train doctors on creating orders electronically
- Test end-to-end workflow (order → submit → result)
- Gather feedback

**Week 12: Production Deployment**
- Deploy to production
- Pilot with 1 practice
- Monitor for issues
- Gradual rollout

### Phase 3: Test Catalog Sync (4 weeks)

**Can run in parallel with Phase 2**

**Week 1: API Integration**
- Implement catalog API client
- Set up daily sync job

**Week 2: Data Mapping**
- Map Chiron test codes to our system
- Update reference ranges
- Update pricing

**Week 3: Testing**
- Test catalog sync
- Verify test selection UI
- Test search functionality

**Week 4: Deployment**
- Deploy to production
- Enable daily sync

---

## 12. Testing Requirements

### 12.1 Test Scenarios for Phase 1 (Webhook Results)

#### Scenario 1: Normal Result
- **Description:** Standard result with value in normal range
- **Test Code:** HGB (Hemoglobin)
- **Expected Result:** Result stored, flag='N', no alert triggered

#### Scenario 2: Abnormal Result (High)
- **Description:** Result above reference range
- **Test Code:** CHOL (Cholesterol)
- **Expected Result:** Result stored, flag='H', notification to doctor

#### Scenario 3: Critical Result
- **Description:** Life-threatening result requiring immediate action
- **Test Code:** GLU (Glucose) with value 18.5 mmol/L
- **Expected Result:** Result stored, flag='CRITICAL', urgent alert to doctor, acknowledgment required

#### Scenario 4: Multiple Results (Panel)
- **Description:** Multiple test results from same specimen
- **Test Code:** CBC panel (HGB, WBC, PLT, etc.)
- **Expected Result:** All results stored with same accession number, grouped in UI

#### Scenario 5: Result Amendment
- **Description:** Previously final result is corrected
- **Original Result:** HGB = 12.5 g/dL
- **Amended Result:** HGB = 13.2 g/dL (lab recalibrated equipment)
- **Expected Result:** New result created with status='corrected', linked to previous result

#### Scenario 6: Patient Not Found
- **Description:** Result for patient not registered in our system
- **ID Number:** 8901010123088 (non-existent)
- **Expected Result:** HTTP 404 response, logged to lab_integration_logs, notification to admin

#### Scenario 7: Duplicate Result
- **Description:** Same result_id sent twice (retry scenario)
- **Expected Result:** HTTP 200 response, no duplicate created (idempotent)

#### Scenario 8: Invalid Payload
- **Description:** Malformed JSON or missing required fields
- **Expected Result:** HTTP 400 response with validation error details

#### Scenario 9: Invalid Authentication
- **Description:** Missing or incorrect API key
- **Expected Result:** HTTP 401 Unauthorized

#### Scenario 10: Invalid Signature
- **Description:** HMAC signature doesn't match payload
- **Expected Result:** HTTP 403 Forbidden

### 12.2 Performance Testing

#### Load Test 1: Normal Load
- **Volume:** 10 results per minute
- **Duration:** 1 hour
- **Expected:** 100% success rate, < 2 second response time

#### Load Test 2: Peak Load
- **Volume:** 100 results per minute
- **Duration:** 10 minutes
- **Expected:** 100% success rate, < 5 second response time

#### Load Test 3: Spike Test
- **Volume:** 0 results, then sudden burst of 200 results
- **Expected:** All results processed, no errors, < 10 second response time for P95

### 12.3 Security Testing

1. **Authentication Bypass Attempt:** Try to send webhook without API key → Expect 401
2. **Signature Tampering:** Modify payload after signing → Expect 403
3. **Replay Attack:** Resend old webhook with valid signature → Expect 200 (idempotent, no duplicate)
4. **SQL Injection:** Send malicious SQL in payload → Expect sanitized, no database compromise
5. **XSS Attack:** Send malicious script in result values → Expect sanitized output in UI
6. **Large Payload:** Send extremely large payload (10 MB+) → Expect rejection with 413

### 12.4 Test Data Required from Chiron

Please provide the following test patients in sandbox:

| ID Number     | Name           | Scenario                          |
|---------------|----------------|-----------------------------------|
| 9001010123088 | Test Patient A | Normal results                    |
| 9102020234099 | Test Patient B | Abnormal results (high cholesterol)|
| 9203030345000 | Test Patient C | Critical result (high glucose)    |
| 9304040456011 | Test Patient D | Multiple results (CBC panel)      |
| 9405050567022 | Test Patient E | Amended result scenario           |

---

## 13. Support and Maintenance

### 13.1 Our Commitments

**Monitoring:**
- 24/7 automated monitoring of webhook endpoint
- Real-time alerts for failed webhook processing
- Weekly reports on integration health

**Incident Response:**
- Critical issues: Response within 1 hour, resolution within 4 hours
- Non-critical issues: Response within 4 hours, resolution within 24 hours
- Scheduled maintenance: Communicated 48 hours in advance

**Communication:**
- Primary contact: Technical Team Lead
- Email: keletsoentseno@gmail.com
- Emergency escalation: Available upon request

### 13.2 What We Need from Chiron

**Proactive Communication:**
- Notify us of planned maintenance 24 hours in advance
- Notify us of any API changes 30 days in advance (for backwards compatibility)
- Notify us immediately of any security incidents

**Incident Support:**
- Dedicated technical contact for integration issues
- Access to webhook delivery logs for troubleshooting
- Escalation path for critical issues affecting patient care

**Regular Reviews:**
- Quarterly integration health review
- Annual security review
- Continuous improvement discussions

### 13.3 Service Level Targets

| Metric                          | Target         |
|---------------------------------|----------------|
| Webhook delivery success rate   | > 99.5%        |
| Webhook delivery time (P95)     | < 5 minutes    |
| Patient matching accuracy       | > 99%          |
| Critical alert delivery time    | < 30 seconds   |
| API uptime (our endpoint)       | > 99.9%        |
| Mean time to resolve (MTTR)     | < 4 hours      |

---

## 14. Compliance and Legal

### 14.1 Data Protection

**POPIA Compliance (Protection of Personal Information Act):**
- All patient data encrypted in transit and at rest
- Access restricted to authorized personnel only
- Audit trail of all data access
- Data retention policy: Medical records retained indefinitely, logs for 12 months
- Patient right to access and delete data (upon request)

**HIPAA-Equivalent Standards:**
- Administrative safeguards: Access controls, training
- Physical safeguards: Data center security (Supabase/AWS)
- Technical safeguards: Encryption, authentication, audit logs

### 14.2 Data Sharing Agreement

**Scope:**
- Chiron shares lab results with our EHR for patients registered in our system
- We submit lab orders to Chiron on behalf of our doctors (Phase 2)
- Data used solely for patient care purposes

**Responsibilities:**
- **Chiron:** Ensure accuracy of lab results, timely delivery, data security
- **EHR Platform:** Secure storage, access control, patient privacy, accurate patient matching

**Liability:**
- Each party responsible for their own systems
- Chiron not liable for our system outages
- We not liable for Chiron's result accuracy (clinical responsibility remains with Chiron)

### 14.3 Business Associate Agreement (if required)

If Chiron requires a formal Business Associate Agreement (BAA) or equivalent South African legal document, we are prepared to execute such agreement.

---

## 15. Appendices

### Appendix A: Database Schema (Lab Results Tables)

Our database schema for lab results is production-ready. Key tables:

**lab_results table (simplified view):**
```sql
CREATE TABLE lab_results (
    id UUID PRIMARY KEY,
    patient_id UUID NOT NULL,
    chiron_accession_number VARCHAR(50) NOT NULL,
    chiron_result_id VARCHAR(50) UNIQUE,
    test_code VARCHAR(50) NOT NULL,
    test_name VARCHAR(255) NOT NULL,
    test_category VARCHAR(100),
    result_value TEXT NOT NULL,
    result_value_numeric DECIMAL(15, 4),
    result_unit VARCHAR(50),
    reference_range VARCHAR(200),
    reference_range_low DECIMAL(15, 4),
    reference_range_high DECIMAL(15, 4),
    abnormal_flag VARCHAR(20),  -- 'N', 'L', 'H', 'CRITICAL', etc.
    result_status VARCHAR(30),   -- 'preliminary', 'final', 'corrected'
    collection_datetime TIMESTAMPTZ NOT NULL,
    result_datetime TIMESTAMPTZ NOT NULL,
    ordering_doctor_id UUID,
    practice_code VARCHAR(20) NOT NULL,
    raw_data JSONB NOT NULL,     -- Complete original webhook payload
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Key indexes for performance:**
- `idx_lab_results_patient_id` on (patient_id, collection_datetime)
- `idx_lab_results_critical_unacknowledged` on (patient_id) WHERE abnormal_flag = 'CRITICAL'
- `idx_lab_results_chiron_result_id` on (chiron_result_id) for duplicate detection

### Appendix B: Sample Frontend Screenshots

(Screenshots to be provided upon request showing:)
1. Doctor Dashboard with Critical Lab Alerts widget
2. Patient View with Lab Results tab
3. Lab result detail view with trend graph
4. Critical value acknowledgment dialog

### Appendix C: Webhook Receiver Implementation

Our webhook receiver is implemented in Deno TypeScript:

**Location:** `supabase/functions/chiron-webhook-receiver/index.ts`

**Features:**
- API key authentication
- HMAC signature verification (optional)
- IP whitelist validation
- Patient matching by ID number
- Complete audit logging
- Error handling with proper HTTP status codes
- Idempotent operation (duplicate detection)

**Processing Time:** < 2 seconds (P95)

### Appendix D: Contact Information

**Project Team:**

| Role                  | Name                  | Email                          | Phone          |
|-----------------------|-----------------------|--------------------------------|----------------|
| Project Lead          | Keletso Ntseno       | keletsoentseno@gmail.com       | TBD            |
| Technical Lead        | Keletso Ntseno       | keletsoentseno@gmail.com       | TBD            |
| Database Admin        | Keletso Ntseno       | keletsoentseno@gmail.com       | TBD            |
| Clinical Lead         | Dr. Tsenolo P Matiya | TBD                            | TBD            |

**Chiron Team (to be filled in):**

| Role                  | Name                  | Email                          | Phone          |
|-----------------------|-----------------------|--------------------------------|----------------|
| Project Lead          | TBD                  | TBD                            | TBD            |
| Technical Lead        | TBD                  | TBD                            | TBD            |
| Integration Support   | TBD                  | TBD                            | TBD            |
| Escalation Contact    | TBD                  | TBD                            | TBD            |

### Appendix E: Glossary

| Term                  | Definition                                                                 |
|-----------------------|---------------------------------------------------------------------------|
| **Accession Number**  | Unique identifier assigned by lab to specimen                             |
| **Abnormal Flag**     | Indicator showing if result is normal, high, low, or critical             |
| **Edge Function**     | Serverless function running on distributed edge network                   |
| **HMAC**              | Hash-based Message Authentication Code (cryptographic signature)          |
| **LOINC**             | Logical Observation Identifiers Names and Codes (standard test codes)     |
| **POPIA**             | Protection of Personal Information Act (South African privacy law)        |
| **RLS**               | Row Level Security (database-level access control)                        |
| **SNOMED**            | Systematized Nomenclature of Medicine (clinical terminology standard)     |
| **TLS**               | Transport Layer Security (encryption protocol for HTTPS)                  |
| **Webhook**           | HTTP callback triggered by event (e.g., result available)                 |

### Appendix F: Revision History

| Version | Date       | Author          | Changes                          |
|---------|------------|-----------------|----------------------------------|
| 1.0     | 2026-01-20 | Keletso Ntseno | Initial requirements document    |

---

## Next Steps

1. **Kickoff Meeting:** Schedule meeting with Chiron integration team to review this document
2. **Chiron Response:** Chiron to provide feedback and documentation outlined in Section 10
3. **Technical Deep Dive:** Detailed technical discussion on webhook payload format and authentication
4. **Test Environment Setup:** Chiron to provide sandbox access and test credentials
5. **Development:** Begin integration development based on Chiron specifications
6. **Testing:** Comprehensive testing in sandbox environment
7. **Pilot Deployment:** Go-live with 1-2 practices
8. **Full Rollout:** Deploy to all practices

---

## Document Approval

**Prepared By:**
Keletso Ntseno
EHR Technical Lead
Date: January 20, 2026

**Reviewed By:**
_________________________
(Chiron Project Lead)
Date: __________

**Approved By:**
_________________________
(Clinical Lead)
Date: __________

---

**END OF DOCUMENT**

*This document is confidential and intended solely for the use of Chiron Laboratory Services and the EHR Development Team. Distribution outside these parties requires written approval.*

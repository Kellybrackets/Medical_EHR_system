/**
 * Chiron Lab Results Webhook Receiver
 * Receives lab results from Chiron and stores them in the database
 *
 * Security Features:
 * - API key authentication
 * - IP whitelist validation
 * - HMAC signature verification
 * - Request payload validation
 * - Comprehensive audit logging
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { crypto } from 'https://deno.land/std@0.168.0/crypto/mod.ts';

// =====================================================
// CONFIGURATION
// =====================================================

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const CHIRON_API_KEY = Deno.env.get('CHIRON_API_KEY')!;
const CHIRON_WEBHOOK_SECRET = Deno.env.get('CHIRON_WEBHOOK_SECRET')!;
const CHIRON_IP_WHITELIST = (Deno.env.get('CHIRON_IP_WHITELIST') || '').split(',').map(ip => ip.trim());

// Initialize Supabase client with service role (bypasses RLS)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// =====================================================
// TYPE DEFINITIONS
// =====================================================

interface ChironWebhookPayload {
  accession_number: string;
  order_id?: string;
  result_id?: string;
  patient: {
    id_number: string;
    first_name: string;
    surname: string;
    date_of_birth: string;
  };
  test: {
    code: string;
    name: string;
    category?: string;
    loinc_code?: string;
  };
  specimen: {
    type: string;
    id?: string;
    collection_datetime: string;
    received_datetime?: string;
  };
  result: {
    value: string;
    value_numeric?: number;
    unit?: string;
    data_type?: 'text' | 'numeric' | 'coded' | 'ratio';
    reference_range?: string;
    reference_range_low?: number;
    reference_range_high?: number;
    flag?: 'N' | 'L' | 'H' | 'LL' | 'HH' | 'CRITICAL' | '<' | '>' | 'A' | 'AA';
    status: 'preliminary' | 'final' | 'corrected' | 'amended';
    datetime: string;
    verified_datetime?: string;
  };
  clinical?: {
    comment?: string;
    interpretation_codes?: string[];
  };
  personnel?: {
    ordering_doctor?: string;
    performing_technician?: string;
    verifying_pathologist?: string;
  };
  metadata?: Record<string, unknown>;
}

interface LogEntry {
  event_type: string;
  direction: 'inbound' | 'outbound' | 'internal';
  severity: 'debug' | 'info' | 'warning' | 'error' | 'critical';
  patient_id?: string;
  result_id?: string;
  chiron_accession_number?: string;
  request_payload?: Record<string, unknown>;
  response_payload?: Record<string, unknown>;
  headers?: Record<string, unknown>;
  status: 'success' | 'failure' | 'pending';
  error_code?: string;
  error_message?: string;
  error_stack?: string;
  ip_address?: string;
  user_agent?: string;
  request_id?: string;
  processing_time_ms?: number;
}

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

/**
 * Verify HMAC signature to ensure request authenticity
 */
async function verifyHmacSignature(
  payload: string,
  signature: string | null,
  secret: string
): Promise<boolean> {
  if (!signature) return false;

  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signatureBuffer = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(payload)
    );

    const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    return signature === expectedSignature;
  } catch (error) {
    console.error('HMAC verification error:', error);
    return false;
  }
}

/**
 * Validate IP address against whitelist
 */
function isIpWhitelisted(ip: string | null): boolean {
  if (!ip || CHIRON_IP_WHITELIST.length === 0) return true; // Allow if no whitelist configured
  return CHIRON_IP_WHITELIST.includes(ip);
}

/**
 * Extract client IP from request
 */
function getClientIp(req: Request): string | null {
  return req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
         req.headers.get('x-real-ip') ||
         null;
}

/**
 * Log integration event to database
 */
async function logIntegrationEvent(entry: LogEntry): Promise<void> {
  try {
    await supabase.from('lab_integration_logs').insert({
      event_type: entry.event_type,
      direction: entry.direction,
      severity: entry.severity,
      patient_id: entry.patient_id,
      result_id: entry.result_id,
      chiron_accession_number: entry.chiron_accession_number,
      request_payload: entry.request_payload,
      response_payload: entry.response_payload,
      headers: entry.headers,
      status: entry.status,
      error_code: entry.error_code,
      error_message: entry.error_message,
      error_stack: entry.error_stack,
      ip_address: entry.ip_address,
      user_agent: entry.user_agent,
      request_id: entry.request_id,
      processing_time_ms: entry.processing_time_ms,
    });
  } catch (error) {
    console.error('Failed to log integration event:', error);
  }
}

/**
 * Find patient by ID number
 */
async function findPatientByIdNumber(idNumber: string): Promise<{
  id: string;
  practice_code: string;
  first_name: string;
  surname: string;
} | null> {
  const { data, error } = await supabase
    .from('patients')
    .select('id, practice_code, first_name, surname')
    .eq('id_number', idNumber)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    console.error('Patient lookup error:', error);
    return null;
  }

  return data;
}

/**
 * Store lab result in database
 */
async function storeLabResult(payload: ChironWebhookPayload, patientId: string, practiceCode: string) {
  const resultData = {
    patient_id: patientId,
    chiron_accession_number: payload.accession_number,
    chiron_order_id: payload.order_id || null,
    chiron_result_id: payload.result_id || null,

    test_code: payload.test.code,
    test_name: payload.test.name,
    test_category: payload.test.category || null,
    loinc_code: payload.test.loinc_code || null,

    specimen_type: payload.specimen.type,
    specimen_id: payload.specimen.id || null,

    result_value: payload.result.value,
    result_value_numeric: payload.result.value_numeric || null,
    result_unit: payload.result.unit || null,
    result_data_type: payload.result.data_type || 'text',

    reference_range: payload.result.reference_range || null,
    reference_range_low: payload.result.reference_range_low || null,
    reference_range_high: payload.result.reference_range_high || null,

    abnormal_flag: payload.result.flag || 'N',
    interpretation_codes: payload.clinical?.interpretation_codes || null,
    clinical_comment: payload.clinical?.comment || null,

    result_status: payload.result.status,

    collection_datetime: payload.specimen.collection_datetime,
    received_by_lab_datetime: payload.specimen.received_datetime || null,
    result_datetime: payload.result.datetime,
    verified_datetime: payload.result.verified_datetime || null,

    ordering_doctor_name: payload.personnel?.ordering_doctor || null,
    performing_technician: payload.personnel?.performing_technician || null,
    verifying_pathologist: payload.personnel?.verifying_pathologist || null,

    performing_lab: 'Chiron',

    raw_data: payload,
    data_source: 'chiron_api',
    practice_code: practiceCode,
  };

  const { data, error } = await supabase
    .from('lab_results')
    .insert(resultData)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to store lab result: ${error.message}`);
  }

  return data;
}

/**
 * Send critical value alert
 */
async function sendCriticalValueAlert(result: any, patient: any): Promise<void> {
  // TODO: Implement notification system (SMS, email, in-app)
  // For now, just log it
  console.log('CRITICAL VALUE ALERT:', {
    patient: `${patient.first_name} ${patient.surname}`,
    test: result.test_name,
    value: result.result_value,
    result_id: result.id,
  });

  await logIntegrationEvent({
    event_type: 'critical_alert_sent',
    direction: 'internal',
    severity: 'critical',
    patient_id: patient.id,
    result_id: result.id,
    chiron_accession_number: result.chiron_accession_number,
    status: 'success',
  });
}

/**
 * Validate webhook payload structure
 */
function validatePayload(payload: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!payload.accession_number) {
    errors.push('Missing accession_number');
  }

  if (!payload.patient?.id_number) {
    errors.push('Missing patient.id_number');
  }

  if (!payload.test?.code || !payload.test?.name) {
    errors.push('Missing test information');
  }

  if (!payload.result?.value || !payload.result?.datetime) {
    errors.push('Missing result information');
  }

  if (!payload.specimen?.collection_datetime) {
    errors.push('Missing specimen collection datetime');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// =====================================================
// MAIN HANDLER
// =====================================================

serve(async (req: Request) => {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();
  const clientIp = getClientIp(req);
  const userAgent = req.headers.get('user-agent');

  console.log(`[${requestId}] Incoming webhook from ${clientIp}`);

  try {
    // ===== SECURITY CHECKS =====

    // 1. Check HTTP method
    if (req.method !== 'POST') {
      await logIntegrationEvent({
        event_type: 'webhook_received',
        direction: 'inbound',
        severity: 'warning',
        status: 'failure',
        error_code: 'METHOD_NOT_ALLOWED',
        error_message: `Method ${req.method} not allowed`,
        ip_address: clientIp || undefined,
        user_agent: userAgent || undefined,
        request_id: requestId,
      });

      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 2. Verify API key
    const apiKey = req.headers.get('x-chiron-api-key');
    if (!apiKey || apiKey !== CHIRON_API_KEY) {
      await logIntegrationEvent({
        event_type: 'webhook_received',
        direction: 'inbound',
        severity: 'error',
        status: 'failure',
        error_code: 'INVALID_API_KEY',
        error_message: 'Invalid or missing API key',
        ip_address: clientIp || undefined,
        user_agent: userAgent || undefined,
        request_id: requestId,
      });

      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 3. Verify IP whitelist
    if (!isIpWhitelisted(clientIp)) {
      await logIntegrationEvent({
        event_type: 'webhook_received',
        direction: 'inbound',
        severity: 'error',
        status: 'failure',
        error_code: 'IP_NOT_WHITELISTED',
        error_message: `IP ${clientIp} not in whitelist`,
        ip_address: clientIp || undefined,
        user_agent: userAgent || undefined,
        request_id: requestId,
      });

      return new Response(
        JSON.stringify({ error: 'Forbidden' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 4. Parse and verify HMAC signature
    const rawBody = await req.text();
    const signature = req.headers.get('x-chiron-signature');

    if (CHIRON_WEBHOOK_SECRET && !(await verifyHmacSignature(rawBody, signature, CHIRON_WEBHOOK_SECRET))) {
      await logIntegrationEvent({
        event_type: 'webhook_received',
        direction: 'inbound',
        severity: 'error',
        status: 'failure',
        error_code: 'INVALID_SIGNATURE',
        error_message: 'Invalid HMAC signature',
        ip_address: clientIp || undefined,
        user_agent: userAgent || undefined,
        request_id: requestId,
      });

      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Parse JSON payload
    let payload: ChironWebhookPayload;
    try {
      payload = JSON.parse(rawBody);
    } catch (error) {
      await logIntegrationEvent({
        event_type: 'webhook_received',
        direction: 'inbound',
        severity: 'error',
        status: 'failure',
        error_code: 'INVALID_JSON',
        error_message: 'Invalid JSON payload',
        ip_address: clientIp || undefined,
        user_agent: userAgent || undefined,
        request_id: requestId,
      });

      return new Response(
        JSON.stringify({ error: 'Invalid JSON' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 5. Validate payload structure
    const validation = validatePayload(payload);
    if (!validation.valid) {
      await logIntegrationEvent({
        event_type: 'webhook_received',
        direction: 'inbound',
        severity: 'error',
        status: 'failure',
        error_code: 'VALIDATION_ERROR',
        error_message: validation.errors.join(', '),
        request_payload: payload,
        ip_address: clientIp || undefined,
        user_agent: userAgent || undefined,
        request_id: requestId,
      });

      return new Response(
        JSON.stringify({ error: 'Validation failed', details: validation.errors }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // ===== PROCESS RESULT =====

    // 6. Find patient
    const patient = await findPatientByIdNumber(payload.patient.id_number);

    if (!patient) {
      await logIntegrationEvent({
        event_type: 'patient_not_matched',
        direction: 'inbound',
        severity: 'warning',
        status: 'failure',
        error_code: 'PATIENT_NOT_FOUND',
        error_message: `No patient found with ID number: ${payload.patient.id_number}`,
        chiron_accession_number: payload.accession_number,
        request_payload: payload,
        ip_address: clientIp || undefined,
        user_agent: userAgent || undefined,
        request_id: requestId,
      });

      return new Response(
        JSON.stringify({
          error: 'Patient not found',
          accession_number: payload.accession_number,
          patient_id_number: payload.patient.id_number,
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 7. Store lab result
    const storedResult = await storeLabResult(payload, patient.id, patient.practice_code);

    // 8. Handle critical values
    if (payload.result.flag === 'CRITICAL') {
      await sendCriticalValueAlert(storedResult, patient);
    }

    // 9. Log success
    const processingTime = Date.now() - startTime;
    await logIntegrationEvent({
      event_type: 'result_received',
      direction: 'inbound',
      severity: payload.result.flag === 'CRITICAL' ? 'critical' : 'info',
      patient_id: patient.id,
      result_id: storedResult.id,
      chiron_accession_number: payload.accession_number,
      request_payload: payload,
      status: 'success',
      ip_address: clientIp || undefined,
      user_agent: userAgent || undefined,
      request_id: requestId,
      processing_time_ms: processingTime,
    });

    console.log(`[${requestId}] Successfully processed result for patient ${patient.id} in ${processingTime}ms`);

    // 10. Return success response
    return new Response(
      JSON.stringify({
        success: true,
        result_id: storedResult.id,
        patient_id: patient.id,
        accession_number: payload.accession_number,
        processing_time_ms: processingTime,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    // Handle unexpected errors
    const processingTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;

    await logIntegrationEvent({
      event_type: 'webhook_received',
      direction: 'inbound',
      severity: 'critical',
      status: 'failure',
      error_code: 'INTERNAL_ERROR',
      error_message: errorMessage,
      error_stack: errorStack,
      ip_address: clientIp || undefined,
      user_agent: userAgent || undefined,
      request_id: requestId,
      processing_time_ms: processingTime,
    });

    console.error(`[${requestId}] Error processing webhook:`, error);

    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        request_id: requestId,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});

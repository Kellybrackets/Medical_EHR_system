/**
 * Lab Results Integration Type Definitions
 * Defines TypeScript interfaces for the lab results system
 */

// =====================================================
// ENUMS AND CONSTANTS
// =====================================================

export const ABNORMAL_FLAGS = {
  NORMAL: 'N',
  LOW: 'L',
  HIGH: 'H',
  VERY_LOW: 'LL',
  VERY_HIGH: 'HH',
  CRITICAL: 'CRITICAL',
  BELOW_RANGE: '<',
  ABOVE_RANGE: '>',
  ABNORMAL: 'A',
  VERY_ABNORMAL: 'AA',
} as const;

export type AbnormalFlag = typeof ABNORMAL_FLAGS[keyof typeof ABNORMAL_FLAGS];

export const RESULT_STATUS = {
  PRELIMINARY: 'preliminary',
  FINAL: 'final',
  CORRECTED: 'corrected',
  AMENDED: 'amended',
  CANCELLED: 'cancelled',
  ENTERED_IN_ERROR: 'entered_in_error',
} as const;

export type ResultStatus = typeof RESULT_STATUS[keyof typeof RESULT_STATUS];

export const ORDER_STATUS = {
  DRAFT: 'draft',
  PENDING: 'pending',
  SENT: 'sent',
  ACKNOWLEDGED: 'acknowledged',
  IN_PROGRESS: 'in_progress',
  PARTIAL: 'partial',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  FAILED: 'failed',
} as const;

export type OrderStatus = typeof ORDER_STATUS[keyof typeof ORDER_STATUS];

export const ORDER_PRIORITY = {
  ROUTINE: 'routine',
  URGENT: 'urgent',
  STAT: 'stat',
  ASAP: 'asap',
} as const;

export type OrderPriority = typeof ORDER_PRIORITY[keyof typeof ORDER_PRIORITY];

export const RESULT_DATA_TYPE = {
  TEXT: 'text',
  NUMERIC: 'numeric',
  CODED: 'coded',
  RATIO: 'ratio',
  ATTACHMENT: 'attachment',
} as const;

export type ResultDataType = typeof RESULT_DATA_TYPE[keyof typeof RESULT_DATA_TYPE];

export const SPECIMEN_TYPES = {
  BLOOD: 'Blood',
  SERUM: 'Serum',
  PLASMA: 'Plasma',
  URINE: 'Urine',
  SWAB: 'Swab',
  STOOL: 'Stool',
  CSF: 'Cerebrospinal Fluid',
  TISSUE: 'Tissue',
  SALIVA: 'Saliva',
  SPUTUM: 'Sputum',
} as const;

export type SpecimenType = typeof SPECIMEN_TYPES[keyof typeof SPECIMEN_TYPES];

export const TEST_CATEGORIES = {
  HEMATOLOGY: 'Hematology',
  CHEMISTRY: 'Chemistry',
  MICROBIOLOGY: 'Microbiology',
  IMMUNOLOGY: 'Immunology',
  SEROLOGY: 'Serology',
  TOXICOLOGY: 'Toxicology',
  MOLECULAR: 'Molecular',
  PATHOLOGY: 'Pathology',
  HORMONES: 'Hormones',
  TUMOR_MARKERS: 'Tumor Markers',
  CARDIAC_MARKERS: 'Cardiac Markers',
} as const;

export type TestCategory = typeof TEST_CATEGORIES[keyof typeof TEST_CATEGORIES];

// =====================================================
// DATABASE TABLE INTERFACES
// =====================================================

/**
 * Lab Test Catalog - Available tests from Chiron
 */
export interface LabTestCatalog {
  id: string;
  chiron_test_code: string;
  chiron_test_name: string;
  loinc_code: string | null;
  snomed_code: string | null;
  category: string | null;
  subcategory: string | null;
  specimen_type: string | null;
  specimen_volume: string | null;
  container_type: string | null;
  turnaround_time: string | null;
  requires_fasting: boolean;
  patient_preparation: string | null;
  special_instructions: string | null;
  clinical_indications: string | null;
  reference_range_template: string | null;
  reference_range_notes: string | null;
  price_amount: number | null;
  is_active: boolean;
  is_urgent_available: boolean;
  created_at: string;
  updated_at: string;
  search_terms: string | null;
}

/**
 * Lab Order - Order sent to Chiron
 */
export interface LabOrder {
  id: string;
  order_number: string;
  chiron_order_id: string | null;
  patient_id: string;
  ordering_doctor_id: string;
  consultation_id: string | null;
  tests_ordered: TestOrderItem[];
  total_tests: number;
  clinical_notes: string | null;
  diagnosis_codes: string[] | null;
  priority: OrderPriority;
  fasting_status: 'fasting' | 'non_fasting' | 'unknown' | null;
  collection_datetime: string | null;
  collection_location: string | null;
  collected_by: string | null;
  status: OrderStatus;
  status_changed_at: string;
  status_changed_by: string | null;
  sent_to_chiron_at: string | null;
  acknowledged_by_chiron_at: string | null;
  chiron_acknowledgment: Record<string, unknown> | null;
  expected_results_by: string | null;
  results_received_at: string | null;
  results_count: number;
  raw_request: Record<string, unknown> | null;
  raw_response: Record<string, unknown> | null;
  error_message: string | null;
  retry_count: number;
  practice_code: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

/**
 * Test item in an order
 */
export interface TestOrderItem {
  test_code: string;
  test_name: string;
  urgent?: boolean;
  fasting_required?: boolean;
}

/**
 * Lab Result - Result received from Chiron
 */
export interface LabResult {
  id: string;
  patient_id: string;
  order_id: string | null;
  consultation_id: string | null;
  chiron_accession_number: string;
  chiron_order_id: string | null;
  chiron_result_id: string | null;
  test_code: string;
  test_name: string;
  test_category: string | null;
  loinc_code: string | null;
  specimen_type: string | null;
  specimen_id: string | null;
  result_value: string;
  result_value_numeric: number | null;
  result_unit: string | null;
  result_data_type: ResultDataType;
  reference_range: string | null;
  reference_range_low: number | null;
  reference_range_high: number | null;
  abnormal_flag: AbnormalFlag | null;
  interpretation_codes: string[] | null;
  clinical_comment: string | null;
  result_status: ResultStatus;
  result_status_changed_at: string;
  previous_result_id: string | null;
  collection_datetime: string;
  received_by_lab_datetime: string | null;
  result_datetime: string;
  reported_datetime: string;
  verified_datetime: string | null;
  released_datetime: string | null;
  ordering_doctor_id: string | null;
  ordering_doctor_name: string | null;
  performing_lab: string;
  performing_technician: string | null;
  verifying_pathologist: string | null;
  viewed_by: string[];
  first_viewed_at: string | null;
  first_viewed_by: string | null;
  acknowledged_by: string | null;
  acknowledged_at: string | null;
  is_critical: boolean;
  critical_notified_at: string | null;
  critical_notified_to: string | null;
  critical_acknowledged: boolean;
  clinician_notes: string | null;
  internal_notes: string | null;
  raw_data: Record<string, unknown>;
  data_source: string;
  import_batch_id: string | null;
  practice_code: string;
  created_at: string;
  updated_at: string;
}

/**
 * Lab Integration Log - Audit trail
 */
export interface LabIntegrationLog {
  id: string;
  event_type: string;
  direction: 'inbound' | 'outbound' | 'internal';
  severity: 'debug' | 'info' | 'warning' | 'error' | 'critical';
  patient_id: string | null;
  order_id: string | null;
  result_id: string | null;
  chiron_accession_number: string | null;
  chiron_order_id: string | null;
  chiron_result_id: string | null;
  request_payload: Record<string, unknown> | null;
  response_payload: Record<string, unknown> | null;
  headers: Record<string, unknown> | null;
  status: 'success' | 'partial' | 'failure' | 'pending' | 'retrying';
  error_code: string | null;
  error_message: string | null;
  error_stack: string | null;
  ip_address: string | null;
  user_agent: string | null;
  request_id: string | null;
  processing_time_ms: number | null;
  retry_count: number;
  user_id: string | null;
  created_at: string;
}

/**
 * Lab Result Comment
 */
export interface LabResultComment {
  id: string;
  result_id: string;
  user_id: string;
  comment: string;
  is_internal: boolean;
  created_at: string;
  updated_at: string;
}

// =====================================================
// EXTENDED INTERFACES (with joins)
// =====================================================

/**
 * Lab Result with patient and doctor information
 */
export interface LabResultWithDetails extends LabResult {
  patient?: {
    id: string;
    first_name: string;
    surname: string;
    id_number: string;
    date_of_birth: string;
  };
  ordering_doctor?: {
    id: string;
    name: string;
    username: string;
  };
  comments?: LabResultComment[];
}

/**
 * Lab Order with patient and tests information
 */
export interface LabOrderWithDetails extends LabOrder {
  patient?: {
    id: string;
    first_name: string;
    surname: string;
    id_number: string;
  };
  ordering_doctor?: {
    id: string;
    name: string;
  };
  results?: LabResult[];
}

// =====================================================
// API/WEBHOOK PAYLOAD INTERFACES
// =====================================================

/**
 * Chiron webhook payload for incoming results
 */
export interface ChironResultWebhookPayload {
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
    data_type?: ResultDataType;
    reference_range?: string;
    reference_range_low?: number;
    reference_range_high?: number;
    flag?: AbnormalFlag;
    status: ResultStatus;
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

/**
 * Chiron order submission payload
 */
export interface ChironOrderSubmissionPayload {
  order_number: string;
  patient: {
    id_number: string;
    first_name: string;
    surname: string;
    date_of_birth: string;
    contact_number?: string;
  };
  ordering_doctor: {
    name: string;
    contact?: string;
    practice_number?: string;
  };
  tests: {
    code: string;
    name: string;
    urgent?: boolean;
  }[];
  clinical: {
    notes?: string;
    diagnosis_codes?: string[];
  };
  priority: OrderPriority;
  collection?: {
    datetime?: string;
    location?: string;
    collected_by?: string;
  };
}

// =====================================================
// UI/COMPONENT INTERFACES
// =====================================================

/**
 * Lab result filter options
 */
export interface LabResultFilters {
  patientId?: string;
  dateFrom?: string;
  dateTo?: string;
  testCategory?: string;
  testCode?: string;
  abnormalOnly?: boolean;
  criticalOnly?: boolean;
  unacknowledgedOnly?: boolean;
  status?: ResultStatus;
  orderingDoctorId?: string;
}

/**
 * Lab result grouping options
 */
export type LabResultGroupBy = 'date' | 'category' | 'test' | 'status' | 'none';

/**
 * Lab result sort options
 */
export interface LabResultSort {
  field: 'collection_datetime' | 'result_datetime' | 'test_name' | 'abnormal_flag';
  direction: 'asc' | 'desc';
}

/**
 * Lab results summary for a patient
 */
export interface LabResultsSummary {
  total_results: number;
  critical_count: number;
  abnormal_count: number;
  recent_tests: Array<{
    test_name: string;
    result_value: string;
    abnormal_flag: AbnormalFlag | null;
    collection_datetime: string;
  }>;
  last_test_date: string | null;
}

/**
 * Critical lab result alert
 */
export interface CriticalLabAlert {
  result_id: string;
  patient_id: string;
  patient_name: string;
  test_name: string;
  result_value: string;
  abnormal_flag: AbnormalFlag;
  collection_datetime: string;
  age_hours: number;
  acknowledged: boolean;
}

/**
 * Lab result trend data point (for graphing)
 */
export interface LabResultTrendPoint {
  datetime: string;
  value: number;
  unit: string;
  abnormal_flag: AbnormalFlag | null;
  reference_range_low: number | null;
  reference_range_high: number | null;
}

/**
 * Lab result comparison (for multiple results of same test)
 */
export interface LabResultComparison {
  test_name: string;
  test_code: string;
  results: LabResult[];
  trend: 'improving' | 'worsening' | 'stable' | 'unknown';
  trend_data: LabResultTrendPoint[];
}

// =====================================================
// FORM INTERFACES
// =====================================================

/**
 * Lab order form data
 */
export interface LabOrderFormData {
  patient_id: string;
  ordering_doctor_id: string;
  tests: TestOrderItem[];
  clinical_notes?: string;
  diagnosis_codes?: string[];
  priority: OrderPriority;
  fasting_status?: 'fasting' | 'non_fasting' | 'unknown';
  collection_datetime?: string;
}

/**
 * Lab result comment form data
 */
export interface LabResultCommentFormData {
  result_id: string;
  comment: string;
  is_internal: boolean;
}

// =====================================================
// HOOK RETURN TYPES
// =====================================================

/**
 * Return type for useLabResults hook
 */
export interface UseLabResultsReturn {
  results: LabResult[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  markAsViewed: (resultId: string) => Promise<void>;
  acknowledgeCritical: (resultId: string, notes?: string) => Promise<void>;
  addComment: (resultId: string, comment: string, isInternal: boolean) => Promise<void>;
}

/**
 * Return type for useLabOrders hook
 */
export interface UseLabOrdersReturn {
  orders: LabOrder[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  createOrder: (orderData: LabOrderFormData) => Promise<LabOrder>;
  cancelOrder: (orderId: string) => Promise<void>;
}

/**
 * Return type for useLabTestCatalog hook
 */
export interface UseLabTestCatalogReturn {
  tests: LabTestCatalog[];
  loading: boolean;
  error: Error | null;
  searchTests: (query: string) => LabTestCatalog[];
  getTestByCode: (code: string) => LabTestCatalog | undefined;
  getTestsByCategory: (category: string) => LabTestCatalog[];
}

/**
 * Return type for useCriticalLabAlerts hook
 */
export interface UseCriticalLabAlertsReturn {
  alerts: CriticalLabAlert[];
  loading: boolean;
  error: Error | null;
  unacknowledgedCount: number;
  refetch: () => Promise<void>;
}

// =====================================================
// UTILITY TYPES
// =====================================================

/**
 * Helper type for creating new lab results
 */
export type CreateLabResultInput = Omit<
  LabResult,
  'id' | 'created_at' | 'updated_at' | 'is_critical' | 'total_tests'
>;

/**
 * Helper type for updating lab results
 */
export type UpdateLabResultInput = Partial<
  Pick<
    LabResult,
    | 'clinician_notes'
    | 'internal_notes'
    | 'acknowledged_by'
    | 'acknowledged_at'
    | 'critical_acknowledged'
  >
>;

/**
 * Helper type for lab result statistics
 */
export interface LabResultStatistics {
  total: number;
  normal: number;
  abnormal: number;
  critical: number;
  pending: number;
  final: number;
  byCategory: Record<string, number>;
  byAbnormalFlag: Record<AbnormalFlag, number>;
}

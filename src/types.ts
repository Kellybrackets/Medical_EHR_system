// ========================================
// NORMALIZED DATABASE INTERFACES
// ========================================

export type ConsultationStatus = 'waiting' | 'in_consultation' | 'served';
export type PaymentMethod = 'cash' | 'medical_aid';

export interface Patient {
  id: string;
  firstName: string;
  surname: string;
  idType: 'id_number' | 'passport';
  idNumber: string;
  sex: 'Male' | 'Female' | 'Other';
  dateOfBirth: string;
  age: number;
  contactNumber: string;
  alternateNumber?: string;
  email?: string;
  address: string;
  city?: string;
  postalCode?: string;
  createdAt: string;
  updatedAt: string;

  // Queue/Consultation status
  consultationStatus?: ConsultationStatus;
  currentDoctorId?: string;
  lastStatusChange?: string;
  visitType?: 'regular' | 'follow_up' | 'emergency';
  visitReason?: string;

  // Parent/Child linking
  parentId?: string;
  isDependent?: boolean;

  // Payment method
  paymentMethod?: PaymentMethod;

  // Related data (populated via joins)
  nextOfKin?: NextOfKin;

  insuranceDetails?: InsuranceDetails;
}

export interface NextOfKin {
  id: string;
  patientId: string;
  name: string;
  relationship: string;
  phone: string;
  alternatePhone?: string;
  email?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InsuranceDetails {
  id: string;
  patientId: string;
  fundName?: string;
  memberNumber?: string;
  plan?: string;
  schemeCode?: string;
  dependentType?: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  username: string;
  role: 'doctor' | 'receptionist' | 'admin';
  name: string;
  practiceCode?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Practice {
  id: string;
  name: string;
  code: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface SystemSetting {
  id: string;
  settingKey: string;
  settingValue: string;
  settingType: 'string' | 'number' | 'boolean';
  description?: string;
  updatedAt: string;
  updatedBy?: string;
}

export interface ConsultationNote {
  id: string;
  patientId: string;
  patient?: Patient;
  doctorId: string;
  doctor?: User;
  date: string;
  reasonForVisit: string;
  icd10Code?: string;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  createdAt: string;
  updatedAt: string;
}

// ========================================
// FORM DATA INTERFACES
// ========================================

export interface PatientFormData {
  // Personal Information
  firstName: string;
  surname: string;
  idType: 'id_number' | 'passport';
  idNumber: string;
  dateOfBirth: string;
  age?: string;
  gender: 'male' | 'female' | 'other';

  // Contact Information
  contactNumber: string;
  alternateNumber?: string;
  email?: string;
  address: string;
  city: string;
  postalCode?: string;

  // Emergency Contact
  emergencyContactName: string;
  emergencyContactRelationship: string;
  emergencyContactPhone: string;
  emergencyContactAlternatePhone?: string;
  emergencyContactEmail?: string;

  // Payment & Medical Aid Information
  paymentMethod: 'cash' | 'medical_aid';
  medicalAidProvider?: string;
  medicalAidNumber?: string;
  medicalAidPlan?: string;
  medicalAidSchemeCode?: string;
  dependentType?: string;

  // Parent/Child linking
  parentId?: string;
  isDependent?: boolean;
}

// ========================================
// API RESPONSE INTERFACES
// ========================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  field?: string;
}

export interface PatientWithRelations extends Patient {
  nextOfKin: NextOfKin;

  insuranceDetails: InsuranceDetails;
}

// ========================================
// DATABASE ROW TYPES (matching Supabase)
// ========================================

export interface PatientRow {
  id: string;
  first_name: string;
  surname: string;
  id_type: 'id_number' | 'passport';
  id_number: string;
  sex: 'Male' | 'Female' | 'Other';
  date_of_birth: string;
  age: number;
  contact_number: string;
  alternate_number?: string;
  email?: string;
  address: string;
  city?: string;
  postal_code?: string;
  parent_id?: string;
  is_dependent?: boolean;
  created_at: string;
  updated_at: string;
}

export interface NextOfKinRow {
  id: string;
  patient_id: string;
  name: string;
  relationship: string;
  phone: string;
  alternate_phone?: string;
  email?: string;
  created_at: string;
  updated_at: string;
}

export interface InsuranceDetailsRow {
  id: string;
  patient_id: string;
  fund_name?: string;
  member_number?: string;
  plan?: string;
  scheme_code?: string;
  dependent_type?: string;
  created_at: string;
  updated_at: string;
}

// ========================================
// LEGACY INTERFACES (for backwards compatibility)
// ========================================

// Keep old MedicalAid interface for compatibility
export interface MedicalAid {
  fundName: string;
  memberNumber: string;
  plan: string;
}

// Keep old SoapNote interface for compatibility
export interface SoapNote {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}

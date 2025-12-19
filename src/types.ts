// ========================================
// NORMALIZED DATABASE INTERFACES
// ========================================

export type ConsultationStatus = 'waiting' | 'in_consultation' | 'served';

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

  // Related data (populated via joins)
  nextOfKin?: NextOfKin;
  medicalHistory?: MedicalHistory;
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

export interface MedicalHistory {
  id: string;
  patientId: string;
  height?: number; // in cm
  weight?: number; // in kg
  bloodType?: string;
  allergies: string[];
  chronicConditions: string[];
  currentMedications: string[];
  pastSurgeries: string[];
  familyHistory?: string;
  smokingStatus: 'never' | 'former' | 'current';
  alcoholConsumption: 'never' | 'occasional' | 'moderate' | 'heavy';
  createdAt: string;
  updatedAt: string;
}

export interface InsuranceDetails {
  id: string;
  patientId: string;
  fundName?: string;
  memberNumber?: string;
  plan?: string;
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
  age: string;
  gender: 'male' | 'female' | 'other';
  
  // Contact Information
  contactNumber: string;
  alternateNumber: string;
  email: string;
  address: string;
  city: string;
  postalCode: string;
  
  // Emergency Contact
  emergencyContactName: string;
  emergencyContactRelationship: string;
  emergencyContactPhone: string;
  emergencyContactAlternatePhone: string;
  emergencyContactEmail: string;
  
  // Medical Aid Information
  medicalAidProvider: string;
  medicalAidNumber: string;
  medicalAidPlan: string;
  
  // Medical History
  allergies: string;
  chronicConditions: string;
  currentMedications: string;
  pastSurgeries: string;
  familyHistory: string;
  
  // Additional Information
  bloodType: string;
  height: string;
  weight: string;
  smokingStatus: 'never' | 'former' | 'current';
  alcoholConsumption: 'never' | 'occasional' | 'moderate' | 'heavy';
}

// ========================================
// API RESPONSE INTERFACES
// ========================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  field?: string;
}

export interface PatientWithRelations extends Patient {
  nextOfKin: NextOfKin;
  medicalHistory: MedicalHistory;
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

export interface MedicalHistoryRow {
  id: string;
  patient_id: string;
  height?: number;
  weight?: number;
  blood_type?: string;
  allergies: string[];
  chronic_conditions: string[];
  current_medications: string[];
  past_surgeries: string[];
  family_history?: string;
  smoking_status: 'never' | 'former' | 'current';
  alcohol_consumption: 'never' | 'occasional' | 'moderate' | 'heavy';
  created_at: string;
  updated_at: string;
}

export interface InsuranceDetailsRow {
  id: string;
  patient_id: string;
  fund_name?: string;
  member_number?: string;
  plan?: string;
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
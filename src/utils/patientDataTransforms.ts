import { Patient, PatientFormData } from '../types';

/**
 * Utility functions for transforming patient data between database and form formats
 */

// Format height for form display (filter out invalid default values)
const formatHeightForForm = (height: number | null | undefined): string => {
  if (!height || height <= 30 || height >= 300) {
    return '';
  }
  return height.toString();
};

// Format weight for form display (filter out invalid default values)  
const formatWeightForForm = (weight: number | null | undefined): string => {
  if (!weight || weight <= 1 || weight >= 500) {
    return '';
  }
  return weight.toString();
};

// Convert array to comma-separated string for form display
export const arrayToString = (arr: string[] | null | undefined): string => {
  if (!arr || !Array.isArray(arr) || arr.length === 0) {
    return '';
  }
  
  // Filter out empty strings and malformed data
  const cleanArray = arr.filter(item => {
    if (!item || typeof item !== 'string') return false;
    const cleanItem = item.trim().toLowerCase();
    // Filter out malformed entries
    return cleanItem !== '' && 
           !['nom', 'xom', 'lom', 'gt', 'null', 'undefined', ''].includes(cleanItem);
  });
  
  return cleanArray.join(', ');
};

// Convert comma-separated string to array for database storage
export const stringToArray = (str: string): string[] => {
  if (!str || typeof str !== 'string' || str.trim() === '') {
    return [];
  }
  return str
    .split(',')
    .map(item => item.trim())
    .filter(item => item !== '' && !['nom', 'xom', 'lom'].includes(item.toLowerCase()));
};

// Transform patient database object to form data
export const patientToFormData = (patient: Patient): PatientFormData => {
  console.log('🔧 patientToFormData input:', patient);
  console.log('🏥 Medical history:', patient.medicalHistory);
  console.log('💳 Insurance details:', patient.insuranceDetails);
  console.log('👥 Next of kin:', patient.nextOfKin);
  
  const formData = {
    // Personal Information
    firstName: patient.firstName || '',
    surname: patient.surname || '',
    idType: patient.idType || 'id_number',
    idNumber: patient.idNumber || '',
    dateOfBirth: patient.dateOfBirth || '',
    age: patient.age?.toString() || '',
    gender: (patient.sex === 'Male' ? 'male' : patient.sex === 'Female' ? 'female' : 'other') as 'male' | 'female' | 'other',
    
    // Contact Information
    contactNumber: patient.contactNumber || '',
    alternateNumber: patient.alternateNumber || '',
    email: patient.email || '',
    address: patient.address || '',
    city: patient.city || '',
    postalCode: patient.postalCode || '',
    
    // Emergency Contact
    emergencyContactName: patient.nextOfKin?.name || '',
    emergencyContactRelationship: patient.nextOfKin?.relationship || '',
    emergencyContactPhone: patient.nextOfKin?.phone || '',
    emergencyContactAlternatePhone: patient.nextOfKin?.alternatePhone || '',
    emergencyContactEmail: patient.nextOfKin?.email || '',
    
    // Medical Aid Information
    medicalAidProvider: patient.insuranceDetails?.fundName || '',
    medicalAidNumber: patient.insuranceDetails?.memberNumber || '',
    medicalAidPlan: patient.insuranceDetails?.plan || '',
    
    // Medical History
    allergies: arrayToString(patient.medicalHistory?.allergies),
    chronicConditions: arrayToString(patient.medicalHistory?.chronicConditions),
    currentMedications: arrayToString(patient.medicalHistory?.currentMedications),
    pastSurgeries: arrayToString(patient.medicalHistory?.pastSurgeries),
    familyHistory: patient.medicalHistory?.familyHistory || '',
    
    // Additional Information
    bloodType: patient.medicalHistory?.bloodType || '',
    height: formatHeightForForm(patient.medicalHistory?.height),
    weight: formatWeightForForm(patient.medicalHistory?.weight),
    smokingStatus: patient.medicalHistory?.smokingStatus || 'never',
    alcoholConsumption: patient.medicalHistory?.alcoholConsumption || 'never'
  };
  
  console.log('🔄 patientToFormData output:', formData);
  
  return formData;
};

// Validate and clean medical data
export const cleanMedicalData = (formData: PatientFormData): PatientFormData => {
  const cleaned = { ...formData };
  
  // Clean height - ensure it's a reasonable value
  if (cleaned.height) {
    const heightNum = parseFloat(cleaned.height);
    if (isNaN(heightNum) || heightNum < 30 || heightNum > 300) {
      cleaned.height = '';
    }
  }
  
  // Clean weight - ensure it's a reasonable value
  if (cleaned.weight) {
    const weightNum = parseFloat(cleaned.weight);
    if (isNaN(weightNum) || weightNum < 1 || weightNum > 500) {
      cleaned.weight = '';
    }
  }
  
  // Clean array fields
  cleaned.allergies = cleanArrayString(cleaned.allergies);
  cleaned.chronicConditions = cleanArrayString(cleaned.chronicConditions);
  cleaned.currentMedications = cleanArrayString(cleaned.currentMedications);
  cleaned.pastSurgeries = cleanArrayString(cleaned.pastSurgeries);
  
  return cleaned;
};

// Clean comma-separated string by removing malformed entries
const cleanArrayString = (str: string): string => {
  if (!str) return '';
  
  const items = str
    .split(',')
    .map(item => item.trim())
    .filter(item => 
      item !== '' && 
      !['nom', 'xom', 'lom', 'null', 'undefined'].includes(item.toLowerCase())
    );
  
  return items.join(', ');
};

// Transform form data to database format for patient creation/update
export const formDataToPatientData = (formData: PatientFormData) => {
  const cleaned = cleanMedicalData(formData);
  
  return {
    // Patient table data
    patient: {
      first_name: cleaned.firstName.trim(),
      surname: cleaned.surname.trim(),
      id_type: cleaned.idType,
      id_number: cleaned.idNumber.trim(),
      sex: cleaned.gender === 'male' ? 'Male' as const :
           cleaned.gender === 'female' ? 'Female' as const : 'Other' as const,
      date_of_birth: cleaned.dateOfBirth,
      age: parseInt(cleaned.age) || 0,
      contact_number: cleaned.contactNumber.trim(),
      alternate_number: cleaned.alternateNumber.trim() || null,
      email: cleaned.email.trim() || null,
      address: cleaned.address.trim(),
      city: cleaned.city.trim() || null,
      postal_code: cleaned.postalCode.trim() || null,
    },
    
    // Next of kin table data
    nextOfKin: {
      name: cleaned.emergencyContactName.trim(),
      relationship: cleaned.emergencyContactRelationship.trim(),
      phone: cleaned.emergencyContactPhone.trim(),
      alternate_phone: cleaned.emergencyContactAlternatePhone.trim() || null,
      email: cleaned.emergencyContactEmail.trim() || null,
    },
    
    // Medical history table data
    medicalHistory: {
      height: cleaned.height.trim() ? Number(cleaned.height) : null,
      weight: cleaned.weight.trim() ? Number(cleaned.weight) : null,
      blood_type: cleaned.bloodType.trim() || null,
      allergies: stringToArray(cleaned.allergies),
      chronic_conditions: stringToArray(cleaned.chronicConditions),
      current_medications: stringToArray(cleaned.currentMedications),
      past_surgeries: stringToArray(cleaned.pastSurgeries),
      family_history: cleaned.familyHistory.trim() || null,
      smoking_status: cleaned.smokingStatus,
      alcohol_consumption: cleaned.alcoholConsumption,
    },
    
    // Insurance details table data
    insuranceDetails: {
      fund_name: cleaned.medicalAidProvider.trim() || null,
      member_number: cleaned.medicalAidNumber.trim() || null,
      plan: cleaned.medicalAidPlan.trim() || null,
    }
  };
};

// Validate medical history data before saving
export const validateMedicalData = (data: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  // Validate height
  if (data.height !== null && (isNaN(data.height) || data.height < 30 || data.height > 300)) {
    errors.push('Height must be between 30 and 300 cm');
  }
  
  // Validate weight
  if (data.weight !== null && (isNaN(data.weight) || data.weight < 1 || data.weight > 500)) {
    errors.push('Weight must be between 1 and 500 kg');
  }
  
  // Validate arrays
  if (!Array.isArray(data.allergies)) {
    errors.push('Allergies must be an array');
  }
  
  if (!Array.isArray(data.chronic_conditions)) {
    errors.push('Chronic conditions must be an array');
  }
  
  if (!Array.isArray(data.current_medications)) {
    errors.push('Current medications must be an array');
  }
  
  if (!Array.isArray(data.past_surgeries)) {
    errors.push('Past surgeries must be an array');
  }
  
  // Validate enum values
  if (!['never', 'former', 'current'].includes(data.smoking_status)) {
    errors.push('Invalid smoking status');
  }
  
  if (!['never', 'occasional', 'moderate', 'heavy'].includes(data.alcohol_consumption)) {
    errors.push('Invalid alcohol consumption value');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Format medical data for display
export const formatMedicalDataForDisplay = (data: any) => {
  return {
    ...data,
    height: data.height ? `${data.height} cm` : 'Not recorded',
    weight: data.weight ? `${data.weight} kg` : 'Not recorded',
    allergies: data.allergies?.length > 0 ? data.allergies : ['None recorded'],
    chronic_conditions: data.chronic_conditions?.length > 0 ? data.chronic_conditions : ['None recorded'],
    current_medications: data.current_medications?.length > 0 ? data.current_medications : ['None recorded'],
    past_surgeries: data.past_surgeries?.length > 0 ? data.past_surgeries : ['None recorded'],
    family_history: data.family_history || 'No family history recorded'
  };
};
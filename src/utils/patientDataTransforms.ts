import { Patient, PatientFormData } from '../types';

/**
 * Utility functions for transforming patient data between database and form formats
 */

// Format height for form display (filter out invalid default values)




// Transform patient database object to form data
export const patientToFormData = (patient: Patient): PatientFormData => {
  console.log('🔧 patientToFormData input:', patient);
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
    gender: (patient.sex === 'Male' ? 'male' : patient.sex === 'Female' ? 'female' : 'other') as
      | 'male'
      | 'female'
      | 'other',

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

    // Payment & Medical Aid Information
    paymentMethod: patient.paymentMethod || 'cash',
    medicalAidProvider: patient.insuranceDetails?.fundName || '',
    medicalAidNumber: patient.insuranceDetails?.memberNumber || '',
    medicalAidPlan: patient.insuranceDetails?.plan || '',
    dependentType: patient.insuranceDetails?.dependentType || '',


  };

  console.log('🔄 patientToFormData output:', formData);

  return formData;
};

// Validate and clean medical data
export const cleanMedicalData = (formData: PatientFormData): PatientFormData => {
  const cleaned = { ...formData };
  return cleaned;
};

// Clean comma-separated string by removing malformed entries


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
      sex:
        cleaned.gender === 'male'
          ? ('Male' as const)
          : cleaned.gender === 'female'
            ? ('Female' as const)
            : ('Other' as const),
      date_of_birth: cleaned.dateOfBirth,
      age: parseInt(cleaned.age) || 0,
      contact_number: cleaned.contactNumber.trim(),
      alternate_number: cleaned.alternateNumber.trim() || null,
      email: cleaned.email.trim() || null,
      address: cleaned.address.trim(),
      city: cleaned.city.trim() || null,
      postal_code: cleaned.postalCode.trim() || null,
      payment_method: cleaned.paymentMethod,
    },

    // Next of kin table data
    nextOfKin: {
      name: cleaned.emergencyContactName.trim(),
      relationship: cleaned.emergencyContactRelationship.trim(),
      phone: cleaned.emergencyContactPhone.trim(),
      alternate_phone: cleaned.emergencyContactAlternatePhone.trim() || null,
      email: cleaned.emergencyContactEmail.trim() || null,
    },



    // Insurance details table data
    insuranceDetails: {
      fund_name: cleaned.medicalAidProvider.trim() || null,
      member_number: cleaned.medicalAidNumber.trim() || null,
      plan: cleaned.medicalAidPlan.trim() || null,
    },
  };
};



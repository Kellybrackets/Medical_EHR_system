/**
 * Debug utilities to help diagnose patient data loading issues
 */

import { Patient } from '../types';

export const debugPatientData = (patient: Patient, context: string = '') => {
  console.group(`🔍 Debug Patient Data - ${context}`);
  
  console.log('Patient Basic Info:', {
    id: patient.id,
    name: `${patient.firstName} ${patient.surname}`,
    idNumber: patient.idNumber
  });
  
  console.log('Insurance Details:', patient.insuranceDetails);
  console.log('Medical History:', patient.medicalHistory);
  console.log('Next of Kin:', patient.nextOfKin);
  
  // Specific medical data checks
  if (patient.medicalHistory) {
    console.log('Medical Data Analysis:', {
      height: {
        raw: patient.medicalHistory.height,
        type: typeof patient.medicalHistory.height,
        isValid: patient.medicalHistory.height && patient.medicalHistory.height > 30 && patient.medicalHistory.height < 300
      },
      weight: {
        raw: patient.medicalHistory.weight,
        type: typeof patient.medicalHistory.weight,
        isValid: patient.medicalHistory.weight && patient.medicalHistory.weight > 1 && patient.medicalHistory.weight < 500
      },
      allergies: {
        raw: patient.medicalHistory.allergies,
        type: typeof patient.medicalHistory.allergies,
        isArray: Array.isArray(patient.medicalHistory.allergies),
        length: patient.medicalHistory.allergies?.length || 0,
        hasData: patient.medicalHistory.allergies?.some(item => !['nom', 'xom', 'lom', ''].includes(item.toLowerCase()))
      },
      bloodType: {
        raw: patient.medicalHistory.bloodType,
        hasValue: Boolean(patient.medicalHistory.bloodType)
      }
    });
  }
  
  console.groupEnd();
};

export const debugFormData = (formData: any, context: string = '') => {
  console.group(`📝 Debug Form Data - ${context}`);
  
  console.log('Medical Aid Fields:', {
    provider: formData.medicalAidProvider,
    number: formData.medicalAidNumber,
    plan: formData.medicalAidPlan
  });
  
  console.log('Health Information:', {
    height: formData.height,
    weight: formData.weight,
    bloodType: formData.bloodType,
    smokingStatus: formData.smokingStatus,
    alcoholConsumption: formData.alcoholConsumption
  });
  
  console.log('Medical History:', {
    allergies: formData.allergies,
    chronicConditions: formData.chronicConditions,
    currentMedications: formData.currentMedications,
    pastSurgeries: formData.pastSurgeries,
    familyHistory: formData.familyHistory
  });
  
  console.groupEnd();
};

export const debugDatabaseQuery = async (patientId: string, supabase: any) => {
  console.group(`🗄️ Debug Database Query for Patient ${patientId}`);
  
  try {
    // Test the exact query being used
    const { data: patientData, error: patientError } = await supabase
      .from('patients')
      .select(`
        *,
        next_of_kin (*),
        medical_histories (*),
        insurance_details (*)
      `)
      .eq('id', patientId)
      .single();
    
    if (patientError) {
      console.error('Query Error:', patientError);
    } else {
      console.log('Raw Database Response:', patientData);
      
      // Check each related table
      console.log('Medical Histories Data:', patientData.medical_histories);
      console.log('Insurance Details Data:', patientData.insurance_details);
      console.log('Next of Kin Data:', patientData.next_of_kin);
    }
  } catch (error) {
    console.error('Database Query Failed:', error);
  }
  
  console.groupEnd();
};
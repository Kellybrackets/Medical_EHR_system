/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Debug utilities to help diagnose patient data loading issues
 */

import { Patient } from '../types';

export const debugPatientData = (patient: Patient, context: string = '') => {
  console.group(`🔍 Debug Patient Data - ${context}`);

  console.log('Patient Basic Info:', {
    id: patient.id,
    name: `${patient.firstName} ${patient.surname}`,
    idNumber: patient.idNumber,
  });

  console.log('Insurance Details:', patient.insuranceDetails);

  console.log('Next of Kin:', patient.nextOfKin);

  // Specific medical data checks

  console.groupEnd();
};

export const debugFormData = (formData: any, context: string = '') => {
  console.group(`📝 Debug Form Data - ${context}`);

  console.log('Medical Aid Fields:', {
    provider: formData.medicalAidProvider,
    number: formData.medicalAidNumber,
    plan: formData.medicalAidPlan,
  });

  console.groupEnd();
};

export const debugDatabaseQuery = async (patientId: string, supabase: any) => {
  console.group(`🗄️ Debug Database Query for Patient ${patientId}`);

  try {
    // Test the exact query being used
    const { data: patientData, error: patientError } = await supabase
      .from('patients')
      .select(
        `
        *,
        next_of_kin (*),
        insurance_details (*)
      `,
      )
      .eq('id', patientId)
      .single();

    if (patientError) {
      console.error('Query Error:', patientError);
    } else {
      console.log('Raw Database Response:', patientData);

      // Check each related table

      console.log('Insurance Details Data:', patientData.insurance_details);
      console.log('Next of Kin Data:', patientData.next_of_kin);
    }
  } catch (error) {
    console.error('Database Query Failed:', error);
  }

  console.groupEnd();
};

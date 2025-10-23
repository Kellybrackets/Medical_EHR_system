import { Patient } from '../types';

/**
 * Calculate BMI and category from height and weight
 */
export const calculateBMI = (height: number, weight: number) => {
  if (!height || !weight) return null;
  
  const heightInMeters = height / 100;
  const bmi = weight / (heightInMeters * heightInMeters);
  
  let category: string;
  let categoryColor: string;
  
  if (bmi < 18.5) {
    category = 'Underweight';
    categoryColor = 'text-blue-600 bg-blue-100';
  } else if (bmi < 25) {
    category = 'Normal';
    categoryColor = 'text-green-600 bg-green-100';
  } else if (bmi < 30) {
    category = 'Overweight';
    categoryColor = 'text-yellow-600 bg-yellow-100';
  } else {
    category = 'Obese';
    categoryColor = 'text-red-600 bg-red-100';
  }
  
  return {
    value: parseFloat(bmi.toFixed(1)),
    category,
    categoryColor
  };
};

/**
 * Generate patient summary for export
 */
export const generatePatientSummary = (patient: Patient) => {
  const bmi = patient.medicalHistory?.height && patient.medicalHistory?.weight 
    ? calculateBMI(patient.medicalHistory.height, patient.medicalHistory.weight)
    : null;

  return {
    // Demographics
    fullName: `${patient.firstName} ${patient.surname}`,
    idNumber: patient.idNumber,
    dateOfBirth: patient.dateOfBirth,
    age: patient.age,
    gender: patient.sex,
    
    // Contact Information
    phone: patient.contactNumber,
    email: patient.email || 'Not provided',
    address: patient.address,
    
    // Emergency Contact
    emergencyContact: {
      name: patient.nextOfKin?.name || 'Not provided',
      relationship: patient.nextOfKin?.relationship || 'Not provided',
      phone: patient.nextOfKin?.phone || 'Not provided'
    },
    
    // Medical Aid
    insurance: {
      provider: patient.insuranceDetails?.fundName || 'Not specified',
      memberNumber: patient.insuranceDetails?.memberNumber || 'Not specified',
      plan: patient.insuranceDetails?.plan || 'Not specified'
    },
    
    // Health Metrics
    healthMetrics: {
      height: patient.medicalHistory?.height ? `${patient.medicalHistory.height} cm` : 'Not recorded',
      weight: patient.medicalHistory?.weight ? `${patient.medicalHistory.weight} kg` : 'Not recorded',
      bmi: bmi ? `${bmi.value} (${bmi.category})` : 'Not calculated',
      bloodType: patient.medicalHistory?.bloodType || 'Unknown'
    },
    
    // Medical History
    medicalHistory: {
      allergies: patient.medicalHistory?.allergies || [],
      chronicConditions: patient.medicalHistory?.chronicConditions || [],
      currentMedications: patient.medicalHistory?.currentMedications || [],
      pastSurgeries: patient.medicalHistory?.pastSurgeries || [],
      familyHistory: patient.medicalHistory?.familyHistory || 'No family history recorded'
    }
  };
};

/**
 * Copy text to clipboard
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    // Fallback for older browsers
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return true;
    } catch (fallbackErr) {
      console.error('Failed to copy to clipboard:', fallbackErr);
      return false;
    }
  }
};

/**
 * Generate CSV data for patient export
 */
export const generatePatientCSV = (patient: Patient) => {
  const summary = generatePatientSummary(patient);
  
  const csvData = [
    ['Field', 'Value'],
    ['Full Name', summary.fullName],
    ['ID Number', summary.idNumber],
    ['Date of Birth', summary.dateOfBirth || 'Not provided'],
    ['Age', summary.age.toString()],
    ['Gender', summary.gender],
    ['Phone', summary.phone],
    ['Email', summary.email],
    ['Address', summary.address],
    ['Emergency Contact Name', summary.emergencyContact.name],
    ['Emergency Contact Relationship', summary.emergencyContact.relationship],
    ['Emergency Contact Phone', summary.emergencyContact.phone],
    ['Insurance Provider', summary.insurance.provider],
    ['Insurance Member Number', summary.insurance.memberNumber],
    ['Insurance Plan', summary.insurance.plan],
    ['Height', summary.healthMetrics.height],
    ['Weight', summary.healthMetrics.weight],
    ['BMI', summary.healthMetrics.bmi],
    ['Blood Type', summary.healthMetrics.bloodType],
    ['Allergies', summary.medicalHistory.allergies.join('; ')],
    ['Chronic Conditions', summary.medicalHistory.chronicConditions.join('; ')],
    ['Current Medications', summary.medicalHistory.currentMedications.join('; ')],
    ['Past Surgeries', summary.medicalHistory.pastSurgeries.join('; ')],
    ['Family History', summary.medicalHistory.familyHistory]
  ];
  
  return csvData.map(row => row.map(field => `"${field}"`).join(',')).join('\n');
};

/**
 * Download file with given content
 */
export const downloadFile = (content: string, filename: string, type: string) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Format patient contact information for copying
 */
export const formatContactForCopy = (patient: Patient) => {
  return [
    `${patient.firstName} ${patient.surname}`,
    `Phone: ${patient.contactNumber}`,
    patient.email ? `Email: ${patient.email}` : '',
    `Address: ${patient.address}`,
    '',
    'Emergency Contact:',
    `Name: ${patient.nextOfKin?.name || 'Not provided'}`,
    `Relationship: ${patient.nextOfKin?.relationship || 'Not provided'}`,
    `Phone: ${patient.nextOfKin?.phone || 'Not provided'}`
  ].filter(Boolean).join('\n');
};
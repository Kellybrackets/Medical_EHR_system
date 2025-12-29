import { Patient } from '../types';
import { calculateAge } from './patientUtils';

export type DownloadPeriod = 'today' | 'week' | 'month' | 'year' | 'all';

/**
 * Filter patients based on the selected period.
 * It checks 'lastStatusChange' first (for activity), falling back to 'createdAt' (for registration).
 */
const filterPatientsByPeriod = (patients: Patient[], period: DownloadPeriod): Patient[] => {
  if (period === 'all') return patients;

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Calculate start dates for other periods
  const startOfWeek = new Date(startOfDay);
  startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay()); // Sunday as start of week

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  let cutoffDate: Date;

  switch (period) {
    case 'today':
      cutoffDate = startOfDay;
      break;
    case 'week':
      cutoffDate = startOfWeek;
      break;
    case 'month':
      cutoffDate = startOfMonth;
      break;
    case 'year':
      cutoffDate = startOfYear;
      break;
    default:
      return patients;
  }

  return patients.filter((patient) => {
    // Use lastStatusChange to capture any activity (check-in, consult, etc.)
    // Fallback to createdAt for new patients without status updates
    const activityDateStr = patient.lastStatusChange || patient.createdAt;
    if (!activityDateStr) return false;

    const activityDate = new Date(activityDateStr);
    return activityDate >= cutoffDate;
  });
};

/**
 * Convert patient data to CSV format and trigger download
 */
export const downloadPatientsCSV = (patients: Patient[], period: DownloadPeriod) => {
  const filteredPatients = filterPatientsByPeriod(patients, period);

  if (filteredPatients.length === 0) {
    return { success: false, message: 'No records found for the selected period.' };
  }

  // Define headers for the CSV
  const headers = [
    'First Name',
    'Surname',
    'ID Number',
    'Sex',
    'Age',
    'Contact Number',
    'Email',
    'Address',
    'Registration Date',
    'Last Activity',
    'Visit Type',
    'Payment Method',
    'Consultation Status',
  ];

  // Map patient data to rows
  const rows = filteredPatients.map((patient) => {
    // Escape fields that might contain commas
    const escape = (field: string | number | undefined) => {
      if (field === undefined || field === null) return '';
      const stringField = String(field);
      if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
        return `"${stringField.replace(/"/g, '""')}"`;
      }
      return stringField;
    };

    return [
      escape(patient.firstName),
      escape(patient.surname),
      escape(patient.idNumber),
      escape(patient.sex),
      escape(calculateAge(patient.dateOfBirth)),
      escape(patient.contactNumber),
      escape(patient.email),
      escape(patient.address),
      escape(new Date(patient.createdAt).toLocaleDateString()),
      escape(
        patient.lastStatusChange ? new Date(patient.lastStatusChange).toLocaleString() : 'N/A',
      ),
      escape(patient.visitType || 'N/A'),
      escape(patient.paymentMethod || 'cash'),
      escape(patient.consultationStatus || 'waiting'),
    ].join(',');
  });

  // Combine headers and rows
  const csvContent = [headers.join(','), ...rows].join('\n');

  // Create blob and trigger download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  // Create filename with timestamp
  const timestamp = new Date().toISOString().slice(0, 10);
  link.setAttribute('href', url);
  link.setAttribute('download', `patients_export_${period}_${timestamp}.csv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  return { success: true, count: filteredPatients.length };
};

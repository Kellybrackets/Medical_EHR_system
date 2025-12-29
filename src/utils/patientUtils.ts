import { Patient } from '../types';

/**
 * Calculate accurate age from date of birth
 */
export const calculateAge = (dateOfBirth: string): number => {
  if (!dateOfBirth) return 0;

  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return Math.max(0, age);
};

/**
 * Format phone number for display
 */
export const formatPhoneNumber = (phone: string): string => {
  if (!phone) return '';

  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');

  // Format as South African number if it looks like one
  if (digits.length === 10 && digits.startsWith('0')) {
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  }

  return phone;
};

/**
 * Get patient status based on creation date and last visit
 */
export const getPatientStatus = (
  patient: Patient,
  lastVisitDate?: string,
): 'new' | 'active' | 'follow-up' | 'inactive' => {
  const now = Date.now();
  const createdAt = new Date(patient.createdAt).getTime();
  const lastVisit = lastVisitDate ? new Date(lastVisitDate).getTime() : createdAt;

  // New patient if created within last 30 days
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
  if (createdAt > thirtyDaysAgo) {
    return 'new';
  }

  // Follow-up needed if last visit was more than 6 months ago
  const sixMonthsAgo = now - 6 * 30 * 24 * 60 * 60 * 1000;
  if (lastVisit < sixMonthsAgo) {
    return 'follow-up';
  }

  // Inactive if last visit was more than 1 year ago
  const oneYearAgo = now - 365 * 24 * 60 * 60 * 1000;
  if (lastVisit < oneYearAgo) {
    return 'inactive';
  }

  return 'active';
};

/**
 * Sort patients based on criteria
 */
export const sortPatients = (
  patients: Patient[],
  sortBy: 'name' | 'age' | 'lastVisit',
  sortOrder: 'asc' | 'desc',
): Patient[] => {
  return [...patients].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'name': {
        const nameA = `${a.firstName} ${a.surname}`.toLowerCase();
        const nameB = `${b.firstName} ${b.surname}`.toLowerCase();
        comparison = nameA.localeCompare(nameB);
        break;
      }

      case 'age': {
        const dateA = new Date(a.dateOfBirth).getTime();
        const dateB = new Date(b.dateOfBirth).getTime();
        return sortOrder === 'asc' ? dateB - dateA : dateA - dateB;
      }
      case 'lastVisit': {
        const dateA = new Date(a.lastStatusChange || a.createdAt).getTime();
        const dateB = new Date(b.lastStatusChange || b.createdAt).getTime();
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      }
    }

    return sortOrder === 'desc' ? -comparison : comparison;
  });
};

/**
 * Filter patients based on search term and filters
 */
export const filterPatients = (
  patients: Patient[],
  searchTerm: string,
  genderFilter: 'all' | 'Male' | 'Female',
  paymentFilter: 'all' | 'cash' | 'medical_aid' = 'all',
): Patient[] => {
  return patients.filter((patient) => {
    // Gender filter
    if (genderFilter !== 'all' && patient.sex !== genderFilter) {
      return false;
    }

    // Payment method filter
    if (paymentFilter !== 'all' && patient.paymentMethod !== paymentFilter) {
      return false;
    }

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const fullName = `${patient.firstName} ${patient.surname}`.toLowerCase();
      const idNumber = patient.idNumber.toLowerCase();
      const phone = patient.contactNumber.toLowerCase();

      return fullName.includes(search) || idNumber.includes(search) || phone.includes(search);
    }

    return true;
  });
};

/**
 * Format date for display with relative time
 */
export const formatDate = (date: string | Date): string => {
  if (!date) return 'Never';

  const d = new Date(date);
  const now = new Date();
  const diffTime = now.getTime() - d.getTime(); // Don't use Math.abs to know if date is in future
  const diffMinutes = Math.floor(diffTime / (1000 * 60));
  const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  // Handle future dates (shouldn't happen, but just in case)
  if (diffTime < 0) {
    return d.toLocaleDateString();
  }

  // Just now (less than 5 minutes ago)
  if (diffMinutes < 5) return 'Just now';

  // Minutes ago
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;

  // Hours ago (same day)
  if (diffHours < 24 && diffDays === 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;

  // Yesterday
  if (diffDays === 1) return 'Yesterday';

  // Days ago (less than a week)
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

  // Weeks ago (less than a month)
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  }

  // Months ago (less than a year)
  if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `${months} month${months > 1 ? 's' : ''} ago`;
  }

  // Over a year ago - show actual date
  return d.toLocaleDateString();
};

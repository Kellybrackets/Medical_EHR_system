// Date utilities
export const formatDate = (dateString: string, format: 'short' | 'long' = 'short'): string => {
  try {
    const date = new Date(dateString);
    if (format === 'long') {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return dateString;
  }
};

export const calculateAge = (dateOfBirth: string): number => {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

// String utilities
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const normalizeSearchTerm = (term: string): string => {
  return term.toLowerCase().trim();
};

// CSS utilities
export const cn = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(' ');
};

// Validation utilities
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): boolean => {
  return password.length >= 6;
};

export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,15}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

export const validateIdNumber = (idNumber: string): boolean => {
  // South African ID number validation (13 digits)
  const idRegex = /^\d{13}$/;
  return idRegex.test(idNumber);
};

export const validatePassportNumber = (passportNumber: string): boolean => {
  // Passport number validation (alphanumeric, 6-20 characters)
  // Supports most international passport formats
  const passportRegex = /^[A-Z0-9]{6,20}$/i;
  return passportRegex.test(passportNumber.replace(/\s/g, ''));
};

export const validateIdentification = (idType: 'id_number' | 'passport', value: string): boolean => {
  if (idType === 'id_number') {
    return validateIdNumber(value);
  } else {
    return validatePassportNumber(value);
  }
};

// Enhanced validation utilities for patient forms
export const validateHeight = (height: string): boolean => {
  const heightNum = Number(height);
  return !isNaN(heightNum) && heightNum >= 30 && heightNum <= 300;
};

export const validateWeight = (weight: string): boolean => {
  const weightNum = Number(weight);
  return !isNaN(weightNum) && weightNum >= 1 && weightNum <= 500;
};

export const validatePostalCode = (postalCode: string): boolean => {
  // South African postal code validation (4 digits)
  const postalRegex = /^\d{4}$/;
  return postalRegex.test(postalCode);
};

export const validateBloodType = (bloodType: string): boolean => {
  const validTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  return validTypes.includes(bloodType.toUpperCase());
};

export const sanitizeCommaSeparatedList = (input: string): string[] => {
  if (!input.trim()) return [];
  return input
    .split(',')
    .map(item => item.trim())
    .filter(item => item.length > 0);
};

export const formatCommaSeparatedList = (items: string[]): string => {
  return items.filter(item => item.trim().length > 0).join(', ');
};

// Form field validation with error messages
export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export const validateFormField = (
  field: string,
  value: string,
  required: boolean = false,
  idType?: 'id_number' | 'passport'
): ValidationResult => {
  if (required && !value.trim()) {
    return { isValid: false, error: `${field} is required` };
  }

  if (!value.trim()) {
    return { isValid: true }; // Optional field, empty is okay
  }

  switch (field.toLowerCase()) {
    case 'email':
      return validateEmail(value)
        ? { isValid: true }
        : { isValid: false, error: 'Please enter a valid email address' };

    case 'phone':
    case 'contactnumber':
    case 'alternatenumber':
    case 'emergencycontactphone':
    case 'emergencycontactalternatephone':
      return validatePhone(value)
        ? { isValid: true }
        : { isValid: false, error: 'Please enter a valid phone number' };

    case 'idnumber':
      if (idType === 'passport') {
        return validatePassportNumber(value)
          ? { isValid: true }
          : { isValid: false, error: 'Please enter a valid passport number (6-20 alphanumeric characters)' };
      } else {
        return validateIdNumber(value)
          ? { isValid: true }
          : { isValid: false, error: 'Please enter a valid ID number (13 digits)' };
      }

    case 'height':
      return validateHeight(value)
        ? { isValid: true }
        : { isValid: false, error: 'Please enter a valid height (30-300 cm)' };

    case 'weight':
      return validateWeight(value)
        ? { isValid: true }
        : { isValid: false, error: 'Please enter a valid weight (1-500 kg)' };

    case 'postalcode':
      return validatePostalCode(value)
        ? { isValid: true }
        : { isValid: false, error: 'Please enter a valid postal code (4 digits)' };

    case 'bloodtype':
      return validateBloodType(value)
        ? { isValid: true }
        : { isValid: false, error: 'Please enter a valid blood type (A+, A-, B+, B-, AB+, AB-, O+, O-)' };

    default:
      return { isValid: true };
  }
};

// Performance utilities
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};
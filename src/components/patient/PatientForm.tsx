import React, { useState, useEffect, useCallback, memo } from 'react';
import { User, ArrowLeft, Save } from 'lucide-react';
import { AppLayout } from '../layout/AppLayout';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { usePatients } from '../../hooks/usePatients';
import { validateEmail, validatePhone, validateIdNumber } from '../../utils/helpers';
import { PatientFormContent } from './PatientFormContent';
import { PatientFormData } from '../../types';
import { patientToFormData } from '../../utils/patientDataTransforms';

interface PatientFormProps {
  patientId?: string;
  onBack: () => void;
  onSave: () => void;
}

// Import PatientFormData from types

const initialFormData: PatientFormData = {
  // Personal Information
  firstName: '',
  surname: '',
  idType: 'id_number',
  idNumber: '',
  dateOfBirth: '',
  age: '',
  gender: 'male',
  
  // Contact Information
  contactNumber: '',
  alternateNumber: '',
  email: '',
  address: '',
  city: '',
  postalCode: '',
  
  // Emergency Contact
  emergencyContactName: '',
  emergencyContactRelationship: '',
  emergencyContactPhone: '',
  emergencyContactAlternatePhone: '',
  emergencyContactEmail: '',
  
  // Medical Aid Information
  medicalAidProvider: '',
  medicalAidNumber: '',
  medicalAidPlan: '',
  
  // Medical History
  allergies: '',
  chronicConditions: '',
  currentMedications: '',
  pastSurgeries: '',
  familyHistory: '',
  
  // Additional Information
  bloodType: '',
  height: '',
  weight: '',
  smokingStatus: 'never',
  alcoholConsumption: 'never'
};

const PatientFormComponent: React.FC<PatientFormProps> = ({
  patientId,
  onBack,
  onSave
}) => {
  const [formData, setFormData] = useState<PatientFormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<PatientFormData>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const { patients, addPatient, updatePatient, getPatientById } = usePatients();
  const isEditing = Boolean(patientId);

  useEffect(() => {
    if (isEditing && patientId) {
      const loadPatientData = async () => {
        setLoading(true);
        
        try {
          console.log('🔍 Loading patient data for editing, patientId:', patientId);
          console.log('📋 Available patients:', patients.length);
          
          // First try to get patient from the loaded list
          let patient = patients.find(p => p.id === patientId);
          console.log('👤 Found patient in list:', !!patient);
          
          if (!patient) {
            console.log('🔄 Patient not in list, fetching by ID...');
            patient = await getPatientById(patientId) || undefined;
            console.log('📡 Fetched patient:', !!patient);
          }
          
          if (patient) {
            console.log('📝 Raw patient data:', patient);
            
            // Use the transformation utility to convert patient data to form data
            const transformedFormData = patientToFormData(patient);
            console.log('🔄 Transformed form data:', transformedFormData);
            
            setFormData(transformedFormData);
            console.log('✅ Form data set successfully');
          } else {
            console.error('❌ No patient data found for ID:', patientId);
          }
        } catch (error) {
          console.error('💥 Error loading patient data:', error);
        } finally {
          setLoading(false);
        }
      };
      
      loadPatientData();
    }
  }, [isEditing, patientId, patients, getPatientById]);

  const calculateAgeFromDOB = useCallback((dateOfBirth: string): string => {
    if (!dateOfBirth) return '';
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age.toString();
  }, []);

  const updateFormField = useCallback((field: keyof PatientFormData, value: string) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // Auto-calculate age when date of birth changes
      if (field === 'dateOfBirth' && value) {
        newData.age = calculateAgeFromDOB(value);
      }
      
      return newData;
    });
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [errors, calculateAgeFromDOB]);

  const validateForm = useCallback((): boolean => {
    const newErrors: Partial<PatientFormData> = {};

    // Personal Information
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.surname.trim()) {
      newErrors.surname = 'Surname is required';
    }

    if (!formData.idNumber.trim()) {
      newErrors.idNumber = formData.idType === 'passport' ? 'Passport number is required' : 'ID number is required';
    } else {
      // Validate based on ID type
      if (formData.idType === 'passport') {
        const passportRegex = /^[A-Z0-9]{6,20}$/i;
        if (!passportRegex.test(formData.idNumber.replace(/\s/g, ''))) {
          newErrors.idNumber = 'Please enter a valid passport number (6-20 alphanumeric characters)';
        }
      } else {
        if (!validateIdNumber(formData.idNumber)) {
          newErrors.idNumber = 'Please enter a valid ID number (13 digits)';
        }
      }

      // Check for duplicate ID number/passport (only for new patients)
      if (!isEditing && !newErrors.idNumber) {
        const existingPatient = patients.find(
          p => p.idNumber === formData.idNumber.trim() && p.idType === formData.idType
        );
        if (existingPatient) {
          newErrors.idNumber = formData.idType === 'passport'
            ? 'A patient with this passport number already exists'
            : 'A patient with this ID number already exists';
        }
      }
    }

    if (!formData.dateOfBirth.trim()) {
      newErrors.dateOfBirth = 'Date of birth is required';
    }

    // Contact Information
    if (!formData.contactNumber.trim()) {
      newErrors.contactNumber = 'Contact number is required';
    } else if (!validatePhone(formData.contactNumber)) {
      newErrors.contactNumber = 'Please enter a valid phone number';
    }

    if (formData.alternateNumber.trim() && !validatePhone(formData.alternateNumber)) {
      newErrors.alternateNumber = 'Please enter a valid phone number';
    }

    if (formData.email.trim() && !validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }

    // Emergency Contact
    if (!formData.emergencyContactName.trim()) {
      newErrors.emergencyContactName = 'Emergency contact name is required';
    }

    if (!formData.emergencyContactRelationship.trim()) {
      newErrors.emergencyContactRelationship = 'Relationship is required';
    }

    if (!formData.emergencyContactPhone.trim()) {
      newErrors.emergencyContactPhone = 'Emergency contact phone is required';
    } else if (!validatePhone(formData.emergencyContactPhone)) {
      newErrors.emergencyContactPhone = 'Please enter a valid phone number';
    }

    if (formData.emergencyContactAlternatePhone.trim() && !validatePhone(formData.emergencyContactAlternatePhone)) {
      newErrors.emergencyContactAlternatePhone = 'Please enter a valid phone number';
    }

    if (formData.emergencyContactEmail.trim() && !validateEmail(formData.emergencyContactEmail)) {
      newErrors.emergencyContactEmail = 'Please enter a valid email address';
    }

    // Validate height and weight if provided
    if (formData.height.trim() && (isNaN(Number(formData.height)) || Number(formData.height) < 30 || Number(formData.height) > 300)) {
      newErrors.height = 'Please enter a valid height (30-300 cm)';
    }

    if (formData.weight.trim() && (isNaN(Number(formData.weight)) || Number(formData.weight) < 1 || Number(formData.weight) > 500)) {
      newErrors.weight = 'Please enter a valid weight (1-500 kg)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSaving(true);

    try {
      let result;
      if (isEditing && patientId) {
        result = await updatePatient(patientId, formData);
      } else {
        result = await addPatient(formData);
      }

      if (result.success) {
        onSave();
      } else {
        // Handle field-specific errors
        if (result.field && result.field in formData) {
          setErrors({ [result.field]: result.error || 'Failed to save patient' });
        } else {
          setErrors({ firstName: result.error || 'Failed to save patient' });
        }
      }
    } catch (error) {
      setErrors({ firstName: 'An unexpected error occurred' });
    }

    setSaving(false);
  }, [formData, validateForm, isEditing, patientId, addPatient, updatePatient, onSave]);

  if (loading) {
    return (
      <AppLayout title={isEditing ? 'Edit Patient' : 'Add New Patient'}>
        <LoadingSpinner size="lg" text="Loading patient data..." />
      </AppLayout>
    );
  }

  return (
    <AppLayout title={isEditing ? 'Edit Patient' : 'Add New Patient'}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Button
            variant="secondary"
            onClick={onBack}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center space-x-2">
            <User className="h-5 w-5 text-gray-400" />
            <h2 className="text-lg font-medium text-gray-900">
              {isEditing ? 'Edit Patient Information' : 'Patient Registration'}
            </h2>
          </div>
        </div>

        {/* Form */}
        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            <PatientFormContent
              formData={formData}
              errors={errors}
              updateFormField={updateFormField}
            />

            {/* Form Actions */}
            <div className="flex flex-col sm:flex-row sm:justify-end gap-3 pt-6 border-t border-gray-200">
              <Button
                type="button"
                variant="secondary"
                onClick={onBack}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={saving}
                className="sm:w-auto"
              >
                <Save className="h-4 w-4 mr-2" />
                {isEditing ? 'Update Patient' : 'Save Patient'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </AppLayout>
  );
};

export const PatientForm = memo(PatientFormComponent);
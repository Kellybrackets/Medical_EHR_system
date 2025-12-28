import React, { useEffect, useCallback, memo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { User, ArrowLeft, Save } from 'lucide-react';
import { AppLayout } from '../layout/AppLayout';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { usePatients } from '../../hooks/usePatients';
import { PatientFormContent } from './PatientFormContent';
import { PatientFormData } from '../../types';
import { patientToFormData } from '../../utils/patientDataTransforms';
import { patientFormSchema, PatientFormSchema } from '../../lib/validators';

interface PatientFormProps {
  patientId?: string;
  onBack: () => void;
  onSave: () => void;
}

const PatientFormComponent: React.FC<PatientFormProps> = ({ patientId, onBack, onSave }) => {
  const { addPatient, updatePatient, getPatientById, patients } = usePatients();
  const isEditing = Boolean(patientId);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    control,
    setValue,
    reset,
    setError,
    watch,
  } = useForm<PatientFormSchema>({
    resolver: zodResolver(patientFormSchema),
    defaultValues: {
      firstName: '',
      surname: '',
      idType: 'id_number',
      idNumber: '',
      dateOfBirth: '',
      age: '',
      gender: 'male',
      contactNumber: '',
      alternateNumber: '',
      email: '',
      address: '',
      city: '',
      postalCode: '',
      emergencyContactName: '',
      emergencyContactRelationship: '',
      emergencyContactPhone: '',
      emergencyContactAlternatePhone: '',
      emergencyContactEmail: '',
      paymentMethod: 'cash',
      medicalAidProvider: '',
      medicalAidNumber: '',
      medicalAidPlan: '',
      dependentType: '',
      allergies: '',
      chronicConditions: '',
      currentMedications: '',
      pastSurgeries: '',
      familyHistory: '',
      bloodType: '',
      height: '',
      weight: '',
      smokingStatus: 'never',
      alcoholConsumption: 'never',
    },
  });

  useEffect(() => {
    if (isEditing && patientId) {
      const loadPatientData = async () => {
        try {
          const patient = await getPatientById(patientId);
          if (patient) {
            const transformedFormData = patientToFormData(patient);
            reset(transformedFormData);
          }
        } catch (error) {
          console.error('Error loading patient data:', error);
        }
      };
      loadPatientData();
    }
  }, [isEditing, patientId, getPatientById, reset]);

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

  useEffect(() => {
    const subscription = watch((value, { name }) => {
      if (name === 'dateOfBirth' && value.dateOfBirth) {
        setValue('age', calculateAgeFromDOB(value.dateOfBirth));
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, setValue, calculateAgeFromDOB]);

  const onSubmit = async (data: PatientFormData) => {
    try {
      let result;
      if (isEditing && patientId) {
        result = await updatePatient(patientId, data);
      } else {
        // Check for duplicate ID number/passport before adding a new patient
        const existingPatient = patients.find(
          (p) => p.idNumber === data.idNumber.trim() && p.idType === data.idType,
        );
        if (existingPatient) {
          setError('idNumber', {
            type: 'manual',
            message:
              data.idType === 'passport'
                ? 'A patient with this passport number already exists'
                : 'A patient with this ID number already exists',
          });
          return;
        }
        result = await addPatient(data);
      }

      if (result.success) {
        onSave();
      } else {
        if (result.field && result.field in data) {
          setError(result.field as keyof PatientFormSchema, {
            type: 'manual',
            message: result.error,
          });
        } else {
          setError('firstName', {
            type: 'manual',
            message: result.error || 'Failed to save patient',
          });
        }
      }
    } catch (error) {
      setError('firstName', { type: 'manual', message: 'An unexpected error occurred' });
    }
  };

  if (isEditing && !control._formValues.idNumber) {
    return (
      <AppLayout title="Edit Patient">
        <LoadingSpinner size="lg" text="Loading patient data..." />
      </AppLayout>
    );
  }

  return (
    <AppLayout title={isEditing ? 'Edit Patient' : 'Add New Patient'}>
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="secondary" onClick={onBack}>
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
        <Card>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <PatientFormContent
              register={register}
              errors={errors}
              control={control}
              setValue={setValue}
            />
            <div className="flex flex-col sm:flex-row sm:justify-end gap-3 pt-6 border-t border-gray-200">
              <Button type="button" variant="secondary" onClick={onBack} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" loading={isSubmitting} className="sm:w-auto">
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

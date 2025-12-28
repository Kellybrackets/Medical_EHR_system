import React, { useState, useCallback, memo, useEffect } from 'react';
import { FileText, ArrowLeft, Save, Calendar } from 'lucide-react';
import { AppLayout } from '../layout/AppLayout';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { usePatients } from '../../hooks/usePatients';
import { useConsultationNotes } from '../../hooks/useConsultationNotes';
import { useAuthContext } from '../../contexts/AuthProvider';
import { formatDate } from '../../utils/helpers';
import { ClinicalNotesEditor } from './ClinicalNotesEditor';

interface ConsultationFormProps {
  patientId: string;
  consultationId?: string; // Optional - if provided, we're editing
  onBack: () => void;
  onSave: () => void;
}

interface ConsultationFormData {
  date: string;
  reasonForVisit: string;
  icd10Code: string;
  clinicalNotes: string;
}

const initialFormData: ConsultationFormData = {
  date: new Date().toISOString().split('T')[0],
  reasonForVisit: '',
  icd10Code: '',
  clinicalNotes: '',
};

const ConsultationFormComponent: React.FC<ConsultationFormProps> = ({
  patientId,
  consultationId,
  onBack,
  onSave,
}) => {
  const [formData, setFormData] = useState<ConsultationFormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<ConsultationFormData>>({});
  const [saving, setSaving] = useState(false);
  const [loadingConsultation, setLoadingConsultation] = useState(false);

  const { patients, loading: patientsLoading, completeConsultation, startConsultation } = usePatients();
  const { consultationNotes, addConsultationNote, updateConsultationNote } = useConsultationNotes();
  const { user } = useAuthContext();

  const patient = patients.find((p) => p.id === patientId);
  const isEditMode = !!consultationId;

  // Start consultation status when entering the form (only for new consultations)
  useEffect(() => {
    const initConsultation = async () => {
      if (!isEditMode && user?.id && patientId) {
        // We only start if it's not already in consultation (optimization happen likely in DB or check here)
        // But simply calling it ensures it updates.
        console.log('🏁 Starting consultation for patient:', patientId);
        await startConsultation(patientId, user.id);
      }
    };

    initConsultation();
  }, [isEditMode, patientId, user?.id, startConsultation]);

  // Load existing consultation data in edit mode
  useEffect(() => {
    if (isEditMode && consultationId) {
      setLoadingConsultation(true);
      const consultation = consultationNotes.find((c) => c.id === consultationId);

      if (consultation) {
        setFormData({
          date: consultation.date,
          reasonForVisit: consultation.reasonForVisit,
          icd10Code: consultation.icd10Code || '',
          clinicalNotes: consultation.clinicalNotes || '',
        });
      }
      setLoadingConsultation(false);
    }
  }, [isEditMode, consultationId, consultationNotes]);

  const updateFormField = useCallback(
    (field: keyof ConsultationFormData, value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }));

      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }));
      }
    },
    [errors],
  );

  const validateForm = useCallback((): boolean => {
    const newErrors: Partial<ConsultationFormData> = {};

    if (!formData.date.trim()) {
      newErrors.date = 'Date is required';
    }

    if (!formData.reasonForVisit.trim()) {
      newErrors.reasonForVisit = 'Reason for visit is required';
    }

    // Validate clinical notes (check if it's not empty or just whitespace/HTML tags)
    const strippedNotes = formData.clinicalNotes.replace(/<[^>]*>/g, '').trim();
    if (!strippedNotes) {
      newErrors.clinicalNotes = 'Clinical notes are required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      console.log('🔥 Form submitted!');
      console.log('📝 Form data:', formData);

      if (!validateForm()) {
        console.log('❌ Form validation failed');
        return;
      }

      console.log('✅ Form validation passed');
      setSaving(true);

      try {
        const consultationData = {
          patientId,
          date: formData.date,
          reasonForVisit: formData.reasonForVisit.trim(),
          icd10Code: formData.icd10Code.trim() || undefined,
          clinicalNotes: formData.clinicalNotes,
        };

        let result;
        if (isEditMode && consultationId) {
          console.log('📊 Updating consultation:', consultationId, consultationData);
          result = await updateConsultationNote(consultationId, consultationData);
        } else {
          console.log('📊 Creating new consultation:', consultationData);
          result = await addConsultationNote(consultationData);
        }

        console.log('📋 Result:', result);

        if (result.success) {
          console.log('🎉 Consultation saved successfully!');

          // Mark patient as served when consultation is completed
          if (user?.id && !isEditMode) {
            await completeConsultation(patientId, user.id);
          }

          onSave();
        } else {
          console.error('❌ Failed to save consultation:', result.error);
          setErrors({ reasonForVisit: result.error || 'Failed to save consultation' });
        }
      } catch (error) {
        console.error('💥 Exception during save:', error);
        setErrors({ reasonForVisit: 'An unexpected error occurred' });
      }

      console.log('🔄 Setting saving to false');
      setSaving(false);
    },
    [
      formData,
      validateForm,
      patientId,
      isEditMode,
      consultationId,
      addConsultationNote,
      updateConsultationNote,
      onSave,
      user,
      completeConsultation,
    ],
  );

  // Show loading spinner while patients data is being fetched
  if (patientsLoading || loadingConsultation) {
    return (
      <AppLayout title={isEditMode ? 'Edit Consultation' : 'Add Consultation'}>
        <LoadingSpinner
          size="lg"
          text={loadingConsultation ? 'Loading consultation...' : 'Loading patient information...'}
        />
      </AppLayout>
    );
  }

  // Only show "not found" if loading is complete and patient still doesn't exist
  if (!patient) {
    return (
      <AppLayout title={isEditMode ? 'Edit Consultation' : 'Add Consultation'}>
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Patient not found</h3>
          <p className="mt-1 text-sm text-gray-500">
            The patient you're trying to create a consultation for doesn't exist.
          </p>
          <div className="mt-6">
            <Button onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title={isEditMode ? 'Edit Consultation' : 'Add Consultation'}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Button variant="secondary" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-gray-400" />
            <div>
              <h2 className="text-lg font-medium text-gray-900">
                {isEditMode ? 'Edit Consultation' : 'New Consultation'}
              </h2>
              <p className="text-sm text-gray-500">
                {patient.firstName} {patient.surname} (ID: {patient.idNumber})
              </p>
            </div>
          </div>
        </div>

        {/* Patient Summary */}
        <Card>
          <Card.Header>
            <h3 className="text-lg font-medium text-gray-900">Patient Summary</h3>
          </Card.Header>
          <Card.Content>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Full Name</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {patient.firstName} {patient.surname}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Age</dt>
                <dd className="mt-1 text-sm text-gray-900">{patient.age}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Gender</dt>
                <dd className="mt-1 text-sm text-gray-900">{patient.sex}</dd>
              </div>

            </div>
          </Card.Content>
        </Card>

        {/* Consultation Form */}
        <Card>
          <Card.Header>
            <h3 className="text-lg font-medium text-gray-900">Consultation Details</h3>
          </Card.Header>
          <Card.Content>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Consultation Date"
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => updateFormField('date', e.target.value)}
                  error={errors.date}
                  icon={<Calendar className="h-4 w-4 text-gray-400" />}
                />
              </div>

              {/* Visit Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Reason for Visit"
                  type="text"
                  required
                  value={formData.reasonForVisit}
                  onChange={(e) => updateFormField('reasonForVisit', e.target.value)}
                  error={errors.reasonForVisit}
                  placeholder="e.g., Routine checkup, Follow-up, Symptoms..."
                />
                <Input
                  label="ICD-10 Code"
                  type="text"
                  value={formData.icd10Code}
                  onChange={(e) => updateFormField('icd10Code', e.target.value)}
                  error={errors.icd10Code}
                  placeholder="e.g., I10, E11.9, Z00.00 (optional)"
                />
              </div>

              {/* Clinical Notes Section */}
              <div className="border-t border-gray-200 pt-6">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Clinical Notes <span className="text-red-500">*</span>
                  </label>
                  <p className="text-xs text-gray-500 mb-3">
                    Document the consultation using the rich text editor below. Include chief
                    complaint, history, examination findings, assessment, and treatment plan.
                  </p>
                </div>
                <ClinicalNotesEditor
                  value={formData.clinicalNotes}
                  onChange={(html) => updateFormField('clinicalNotes', html)}
                  error={errors.clinicalNotes}
                  disabled={saving}
                />
              </div>

              {/* Form Actions */}
              <div className="flex flex-col sm:flex-row sm:justify-end gap-3 pt-6 border-t border-gray-200">
                <Button type="button" variant="secondary" onClick={onBack} disabled={saving}>
                  Cancel
                </Button>
                <Button type="submit" loading={saving} className="sm:w-auto">
                  <Save className="h-4 w-4 mr-2" />
                  {isEditMode ? 'Update Consultation' : 'Save Consultation'}
                </Button>
              </div>
            </form>
          </Card.Content>
        </Card>
      </div>
    </AppLayout>
  );
};

export const ConsultationForm = memo(ConsultationFormComponent);

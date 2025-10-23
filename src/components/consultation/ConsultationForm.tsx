import React, { useState, useCallback, memo } from 'react';
import { FileText, ArrowLeft, Save, Calendar } from 'lucide-react';
import { AppLayout } from '../layout/AppLayout';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { usePatients } from '../../hooks/usePatients';
import { useConsultationNotes } from '../../hooks/useConsultationNotes';
import { formatDate } from '../../utils/helpers';

interface ConsultationFormProps {
  patientId: string;
  onBack: () => void;
  onSave: () => void;
}

interface ConsultationFormData {
  date: string;
  reasonForVisit: string;
  icd10Code: string;
  soap: {
    subjective: string;
    objective: string;
    assessment: string;
    plan: string;
  };
}

const initialFormData: ConsultationFormData = {
  date: new Date().toISOString().split('T')[0],
  reasonForVisit: '',
  icd10Code: '',
  soap: {
    subjective: '',
    objective: '',
    assessment: '',
    plan: ''
  }
};

const ConsultationFormComponent: React.FC<ConsultationFormProps> = ({
  patientId,
  onBack,
  onSave
}) => {
  const [formData, setFormData] = useState<ConsultationFormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<ConsultationFormData>>({});
  const [saving, setSaving] = useState(false);
  
  const { patients } = usePatients();
  const { addConsultationNote } = useConsultationNotes();

  const patient = patients.find(p => p.id === patientId);

  const updateFormField = useCallback((field: keyof ConsultationFormData | string, value: string) => {
    setFormData(prev => {
      if (field.startsWith('soap.')) {
        const soapField = field.split('.')[1] as keyof typeof prev.soap;
        return {
          ...prev,
          soap: {
            ...prev.soap,
            [soapField]: value
          }
        };
      }
      return { ...prev, [field]: value };
    });
    
    if (errors[field as keyof ConsultationFormData]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);

  const validateForm = useCallback((): boolean => {
    const newErrors: Partial<ConsultationFormData> = {};

    if (!formData.date.trim()) {
      newErrors.date = 'Date is required';
    }

    if (!formData.reasonForVisit.trim()) {
      newErrors.reasonForVisit = 'Reason for visit is required';
    }

    if (!formData.soap.subjective.trim()) {
      newErrors.soap = { ...newErrors.soap, subjective: 'Subjective findings are required' };
    }

    if (!formData.soap.objective.trim()) {
      newErrors.soap = { ...newErrors.soap, objective: 'Objective findings are required' };
    }

    if (!formData.soap.assessment.trim()) {
      newErrors.soap = { ...newErrors.soap, assessment: 'Assessment is required' };
    }

    if (!formData.soap.plan.trim()) {
      newErrors.soap = { ...newErrors.soap, plan: 'Treatment plan is required' };
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
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
        soap: {
          subjective: formData.soap.subjective.trim(),
          objective: formData.soap.objective.trim(),
          assessment: formData.soap.assessment.trim(),
          plan: formData.soap.plan.trim()
        }
      };

      console.log('📊 Sending consultation data:', consultationData);
      const result = await addConsultationNote(consultationData);
      console.log('📋 Result from addConsultationNote:', result);

      if (result.success) {
        console.log('🎉 Consultation saved successfully!');
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
  }, [formData, validateForm, patientId, addConsultationNote, onSave]);

  if (!patient) {
    return (
      <AppLayout title="Add Consultation">
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
    <AppLayout title="Add Consultation">
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
            <FileText className="h-5 w-5 text-gray-400" />
            <div>
              <h2 className="text-lg font-medium text-gray-900">New Consultation</h2>
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
              {(patient.medicalHistory?.allergies?.length > 0 || 
                patient.medicalHistory?.chronicConditions?.length > 0 || 
                patient.medicalHistory?.pastDiagnoses?.length > 0) && (
                <div className="md:col-span-3">
                  <dt className="text-sm font-medium text-gray-500">Medical History</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {patient.medicalHistory.allergies?.length > 0 && (
                      <div><strong>Allergies:</strong> {patient.medicalHistory.allergies.join(', ')}</div>
                    )}
                    {patient.medicalHistory.chronicConditions?.length > 0 && (
                      <div><strong>Chronic Conditions:</strong> {patient.medicalHistory.chronicConditions.join(', ')}</div>
                    )}
                    {patient.medicalHistory.pastDiagnoses?.length > 0 && (
                      <div><strong>Past Diagnoses:</strong> {patient.medicalHistory.pastDiagnoses.join(', ')}</div>
                    )}
                  </dd>
                </div>
              )}
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

              {/* SOAP Notes Section */}
              <div className="border-t border-gray-200 pt-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4">SOAP Notes</h4>
                <div className="space-y-6">
                  {/* Subjective */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <span className="text-blue-600 font-semibold">S</span>ubjective <span className="text-red-500">*</span>
                    </label>
                    <p className="text-xs text-gray-500 mb-2">Patient's history, symptoms, and concerns in their own words</p>
                    <textarea
                      required
                      value={formData.soap.subjective}
                      onChange={(e) => updateFormField('soap.subjective', e.target.value)}
                      placeholder="Patient reports... Chief complaint... History of present illness... Patient states..."
                      rows={4}
                      className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    {errors.soap?.subjective && (
                      <p className="mt-1 text-sm text-red-600">{errors.soap.subjective}</p>
                    )}
                  </div>

                  {/* Objective */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <span className="text-green-600 font-semibold">O</span>bjective <span className="text-red-500">*</span>
                    </label>
                    <p className="text-xs text-gray-500 mb-2">Observable, measurable data from physical examination and tests</p>
                    <textarea
                      required
                      value={formData.soap.objective}
                      onChange={(e) => updateFormField('soap.objective', e.target.value)}
                      placeholder="Vital signs... Physical examination findings... Lab results... Appearance..."
                      rows={4}
                      className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    {errors.soap?.objective && (
                      <p className="mt-1 text-sm text-red-600">{errors.soap.objective}</p>
                    )}
                  </div>

                  {/* Assessment */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <span className="text-orange-600 font-semibold">A</span>ssessment <span className="text-red-500">*</span>
                    </label>
                    <p className="text-xs text-gray-500 mb-2">Clinical judgment, diagnosis, and interpretation of findings</p>
                    <textarea
                      required
                      value={formData.soap.assessment}
                      onChange={(e) => updateFormField('soap.assessment', e.target.value)}
                      placeholder="Primary diagnosis... Differential diagnoses... Clinical impression... Prognosis..."
                      rows={3}
                      className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    {errors.soap?.assessment && (
                      <p className="mt-1 text-sm text-red-600">{errors.soap.assessment}</p>
                    )}
                  </div>

                  {/* Plan */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <span className="text-purple-600 font-semibold">P</span>lan <span className="text-red-500">*</span>
                    </label>
                    <p className="text-xs text-gray-500 mb-2">Treatment plan, medications, follow-up instructions, and next steps</p>
                    <textarea
                      required
                      value={formData.soap.plan}
                      onChange={(e) => updateFormField('soap.plan', e.target.value)}
                      placeholder="Medications prescribed... Treatment recommendations... Follow-up appointments... Patient education... Monitoring plans..."
                      rows={4}
                      className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    {errors.soap?.plan && (
                      <p className="mt-1 text-sm text-red-600">{errors.soap.plan}</p>
                    )}
                  </div>
                </div>
              </div>

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
                  Save Consultation
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
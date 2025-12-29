import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { User, ArrowLeft } from 'lucide-react';
import { AppLayout } from '../layout/AppLayout';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { PatientHeader } from './PatientHeader';
import { ContactInfoCard, MedicalAidCard } from './PatientSectionCards';
import { ConsultationHistory } from './ConsultationHistory';
import { useToast } from '../ui/Toast';
import { usePatients } from '../../hooks/usePatients';
import { useAuthContext } from '../../contexts/AuthProvider';
import { exportPatientToPDF } from '../../utils/pdfExport';
import { Patient } from '../../types';

interface PatientViewProps {
  patientId: string;
  onBack: () => void;
  onEditPatient: (patientId: string) => void;
  onAddConsultation: (patientId: string) => void;
  onEditConsultation: (patientId: string, consultationId: string) => void;
  onEditSection?: (patientId: string, section: string) => void;
}

const PatientViewComponent: React.FC<PatientViewProps> = ({
  patientId,
  onBack,
  onEditPatient,
  onAddConsultation,
  onEditConsultation,
  onEditSection,
}) => {
  const { getPatientById, loading: patientsLoading } = usePatients();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthContext();
  const { showToast, ToastContainer } = useToast();

  useEffect(() => {
    const fetchPatient = async () => {
      setLoading(true);
      const fetchedPatient = await getPatientById(patientId);
      setPatient(fetchedPatient);
      setLoading(false);
    };

    fetchPatient();
  }, [patientId, getPatientById]);

  const handleEditPatient = useCallback(() => {
    onEditPatient(patientId);
  }, [onEditPatient, patientId]);

  const handleAddConsultation = useCallback(() => {
    onAddConsultation(patientId);
  }, [onAddConsultation, patientId]);

  const handleEditConsultation = useCallback(
    (consultationId: string) => {
      onEditConsultation(patientId, consultationId);
    },
    [onEditConsultation, patientId],
  );

  const handleEditSection = useCallback(
    (section: string) => {
      if (onEditSection) {
        onEditSection(patientId, section);
      } else {
        onEditPatient(patientId);
      }
    },
    [onEditSection, onEditPatient, patientId],
  );

  const handleExportPDF = useCallback(() => {
    if (patient) {
      exportPatientToPDF(patient);
      showToast('Patient summary exported as PDF!', 'success');
    }
  }, [patient, showToast]);

  if (loading || patientsLoading) {
    return (
      <AppLayout title="Patient Details">
        <LoadingSpinner size="lg" text="Loading patient details..." />
      </AppLayout>
    );
  }

  if (!patient) {
    return (
      <AppLayout title="Patient Not Found">
        <div className="text-center py-12">
          <User className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Patient not found</h3>
          <p className="mt-1 text-sm text-gray-500">
            The patient you're looking for doesn't exist or has been removed.
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
    <>
      <AppLayout title={`${patient.firstName} ${patient.surname}`}>
        <div className="space-y-6">
          <div className="flex items-center">
            <Button variant="secondary" onClick={onBack} className="flex items-center">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Patients
            </Button>
          </div>

          <PatientHeader
            patient={patient}
            onEdit={user?.role === 'receptionist' ? handleEditPatient : undefined}
            onExportPDF={handleExportPDF}
            canEdit={user?.role === 'receptionist'}
            showToast={showToast}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            <ContactInfoCard
              patient={patient}
              onEdit={handleEditSection}
              canEdit={user?.role === 'receptionist'}
              showToast={showToast}
            />

            <MedicalAidCard
              patient={patient}
              onEdit={handleEditSection}
              canEdit={user?.role === 'receptionist'}
            />
          </div>

          <ConsultationHistory
            patientId={patientId}
            onAddConsultation={user?.role === 'doctor' ? handleAddConsultation : undefined}
            onEditConsultation={user?.role === 'doctor' ? handleEditConsultation : undefined}
            canAddConsultation={user?.role === 'doctor'}
            canEditConsultation={user?.role === 'doctor'}
          />
        </div>
      </AppLayout>

      <ToastContainer />
    </>
  );
};

export const PatientView = memo(PatientViewComponent);

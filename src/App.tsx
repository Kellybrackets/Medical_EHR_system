import React, { useState, useEffect } from 'react';
import { AuthProvider } from './contexts/AuthProvider';
import { useAuthContext } from './contexts/AuthProvider';
import { LoginForm } from './components/auth/LoginForm';
import { ResetPasswordForm } from './components/auth/ResetPasswordForm';
import { DoctorDashboard } from './components/dashboards/DoctorDashboard';
import { PatientView } from './components/patient/PatientView';
import { ConsultationForm } from './components/consultation/ConsultationForm';
import { ReceptionistDashboard } from './components/dashboards/ReceptionistDashboard';
import { AdminDashboard } from './components/dashboards/AdminDashboard';
import { PatientForm } from './components/patient/PatientForm';
import { LoadingSpinner } from './components/ui/LoadingSpinner';

type DoctorView = 'dashboard' | 'patient' | 'consultation';
type ReceptionistView = 'dashboard' | 'addPatient' | 'editPatient' | 'viewPatient';

function AppContent() {
  const { user, loading } = useAuthContext();
  const [isPasswordReset, setIsPasswordReset] = useState(false);

  // Check for password reset token in URL on mount
  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const type = hashParams.get('type');

    if (type === 'recovery') {
      setIsPasswordReset(true);
    }
  }, []);
  
  // Doctor state
  const [doctorView, setDoctorView] = useState<DoctorView>('dashboard');
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [editingConsultationId, setEditingConsultationId] = useState<string>('');

  // Receptionist state
  const [receptionistView, setReceptionistView] = useState<ReceptionistView>('dashboard');
  const [editingPatientId, setEditingPatientId] = useState<string>('');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading application..." />
      </div>
    );
  }

  // Show password reset form if reset token detected
  if (isPasswordReset) {
    return <ResetPasswordForm />;
  }

  if (!user) {
    return <LoginForm />;
  }

  // Doctor views
  if (user?.role === 'doctor') {
    if (doctorView === 'patient' && selectedPatientId) {
      return (
        <PatientView
          patientId={selectedPatientId}
          onBack={() => {
            setDoctorView('dashboard');
            setSelectedPatientId('');
          }}
          onEditPatient={() => {}} // Doctors can't edit patient info
          onAddConsultation={(patientId) => {
            setSelectedPatientId(patientId);
            setEditingConsultationId(''); // Clear editing ID for new consultation
            setDoctorView('consultation');
          }}
          onEditConsultation={(patientId, consultationId) => {
            setSelectedPatientId(patientId);
            setEditingConsultationId(consultationId);
            setDoctorView('consultation');
          }}
        />
      );
    }

    if (doctorView === 'consultation' && selectedPatientId) {
      return (
        <ConsultationForm
          patientId={selectedPatientId}
          consultationId={editingConsultationId || undefined}
          onBack={() => {
            setDoctorView('patient');
            setEditingConsultationId('');
          }}
          onSave={() => {
            setDoctorView('patient');
            setEditingConsultationId('');
          }}
        />
      );
    }

    return (
      <DoctorDashboard
        onViewPatient={(patientId) => {
          setSelectedPatientId(patientId);
          setDoctorView('patient');
        }}
      />
    );
  }

  // Admin view
  if (user?.role === 'admin') {
    return <AdminDashboard />;
  }

  // Receptionist views
  if (user?.role === 'receptionist') {
    if (receptionistView === 'addPatient') {
      return (
        <PatientForm
          onBack={() => setReceptionistView('dashboard')}
          onSave={() => {
            setReceptionistView('dashboard');
          }}
        />
      );
    }

    if (receptionistView === 'editPatient' && editingPatientId) {
      return (
        <PatientForm
          patientId={editingPatientId}
          onBack={() => {
            setReceptionistView('dashboard');
            setEditingPatientId('');
          }}
          onSave={() => {
            setReceptionistView('dashboard');
            setEditingPatientId('');
          }}
        />
      );
    }

    if (receptionistView === 'viewPatient' && selectedPatientId) {
      return (
        <PatientView
          patientId={selectedPatientId}
          onBack={() => {
            setReceptionistView('dashboard');
            setSelectedPatientId('');
          }}
          onEditPatient={(patientId) => {
            setEditingPatientId(patientId);
            setReceptionistView('editPatient');
          }}
          onAddConsultation={() => {}} // Receptionists can't add consultations
          onEditConsultation={() => {}} // Receptionists can't edit consultations
        />
      );
    }

    return (
      <ReceptionistDashboard
        onAddPatient={() => setReceptionistView('addPatient')}
        onEditPatient={(patientId) => {
          setEditingPatientId(patientId);
          setReceptionistView('editPatient');
        }}
        onViewPatient={(patientId) => {
          setSelectedPatientId(patientId);
          setReceptionistView('viewPatient');
        }}
      />
    );
  }

  return <div>Unknown role</div>;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
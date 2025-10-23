import React, { useState } from 'react';
import { AuthProvider } from './contexts/AuthProvider';
import { useAuthContext } from './contexts/AuthProvider';
import { LoginForm } from './components/auth/LoginForm';
import { DoctorDashboard } from './components/dashboards/DoctorDashboard';
import { PatientView } from './components/patient/PatientView';
import { ConsultationForm } from './components/consultation/ConsultationForm';
import { ReceptionistDashboard } from './components/dashboards/ReceptionistDashboard';
import { PatientForm } from './components/patient/PatientForm';
import { LoadingSpinner } from './components/ui/LoadingSpinner';

type DoctorView = 'dashboard' | 'patient' | 'consultation';
type ReceptionistView = 'dashboard' | 'addPatient' | 'editPatient' | 'viewPatient';

function AppContent() {
  const { user, loading } = useAuthContext();
  
  // Doctor state
  const [doctorView, setDoctorView] = useState<DoctorView>('dashboard');
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');

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
            setDoctorView('consultation');
          }}
        />
      );
    }

    if (doctorView === 'consultation' && selectedPatientId) {
      return (
        <ConsultationForm
          patientId={selectedPatientId}
          onBack={() => {
            setDoctorView('patient');
          }}
          onSave={() => {
            setDoctorView('patient');
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
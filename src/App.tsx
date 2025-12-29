import React from 'react';
import { Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuthContext } from './contexts/AuthProvider';
import { LoginForm } from './components/auth/LoginForm';
import { ResetPasswordForm } from './components/auth/ResetPasswordForm';
import { DoctorDashboard } from './components/dashboards/DoctorDashboard';
import { PatientView } from './components/patient/PatientView';
import { ConsultationForm } from './components/consultation/ConsultationForm';
import { ReceptionistDashboard } from './components/dashboards/ReceptionistDashboard';
import { AdminDashboard } from './components/dashboards/AdminDashboard';
import { PatientForm } from './components/patient/PatientForm';
import { LoadingSpinner } from './components/ui/LoadingSpinner';

import { ErrorBoundary } from './components/ui/ErrorBoundary';

const RoleBasedRedirect = () => {
  const { user } = useAuthContext();
  if (!user) return <Navigate to="/login" />;

  switch (user.role) {
    case 'admin':
      return <Navigate to="/admin" />;
    case 'doctor':
      return <Navigate to="/doctor" />;
    case 'receptionist':
      return <Navigate to="/receptionist" />;
    default:
      return <Navigate to="/login" />;
  }
};

const ProtectedRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { user, loading } = useAuthContext();
  const navigate = useNavigate();

  React.useEffect(() => {
    // Redirect to login if not authenticated and not loading
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading application..." />
      </div>
    );
  }

  // Render children if authenticated
  return user ? children : null;
};

// Simplified component wrappers to handle navigation hooks
const PatientViewWrapper = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthContext();

  const isDoctor = user?.role === 'doctor';
  const isReceptionist = user?.role === 'receptionist';

  return (
    <PatientView
      patientId={id!}
      onBack={() => navigate(-1)}
      onEditPatient={isReceptionist ? () => navigate(`/receptionist/patient/${id}/edit`) : () => {}}
      onAddConsultation={isDoctor ? () => navigate(`/doctor/patient/${id}/consultation`) : () => {}}
      onEditConsultation={
        isDoctor
          ? (patientId, consultationId) =>
              navigate(`/doctor/patient/${patientId}/consultation/${consultationId}`)
          : () => {}
      }
    />
  );
};

const PatientFormWrapper = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  return (
    <ErrorBoundary onReset={() => window.location.reload()}>
      <PatientForm patientId={id} onBack={() => navigate(-1)} onSave={() => navigate(-1)} />
    </ErrorBoundary>
  );
};

const ConsultationFormWrapper = () => {
  const { id, consultationId } = useParams<{ id: string; consultationId?: string }>();
  const navigate = useNavigate();
  return (
    <ConsultationForm
      patientId={id!}
      consultationId={consultationId}
      onBack={() => navigate(-1)}
      onSave={() => navigate(`/doctor/patient/${id}`, { replace: true })}
    />
  );
};

const DoctorDashboardWrapper = () => {
  const navigate = useNavigate();
  return (
    <DoctorDashboard
      onViewPatient={(patientId) => navigate(`/doctor/patient/${patientId}`)}
      onStartConsultation={(patientId) => navigate(`/doctor/patient/${patientId}/consultation`)}
    />
  );
};

const ReceptionistDashboardWrapper = () => {
  const navigate = useNavigate();
  return (
    <ReceptionistDashboard
      onAddPatient={() => navigate('/receptionist/patient/new')}
      onEditPatient={(patientId) => navigate(`/receptionist/patient/${patientId}/edit`)}
      onViewPatient={(patientId) => navigate(`/receptionist/patient/${patientId}`)}
    />
  );
};

function AppContent() {
  const { loading } = useAuthContext();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading application..." />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginForm />} />
      <Route path="/reset-password" element={<ResetPasswordForm />} />
      <Route path="/" element={<RoleBasedRedirect />} />

      {/* Protected Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      {/* Doctor Routes */}
      <Route
        path="/doctor"
        element={
          <ProtectedRoute>
            <DoctorDashboardWrapper />
          </ProtectedRoute>
        }
      />
      <Route
        path="/doctor/patient/:id"
        element={
          <ProtectedRoute>
            <PatientViewWrapper />
          </ProtectedRoute>
        }
      />
      <Route
        path="/doctor/patient/:id/consultation/:consultationId?"
        element={
          <ProtectedRoute>
            <ConsultationFormWrapper />
          </ProtectedRoute>
        }
      />

      {/* Receptionist Routes */}
      <Route
        path="/receptionist"
        element={
          <ProtectedRoute>
            <ReceptionistDashboardWrapper />
          </ProtectedRoute>
        }
      />
      <Route
        path="/receptionist/patient/new"
        element={
          <ProtectedRoute>
            <PatientFormWrapper />
          </ProtectedRoute>
        }
      />
      <Route
        path="/receptionist/patient/:id/edit"
        element={
          <ProtectedRoute>
            <PatientFormWrapper />
          </ProtectedRoute>
        }
      />
      <Route
        path="/receptionist/patient/:id"
        element={
          <ProtectedRoute>
            <PatientViewWrapper />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;

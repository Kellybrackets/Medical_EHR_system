import React, { useState, useMemo, memo, useEffect } from 'react';
import { Users, Stethoscope, Calendar, Eye, Heart } from 'lucide-react';
import { AppLayout } from '../layout/AppLayout';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { PatientAvatar } from '../ui/PatientAvatar';
import { PatientSearchFilter } from '../ui/PatientSearchFilter';
import { usePatients } from '../../hooks/usePatients';
import { useConsultationNotes } from '../../hooks/useConsultationNotes';
import {
  calculateAge,
  getPatientStatus,
  sortPatients,
  filterPatients,
  formatDate,
} from '../../utils/patientUtils';
import { useToast } from '../ui/Toast';

interface DoctorDashboardProps {
  onViewPatient: (patientId: string) => void;
  onStartConsultation?: (patientId: string) => void;
}

const DoctorDashboardComponent: React.FC<DoctorDashboardProps> = ({
  onViewPatient,
  onStartConsultation,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [genderFilter, setGenderFilter] = useState<'all' | 'Male' | 'Female'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'age' | 'lastVisit'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const {
    patients,
    loading: patientsLoading,
    newPatientAdded,
    clearNewPatientNotification,
  } = usePatients();
  const { consultationNotes, loading: notesLoading } = useConsultationNotes();
  const { showToast, ToastContainer } = useToast();

  // Show notification when a new patient is added
  useEffect(() => {
    if (newPatientAdded) {
      showToast(
        `New patient added: ${newPatientAdded.firstName} ${newPatientAdded.surname}`,
        'success',
      );
      clearNewPatientNotification();
    }
  }, [newPatientAdded, clearNewPatientNotification, showToast]);

  const processedPatients = useMemo(() => {
    // First filter patients
    const filtered = filterPatients(patients, searchTerm, genderFilter);

    // Then sort them
    return sortPatients(filtered, sortBy, sortOrder);
  }, [patients, searchTerm, genderFilter, sortBy, sortOrder]);

  // Group patients by consultation status for queue view
  const queuedPatients = useMemo(() => {
    const waiting = patients
      .filter((p) => p.consultationStatus === 'waiting')
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()); // FIFO

    const inConsultation = patients.filter((p) => p.consultationStatus === 'in_consultation');

    const today = new Date().toISOString().split('T')[0];
    const servedToday = patients
      .filter((p) => p.consultationStatus === 'served' && p.lastStatusChange?.startsWith(today))
      .sort(
        (a, b) => new Date(b.lastStatusChange!).getTime() - new Date(a.lastStatusChange!).getTime(),
      );

    return { waiting, inConsultation, servedToday };
  }, [patients]);

  const clearFilters = () => {
    setSearchTerm('');
    setGenderFilter('all');
    setSortBy('name');
    setSortOrder('asc');
  };

  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const thisWeek = new Date();
    thisWeek.setDate(thisWeek.getDate() - 7);

    // Create a set of valid patient IDs for efficient lookup
    const validPatientIds = new Set(patients.map((p) => p.id));

    // Filter notes to only include those for existing patients
    const validConsultationNotes = consultationNotes.filter((note) =>
      validPatientIds.has(note.patientId),
    );

    const todayConsultations = validConsultationNotes.filter((note) => note.date === today).length;
    const weekConsultations = validConsultationNotes.filter(
      (note) => new Date(note.date) >= thisWeek,
    ).length;

    const newPatients = patients.filter((p) => getPatientStatus(p) === 'new').length;
    const followUpNeeded = patients.filter((p) => getPatientStatus(p) === 'follow-up').length;

    return {
      totalPatients: patients.length,
      totalConsultations: validConsultationNotes.length,
      todayConsultations,
      weekConsultations,
      newPatients,
      followUpNeeded,
    };
  }, [patients, consultationNotes]);

  if (patientsLoading || notesLoading) {
    return (
      <AppLayout title="Doctor Dashboard">
        <LoadingSpinner size="lg" text="Loading dashboard..." />
      </AppLayout>
    );
  }

  return (
    <>
      <AppLayout title="Doctor Dashboard">
        <div className="space-y-6">
          {/* Enhanced Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
              <div className="flex items-center">
                <div className="flex items-center justify-center w-12 h-12 bg-blue-500 rounded-lg">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-blue-700">Total Patients</p>
                  <p className="text-2xl font-bold text-blue-900">{stats.totalPatients}</p>
                </div>
              </div>
            </Card>

            <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
              <div className="flex items-center">
                <div className="flex items-center justify-center w-12 h-12 bg-green-500 rounded-lg">
                  <Stethoscope className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-green-700">Total Consultations</p>
                  <p className="text-2xl font-bold text-green-900">{stats.totalConsultations}</p>
                </div>
              </div>
            </Card>

            <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
              <div className="flex items-center">
                <div className="flex items-center justify-center w-12 h-12 bg-orange-500 rounded-lg">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-orange-700">Today</p>
                  <p className="text-2xl font-bold text-orange-900">{stats.todayConsultations}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Patient Management */}
          <Card padding={false}>
            <Card.Header>
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Patient Consultations</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    View and manage patient consultations
                  </p>
                </div>
                {/* New Consultation button removed as per user request */}
              </div>

              {/* Search and Filter */}
              <div className="mt-6">
                <PatientSearchFilter
                  searchTerm={searchTerm}
                  onSearchChange={setSearchTerm}
                  genderFilter={genderFilter}
                  onGenderFilterChange={setGenderFilter}
                  sortBy={sortBy}
                  onSortChange={setSortBy}
                  sortOrder={sortOrder}
                  onSortOrderChange={setSortOrder}
                  totalResults={processedPatients.length}
                  onClearFilters={clearFilters}
                />
              </div>
            </Card.Header>

            <Card.Content>
              <div className="space-y-6">
                {/* Waiting Queue */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <Users className="h-5 w-5 text-yellow-600" />
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Waiting Queue</h3>
                        <p className="text-sm text-gray-600">
                          {queuedPatients.waiting.length} patient
                          {queuedPatients.waiting.length !== 1 ? 's' : ''} waiting
                        </p>
                      </div>
                    </div>
                  </div>

                  {queuedPatients.waiting.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                      No patients waiting
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {queuedPatients.waiting.map((patient, index) => (
                        <div
                          key={patient.id}
                          className={`
                          p-4 rounded-lg border-2 transition-all relative
                          ${index === 0 ? 'border-yellow-400 bg-yellow-50' : 'border-gray-200 bg-white'}
                        `}
                        >
                          {patient.visitType === 'follow_up' && (
                            <div className="absolute top-0 right-0 px-2 py-1 bg-orange-100 text-orange-800 text-xs font-bold rounded-bl-lg rounded-tr-lg border-b border-l border-orange-200">
                              FOLLOW UP
                            </div>
                          )}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              {index === 0 && (
                                <div className="flex items-center justify-center w-12 h-12 bg-yellow-500 text-white rounded-full text-xs font-bold shadow-sm shrink-0">
                                  NEXT
                                </div>
                              )}
                              <PatientAvatar
                                firstName={patient.firstName}
                                surname={patient.surname}
                                gender={patient.sex}
                                size="md"
                              />
                              <div>
                                <p className="font-semibold text-gray-900">
                                  {patient.firstName} {patient.surname}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {calculateAge(patient.dateOfBirth)} years • {patient.sex}
                                </p>
                                {patient.visitReason && (
                                  <p className="text-xs text-orange-600 font-medium mt-0.5">
                                    Reason: {patient.visitReason}
                                  </p>
                                )}
                                <p className="text-xs text-gray-500">
                                  Arrived: {formatDate(patient.createdAt)}
                                </p>
                                <div className="mt-1">
                                  {patient.paymentMethod === 'medical_aid' ? (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-medium text-xs">
                                      Medical Aid
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-100 text-gray-800 font-medium text-xs">
                                      Cash
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center space-x-2">
                              <Button
                                size="sm"
                                onClick={() => onViewPatient(patient.id)}
                                variant="secondary"
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                              {onStartConsultation && (
                                <Button
                                  size="sm"
                                  onClick={() => onStartConsultation(patient.id)}
                                  disabled={queuedPatients.inConsultation.length > 0}
                                >
                                  <Stethoscope className="h-4 w-4 mr-1" />
                                  Start
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* In Consultation */}
                {queuedPatients.inConsultation.length > 0 && (
                  <div className="border-2 border-green-400 bg-green-50 rounded-lg p-4">
                    <div className="flex items-center space-x-3 mb-4">
                      <Stethoscope className="h-5 w-5 text-green-600" />
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">In Consultation</h3>
                        <p className="text-sm text-gray-600">Current patient being served</p>
                      </div>
                    </div>

                    {queuedPatients.inConsultation.map((patient) => (
                      <div key={patient.id} className="p-4 bg-white rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <PatientAvatar
                              firstName={patient.firstName}
                              surname={patient.surname}
                              gender={patient.sex}
                              size="lg"
                            />
                            <div>
                              <p className="text-lg font-semibold text-gray-900">
                                {patient.firstName} {patient.surname}
                              </p>
                              <p className="text-sm text-gray-600">
                                {calculateAge(patient.dateOfBirth)} years • {patient.sex}
                              </p>
                              <p className="text-xs text-green-600 font-medium">
                                Started: {formatDate(patient.lastStatusChange || '')}
                              </p>
                            </div>
                          </div>

                          <Button size="sm" onClick={() => onViewPatient(patient.id)}>
                            <Eye className="h-4 w-4 mr-1" />
                            View Details
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Served Today */}
                {queuedPatients.servedToday.length > 0 && (
                  <div>
                    <div className="flex items-center space-x-3 mb-4">
                      <Heart className="h-5 w-5 text-blue-600" />
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Served Today</h3>
                        <p className="text-sm text-gray-600">
                          {queuedPatients.servedToday.length} patient
                          {queuedPatients.servedToday.length !== 1 ? 's' : ''} completed
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {queuedPatients.servedToday.slice(0, 5).map((patient) => (
                        <div
                          key={patient.id}
                          className="p-3 bg-gray-50 rounded flex items-center justify-between"
                        >
                          <div className="flex items-center space-x-3">
                            <PatientAvatar
                              firstName={patient.firstName}
                              surname={patient.surname}
                              gender={patient.sex}
                              size="sm"
                            />
                            <div>
                              <p className="font-medium text-gray-900">
                                {patient.firstName} {patient.surname}
                              </p>
                              <p className="text-xs text-gray-500">
                                Completed: {formatDate(patient.lastStatusChange || '')}
                              </p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => onViewPatient(patient.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card.Content>
          </Card>
        </div>
      </AppLayout>
      <ToastContainer />
    </>
  );
};

export const DoctorDashboard = memo(DoctorDashboardComponent);

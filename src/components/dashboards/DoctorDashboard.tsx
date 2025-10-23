import React, { useState, useMemo, memo } from 'react';
import { Users, Stethoscope, Calendar, Eye, Plus, Heart } from 'lucide-react';
import { AppLayout } from '../layout/AppLayout';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { PatientAvatar } from '../ui/PatientAvatar';
import { StatusBadge } from '../ui/StatusBadge';
import { PatientSearchFilter } from '../ui/PatientSearchFilter';
import { usePatients } from '../../hooks/usePatients';
import { useConsultationNotes } from '../../hooks/useConsultationNotes';
import { calculateAge, getPatientStatus, sortPatients, filterPatients, formatDate } from '../../utils/patientUtils';

interface DoctorDashboardProps {
  onViewPatient: (patientId: string) => void;
  onStartConsultation?: (patientId: string) => void;
}

const DoctorDashboardComponent: React.FC<DoctorDashboardProps> = ({ onViewPatient, onStartConsultation }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [genderFilter, setGenderFilter] = useState<'all' | 'Male' | 'Female'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'age' | 'lastVisit'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  const { patients, loading: patientsLoading } = usePatients();
  const { consultationNotes, loading: notesLoading } = useConsultationNotes();

  const processedPatients = useMemo(() => {
    // First filter patients
    const filtered = filterPatients(patients, searchTerm, genderFilter);
    
    // Then sort them
    return sortPatients(filtered, sortBy, sortOrder);
  }, [patients, searchTerm, genderFilter, sortBy, sortOrder]);

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
    
    const todayConsultations = consultationNotes.filter(note => note.date === today).length;
    const weekConsultations = consultationNotes.filter(note => 
      new Date(note.date) >= thisWeek
    ).length;
    
    const newPatients = patients.filter(p => getPatientStatus(p) === 'new').length;
    const followUpNeeded = patients.filter(p => getPatientStatus(p) === 'follow-up').length;
    const criticalPatients = patients.filter(p => {
      // Consider patients with chronic conditions or multiple medications as critical
      return (p.medicalHistory?.chronicConditions?.length || 0) > 0 || 
             (p.medicalHistory?.currentMedications?.length || 0) > 2;
    }).length;

    return {
      totalPatients: patients.length,
      totalConsultations: consultationNotes.length,
      todayConsultations,
      weekConsultations,
      newPatients,
      followUpNeeded,
      criticalPatients
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

          <Card className="bg-gradient-to-r from-red-50 to-red-100 border-red-200">
            <div className="flex items-center">
              <div className="flex items-center justify-center w-12 h-12 bg-red-500 rounded-lg">
                <Heart className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-red-700">Critical</p>
                <p className="text-2xl font-bold text-red-900">{stats.criticalPatients}</p>
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
                <p className="text-sm text-gray-600 mt-1">View and manage patient consultations</p>
              </div>
              {onStartConsultation && (
                <Button onClick={() => onStartConsultation('')} className="sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  New Consultation
                </Button>
              )}
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

          <Card.Content className="p-0">
            {processedPatients.length === 0 ? (
              <div className="p-8 text-center">
                <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Stethoscope className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm || genderFilter !== 'all' ? 'No patients found' : 'No patients available'}
                </h3>
                <p className="text-gray-600 mb-6 max-w-sm mx-auto">
                  {searchTerm || genderFilter !== 'all'
                    ? 'Try adjusting your search criteria or filters.' 
                    : 'Patients will appear here once they are registered in the system.'
                  }
                </p>
              </div>
            ) : (
              <div className="overflow-hidden">
                {/* Desktop Card Grid View */}
                <div className="hidden md:block">
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 p-6">
                    {processedPatients.map((patient) => {
                      const age = calculateAge(patient.dateOfBirth);
                      const status = getPatientStatus(patient);
                      const lastVisit = formatDate(patient.createdAt);
                      
                      return (
                        <Card key={patient.id} className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500">
                          <div className="flex items-start space-x-4">
                            <PatientAvatar
                              firstName={patient.firstName}
                              surname={patient.surname}
                              gender={patient.sex}
                              size="lg"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="text-sm font-semibold text-gray-900 truncate">
                                  {patient.firstName} {patient.surname}
                                </h4>
                                <StatusBadge status={status} lastVisit={patient.createdAt} />
                              </div>
                              
                              <div className="space-y-1 text-xs text-gray-600 mb-3">
                                <div>ID: {patient.idNumber}</div>
                                <div>{age} years old • {patient.sex}</div>
                                <div className="flex items-center">
                                  <Calendar className="h-3 w-3 mr-1" />
                                  Last visit: {lastVisit}
                                </div>
                                {(patient.medicalHistory?.chronicConditions?.length || 0) > 0 && (
                                  <div className="flex items-center text-red-600">
                                    <Heart className="h-3 w-3 mr-1" />
                                    Chronic conditions
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <Button
                                  size="sm"
                                  onClick={() => onViewPatient(patient.id)}
                                  className="flex-1"
                                >
                                  <Eye className="h-3 w-3 mr-1" />
                                  View Record
                                </Button>
                                {onStartConsultation && (
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => onStartConsultation(patient.id)}
                                    className="bg-green-50 hover:bg-green-100 text-green-700"
                                  >
                                    <Stethoscope className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>

                {/* Mobile List View */}
                <div className="md:hidden space-y-3 p-4">
                  {processedPatients.map((patient) => {
                    const age = calculateAge(patient.dateOfBirth);
                    const status = getPatientStatus(patient);
                    const lastVisit = formatDate(patient.createdAt);
                    
                    return (
                      <Card key={patient.id} className="hover:shadow-md transition-shadow duration-200">
                        <div className="flex items-center space-x-3">
                          <PatientAvatar
                            firstName={patient.firstName}
                            surname={patient.surname}
                            gender={patient.sex}
                            size="md"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="text-sm font-semibold text-gray-900 truncate">
                                {patient.firstName} {patient.surname}
                              </h4>
                              <StatusBadge status={status} lastVisit={patient.createdAt} />
                            </div>
                            
                            <div className="space-y-1 text-xs text-gray-600">
                              <div>ID: {patient.idNumber} • {age} years • {patient.sex}</div>
                              <div className="flex items-center">
                                <Calendar className="h-3 w-3 mr-1" />
                                Last visit: {lastVisit}
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2 mt-2">
                              <Button
                                size="sm"
                                onClick={() => onViewPatient(patient.id)}
                                className="flex-1"
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                View
                              </Button>
                              {onStartConsultation && (
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => onStartConsultation(patient.id)}
                                  className="bg-green-50 hover:bg-green-100 text-green-700"
                                >
                                  <Stethoscope className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}
          </Card.Content>
        </Card>

      </div>
    </AppLayout>
  );
};

export const DoctorDashboard = memo(DoctorDashboardComponent);
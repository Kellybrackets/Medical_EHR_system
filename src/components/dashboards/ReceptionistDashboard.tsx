import React, { useState, useMemo, memo } from 'react';
import { Users, UserPlus, Edit, Trash2, Eye, Phone, Calendar } from 'lucide-react';
import { AppLayout } from '../layout/AppLayout';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { PatientAvatar } from '../ui/PatientAvatar';
import { StatusBadge } from '../ui/StatusBadge';
import { PatientSearchFilter } from '../ui/PatientSearchFilter';
import { useToast } from '../ui/Toast';
import { usePatients } from '../../hooks/usePatients';
import { calculateAge, formatPhoneNumber, getPatientStatus, sortPatients, filterPatients, formatDate } from '../../utils/patientUtils';

interface ReceptionistDashboardProps {
  onAddPatient: () => void;
  onEditPatient: (patientId: string) => void;
  onViewPatient: (patientId: string) => void;
}

const ReceptionistDashboardComponent: React.FC<ReceptionistDashboardProps> = ({
  onAddPatient,
  onEditPatient,
  onViewPatient
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [genderFilter, setGenderFilter] = useState<'all' | 'Male' | 'Female'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'age' | 'lastVisit'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const { patients, loading, deletePatient } = usePatients();
  const { showToast, ToastContainer } = useToast();

  const processedPatients = useMemo(() => {
    // First filter patients
    const filtered = filterPatients(patients, searchTerm, genderFilter);
    
    // Then sort them
    return sortPatients(filtered, sortBy, sortOrder);
  }, [patients, searchTerm, genderFilter, sortBy, sortOrder]);

  const stats = useMemo(() => {
    const newPatients = patients.filter(p => getPatientStatus(p) === 'new').length;
    const followUpNeeded = patients.filter(p => getPatientStatus(p) === 'follow-up').length;
    
    return {
      totalPatients: patients.length,
      malePatients: patients.filter(p => p.sex === 'Male').length,
      femalePatients: patients.filter(p => p.sex === 'Female').length,
      newPatients,
      followUpNeeded
    };
  }, [patients]);

  const clearFilters = () => {
    setSearchTerm('');
    setGenderFilter('all');
    setSortBy('name');
    setSortOrder('asc');
  };

  const handleDeletePatient = async (patientId: string) => {
    const result = await deletePatient(patientId);
    if (result.success) {
      setDeleteConfirm(null);
      showToast('Patient deleted successfully', 'success');
    } else {
      showToast(result.error || 'Failed to delete patient. Please try again.', 'error');
    }
  };

  if (loading) {
    return (
      <AppLayout title="Receptionist Dashboard">
        <LoadingSpinner size="lg" text="Loading dashboard..." />
      </AppLayout>
    );
  }

  return (
    <>
    <AppLayout title="Receptionist Dashboard">
      <div className="space-y-6">
        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
                <UserPlus className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-green-700">New Patients</p>
                <p className="text-2xl font-bold text-green-900">{stats.newPatients}</p>
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
            <div className="flex items-center">
              <div className="flex items-center justify-center w-12 h-12 bg-orange-500 rounded-lg">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-orange-700">Follow-up</p>
                <p className="text-2xl font-bold text-orange-900">{stats.followUpNeeded}</p>
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-r from-cyan-50 to-cyan-100 border-cyan-200">
            <div className="flex items-center">
              <div className="flex items-center justify-center w-12 h-12 bg-cyan-500 rounded-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-cyan-700">Male</p>
                <p className="text-2xl font-bold text-cyan-900">{stats.malePatients}</p>
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-r from-pink-50 to-pink-100 border-pink-200">
            <div className="flex items-center">
              <div className="flex items-center justify-center w-12 h-12 bg-pink-500 rounded-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-pink-700">Female</p>
                <p className="text-2xl font-bold text-pink-900">{stats.femalePatients}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Patients Management */}
        <Card padding={false}>
          <Card.Header>
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Patient Management</h3>
                <p className="text-sm text-gray-600 mt-1">Manage patient records and information</p>
              </div>
              <Button onClick={onAddPatient} className="sm:w-auto">
                <UserPlus className="h-4 w-4 mr-2" />
                Add New Patient
              </Button>
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
                  <Users className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm || genderFilter !== 'all' ? 'No patients found' : 'No patients registered'}
                </h3>
                <p className="text-gray-600 mb-6 max-w-sm mx-auto">
                  {searchTerm || genderFilter !== 'all'
                    ? 'Try adjusting your search criteria or filters.' 
                    : 'Get started by registering your first patient in the system.'
                  }
                </p>
                {!searchTerm && genderFilter === 'all' && (
                  <Button onClick={onAddPatient} size="lg">
                    <UserPlus className="h-5 w-5 mr-2" />
                    Add First Patient
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-hidden">
                {/* Desktop Table View */}
                <div className="hidden md:block">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Patient
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Contact Info
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Age & Gender
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Registered
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {processedPatients.map((patient) => {
                        const age = calculateAge(patient.dateOfBirth);
                        const status = getPatientStatus(patient);
                        const registeredDate = formatDate(patient.createdAt);
                        
                        return (
                          <tr 
                            key={patient.id} 
                            className="hover:bg-blue-50 transition-colors duration-150 group"
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <PatientAvatar
                                  firstName={patient.firstName}
                                  surname={patient.surname}
                                  gender={patient.sex}
                                  size="md"
                                  className="mr-3"
                                />
                                <div>
                                  <div className="text-sm font-semibold text-gray-900">
                                    {patient.firstName} {patient.surname}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    ID: {patient.idNumber}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                <div className="flex items-center mb-1">
                                  <Phone className="h-3 w-3 text-gray-400 mr-1" />
                                  {formatPhoneNumber(patient.contactNumber)}
                                </div>
                                {patient.email && (
                                  <div className="text-xs text-gray-500">
                                    {patient.email}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                <div className="font-medium">{age} years old</div>
                                <div className="text-xs text-gray-500">{patient.sex}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <StatusBadge status={status} lastVisit={patient.createdAt} />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <div className="flex items-center">
                                <Calendar className="h-3 w-3 text-gray-400 mr-1" />
                                {registeredDate}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                {deleteConfirm === patient.id ? (
                                  <div className="flex items-center space-x-1 flex-nowrap">
                                    <Button
                                      size="sm"
                                      onClick={() => handleDeletePatient(patient.id)}
                                      className="bg-red-600 hover:bg-red-700 text-white whitespace-nowrap flex-shrink-0"
                                    >
                                      <span>Confirm</span>
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="secondary"
                                      onClick={() => setDeleteConfirm(null)}
                                      className="whitespace-nowrap flex-shrink-0"
                                    >
                                      <span>Cancel</span>
                                    </Button>
                                  </div>
                                ) : (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="secondary"
                                      onClick={() => onViewPatient(patient.id)}
                                      className="hover:bg-blue-100 whitespace-nowrap"
                                    >
                                      <Eye className="h-3 w-3 mr-1 flex-shrink-0" />
                                      <span>View</span>
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="secondary"
                                      onClick={() => onEditPatient(patient.id)}
                                      className="hover:bg-green-100 flex-shrink-0"
                                    >
                                      <Edit className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      onClick={() => setDeleteConfirm(patient.id)}
                                      className="bg-red-600 hover:bg-red-700 text-white flex-shrink-0"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-4 p-4">
                  {processedPatients.map((patient) => {
                    const age = calculateAge(patient.dateOfBirth);
                    const status = getPatientStatus(patient);
                    const lastVisit = formatDate(patient.createdAt);
                    
                    return (
                      <Card key={patient.id} className="hover:shadow-md transition-shadow duration-200">
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
                            
                            <div className="space-y-1 text-xs text-gray-600">
                              <div>ID: {patient.idNumber}</div>
                              <div>{age} years old • {patient.sex}</div>
                              <div className="flex items-center">
                                <Phone className="h-3 w-3 mr-1" />
                                {formatPhoneNumber(patient.contactNumber)}
                              </div>
                              <div className="flex items-center">
                                <Calendar className="h-3 w-3 mr-1" />
                                Last visit: {lastVisit}
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2 mt-3">
                              <Button
                                size="sm"
                                onClick={() => onViewPatient(patient.id)}
                                className="flex-1"
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                View
                              </Button>
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => onEditPatient(patient.id)}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              {deleteConfirm === patient.id ? (
                                <div className="flex space-x-1">
                                  <Button
                                    size="sm"
                                    onClick={() => handleDeletePatient(patient.id)}
                                    className="bg-red-600 hover:bg-red-700 text-white text-xs"
                                  >
                                    Confirm
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => setDeleteConfirm(null)}
                                    className="text-xs"
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              ) : (
                                <Button
                                  size="sm"
                                  onClick={() => setDeleteConfirm(patient.id)}
                                  className="bg-red-600 hover:bg-red-700 text-white"
                                >
                                  <Trash2 className="h-3 w-3" />
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
    <ToastContainer />
    </>
  );
};

export const ReceptionistDashboard = memo(ReceptionistDashboardComponent);
import React, { useState, useMemo } from 'react';
import {
    Users,
    UserPlus,
    Edit,
    Trash2,
    Eye,
    Phone,
    Calendar,
    Stethoscope,
    Heart,
    Clock,
    FileDown,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { PatientAvatar } from '../ui/PatientAvatar';
import { StatusBadge } from '../ui/StatusBadge';
import { PatientSearchFilter } from '../ui/PatientSearchFilter';
import { useToast } from '../ui/Toast';
import { usePatients } from '../../hooks/usePatients';
import {
    calculateAge,
    formatPhoneNumber,
    getPatientStatus,
    sortPatients,
    filterPatients,
    formatDate,
} from '../../utils/patientUtils';
import { downloadPatientsCSV, DownloadPeriod } from '../../utils/csvExport';
import { Modal } from '../ui/Modal';

interface ReceptionistOverviewProps {
    onAddPatient: () => void;
    onEditPatient: (patientId: string) => void;
    onViewPatient: (patientId: string) => void;
    onScheduleFollowUp?: (patientId: string) => void; // Deprecated but kept for interface compat if needed
}

export const ReceptionistOverview: React.FC<ReceptionistOverviewProps> = ({
    onAddPatient,
    onEditPatient,
    onViewPatient,
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [genderFilter, setGenderFilter] = useState<'all' | 'Male' | 'Female'>('all');
    const [paymentFilter, setPaymentFilter] = useState<'all' | 'cash' | 'medical_aid'>('all');
    const [sortBy, setSortBy] = useState<'name' | 'age' | 'lastVisit'>('name');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    // Follow-up Modal State
    const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
    const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
    const [followUpReason, setFollowUpReason] = useState('');
    const [downloadPeriod, setDownloadPeriod] = useState<DownloadPeriod>('today');

    const { patients, deletePatient, addToQueue } = usePatients();
    const { showToast } = useToast();

    const handleFollowUpClick = (patientId: string) => {
        setSelectedPatientId(patientId);
        setFollowUpReason('');
        setIsFollowUpModalOpen(true);
    };

    const confirmFollowUp = async () => {
        if (!selectedPatientId) return;

        const result = await addToQueue(selectedPatientId, 'follow_up', followUpReason);

        if (result.success) {
            showToast('Patient added to queue as Follow-up', 'success');
            setIsFollowUpModalOpen(false);
            setSelectedPatientId(null);
            setFollowUpReason('');
        } else {
            showToast(result.error || 'Failed to add patient to queue', 'error');
        }
    };

    const handleRegularCheckIn = async (patientId: string) => {
        const result = await addToQueue(patientId, 'regular');
        if (result.success) {
            showToast('Patient checked in successfully', 'success');
        } else {
            showToast(result.error || 'Failed to check in patient', 'error');
        }
    };

    const processedPatients = useMemo(() => {
        // First filter patients
        const filtered = filterPatients(patients, searchTerm, genderFilter, paymentFilter);

        // Then sort them
        return sortPatients(filtered, sortBy, sortOrder);
    }, [patients, searchTerm, genderFilter, paymentFilter, sortBy, sortOrder]);

    // Date Navigation State
    const [selectedDate, setSelectedDate] = useState(new Date());

    const isToday = (date: Date) => {
        const today = new Date();
        return (
            date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear()
        );
    };

    const handlePrevDay = () => {
        const newDate = new Date(selectedDate);
        newDate.setDate(selectedDate.getDate() - 1);
        setSelectedDate(newDate);
    };

    const handleNextDay = () => {
        const newDate = new Date(selectedDate);
        newDate.setDate(selectedDate.getDate() + 1);
        setSelectedDate(newDate);
    };

    const handleToday = () => {
        setSelectedDate(new Date());
    };

    // Helper to check if a date string matches selected date
    const isSameDate = React.useCallback(
        (dateStr: string | null | undefined) => {
            if (!dateStr) return false;
            const d = new Date(dateStr);
            return (
                d.getDate() === selectedDate.getDate() &&
                d.getMonth() === selectedDate.getMonth() &&
                d.getFullYear() === selectedDate.getFullYear()
            );
        },
        [selectedDate],
    );

    // Group patients by consultation status for queue view
    const queuedPatients = useMemo(() => {
        const waiting = patients
            .filter(
                (p) =>
                    p.consultationStatus === 'waiting' &&
                    (isSameDate(p.lastStatusChange) || isSameDate(p.createdAt)),
            )
            .sort(
                (a, b) =>
                    new Date(a.lastStatusChange || a.createdAt).getTime() -
                    new Date(b.lastStatusChange || b.createdAt).getTime(),
            );

        const inConsultation = patients.filter(
            (p) => p.consultationStatus === 'in_consultation' && isSameDate(p.lastStatusChange),
        );

        const servedToday = patients
            .filter((p) => p.consultationStatus === 'served' && isSameDate(p.lastStatusChange))
            .sort(
                (a, b) => new Date(b.lastStatusChange!).getTime() - new Date(a.lastStatusChange!).getTime(),
            );

        return { waiting, inConsultation, servedToday };
    }, [patients, selectedDate, isSameDate]);

    const stats = useMemo(() => {
        // Stats should probably reflect the SELECTED date now, or remain global?
        // User request: "history nav". Usually stats match the view.
        // Let's make stats reflect selected date for relevant metrics.

        const newPatients = patients.filter((p) => getPatientStatus(p) === 'new').length; // Total new (ever) or today? "New Patients" usually implies recent. Let's keep as is for now unless requested.

        // Update "Follow-ups Today" to "Follow-ups [Selected Date]"
        const followUps = patients.filter(
            (p) => p.visitType === 'follow_up' && isSameDate(p.lastStatusChange),
        ).length;

        return {
            totalPatients: patients.length,
            malePatients: patients.filter((p) => p.sex === 'Male').length,
            femalePatients: patients.filter((p) => p.sex === 'Female').length,
            newPatients,
            followUps,
            cashPatients: patients.filter((p) => p.paymentMethod === 'cash').length,
            medicalAidPatients: patients.filter((p) => p.paymentMethod === 'medical_aid').length,
        };
    }, [patients, selectedDate, isSameDate]);

    const clearFilters = () => {
        setSearchTerm('');
        setGenderFilter('all');
        setPaymentFilter('all');
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

    const handleDownloadCSV = () => {
        const result = downloadPatientsCSV(patients, downloadPeriod);
        if (result.success) {
            showToast(`Successfully downloaded ${result.count} patient records`, 'success');
        } else {
            showToast(result.message || 'Failed to download CSV', 'error');
        }
    };

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
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
                            <p className="text-sm font-medium text-orange-700">
                                {isToday(selectedDate) ? 'Follow-ups Today' : 'Follow-ups'}
                            </p>
                            <p className="text-2xl font-bold text-orange-900">{stats.followUps}</p>
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

            {/* Live Patient Queue - Full Width now */}
            <div className="space-y-6">
                <Card padding={false}>
                    <Card.Header>
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div>
                                <h3 className="text-lg font-medium text-gray-900">Live Patient Queue</h3>
                                <p className="text-sm text-gray-600 mt-1">
                                    Real-time view of patient flow and status
                                </p>
                            </div>

                            {/* Date Navigation */}
                            <div className="flex items-center bg-gray-50 rounded-lg p-1 border border-gray-200 shadow-sm">
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={handlePrevDay}
                                    className="border-none shadow-none bg-transparent hover:bg-gray-100 text-gray-500 hover:text-gray-700"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <div className="px-4 py-1 text-sm font-medium text-gray-900 min-w-[140px] text-center flex items-center justify-center gap-2">
                                    <Calendar className="h-4 w-4 text-gray-400" />
                                    {selectedDate.toLocaleDateString('en-US', {
                                        weekday: 'short',
                                        month: 'short',
                                        day: 'numeric',
                                    })}
                                    {isToday(selectedDate) && (
                                        <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">
                                            Today
                                        </span>
                                    )}
                                </div>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={handleNextDay}
                                    disabled={isToday(selectedDate)}
                                    className={`border-none shadow-none bg-transparent hover:bg-gray-100 text-gray-500 hover:text-gray-700 ${isToday(selectedDate) ? 'opacity-25 cursor-not-allowed' : ''}`}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                                {!isToday(selectedDate) && (
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={handleToday}
                                        className="ml-2 text-xs text-blue-600 hover:bg-blue-50 border-none shadow-none bg-transparent"
                                    >
                                        Jump to Today
                                    </Button>
                                )}
                            </div>
                        </div>
                    </Card.Header>
                    <Card.Content>
                        {!isToday(selectedDate) && (
                            <div className="mb-6 p-3 bg-blue-50 border border-blue-100 rounded-md flex items-center justify-center text-sm text-blue-700">
                                <Calendar className="h-4 w-4 mr-2" />
                                You are viewing history for {selectedDate.toLocaleDateString()}.
                                <button
                                    onClick={handleToday}
                                    className="ml-2 underline font-medium hover:text-blue-900"
                                >
                                    Return to Today
                                </button>
                            </div>
                        )}
                        <div className="grid grid-cols-1 gap-6">
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
                                                            <div className="flex items-center justify-center w-8 h-8 bg-yellow-500 text-white rounded-full text-sm font-bold shadow-sm">
                                                                1
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
                                                            <div className="mt-1 flex items-center gap-2">
                                                                <p className="text-xs text-gray-500">
                                                                    Check-in:{' '}
                                                                    {formatDate(patient.lastStatusChange || patient.createdAt)}
                                                                </p>
                                                                {patient.paymentMethod === 'medical_aid' ? (
                                                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-purple-100 text-purple-800 font-medium">
                                                                        Medical Aid
                                                                    </span>
                                                                ) : (
                                                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-gray-100 text-gray-800 font-medium">
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

                                                        <Button
                                                            size="sm"
                                                            onClick={() => onEditPatient(patient.id)}
                                                            variant="secondary"
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* In Consultation & Served */}
                            <div className="space-y-6">
                                {/* In Consultation */}
                                {queuedPatients.inConsultation.length > 0 && (
                                    <div className="border border-green-200 bg-green-50 rounded-lg p-4 shadow-sm">
                                        <div className="flex items-center space-x-3 mb-4">
                                            <Stethoscope className="h-5 w-5 text-green-600" />
                                            <div>
                                                <h3 className="text-lg font-semibold text-gray-900">In Consultation</h3>
                                                <p className="text-sm text-gray-600">Currently being served</p>
                                            </div>
                                        </div>

                                        {queuedPatients.inConsultation.map((patient) => (
                                            <div
                                                key={patient.id}
                                                className="p-4 bg-white rounded-lg border border-green-100 shadow-sm relative overflow-hidden"
                                            >
                                                <div className="absolute top-0 left-0 w-1 h-full bg-green-500"></div>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center space-x-3">
                                                        <PatientAvatar
                                                            firstName={patient.firstName}
                                                            surname={patient.surname}
                                                            gender={patient.sex}
                                                            size="lg"
                                                            className="border-2 border-green-200"
                                                        />
                                                        <div>
                                                            <p className="text-lg font-semibold text-gray-900">
                                                                {patient.firstName} {patient.surname}
                                                            </p>
                                                            {patient.visitType === 'follow_up' && (
                                                                <span className="text-xs font-bold text-orange-600 uppercase tracking-wide">
                                                                    Follow Up
                                                                </span>
                                                            )}
                                                            <p className="text-sm text-gray-600">
                                                                {calculateAge(patient.dateOfBirth)} years • {patient.sex}
                                                            </p>
                                                            <p className="text-xs text-green-600 font-medium flex items-center mt-1">
                                                                <Clock className="h-3 w-3 mr-1" />
                                                                Started: {formatDate(patient.lastStatusChange || '')}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Served Today */}
                                {queuedPatients.servedToday.length > 0 && (
                                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                        <div className="flex items-center space-x-3 mb-4">
                                            <Heart className="h-5 w-5 text-blue-600" />
                                            <div>
                                                <h3 className="text-lg font-semibold text-gray-900">
                                                    {isToday(selectedDate) ? 'Served Today' : 'Served History'}
                                                </h3>
                                                <p className="text-sm text-gray-600">
                                                    {queuedPatients.servedToday.length} completed
                                                </p>
                                            </div>
                                        </div>

                                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                                            {queuedPatients.servedToday.map((patient) => (
                                                <div
                                                    key={patient.id}
                                                    className="p-3 bg-white border border-gray-200 rounded-md flex items-center justify-between hover:bg-gray-50 transition-colors"
                                                >
                                                    <div className="flex items-center space-x-3">
                                                        <PatientAvatar
                                                            firstName={patient.firstName}
                                                            surname={patient.surname}
                                                            gender={patient.sex}
                                                            size="sm"
                                                            className="w-8 h-8 text-xs"
                                                        />
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-900">
                                                                {patient.firstName} {patient.surname}
                                                            </p>
                                                            <p className="text-[10px] text-gray-500">
                                                                Done: {formatDate(patient.lastStatusChange || '')}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Card.Content>
                </Card>
            </div>

            {/* Patients Management & Search */}
            <Card padding={false}>
                <Card.Header>
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div>
                            <h3 className="text-lg font-medium text-gray-900">Patient Management</h3>
                            <p className="text-sm text-gray-600 mt-1">Search and manage patient records</p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="flex items-center space-x-2 bg-gray-50 p-1 rounded-lg border border-gray-200">
                                <select
                                    value={downloadPeriod}
                                    onChange={(e) => setDownloadPeriod(e.target.value as DownloadPeriod)}
                                    className="block max-w-xs pl-3 pr-8 py-1.5 text-sm border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-white"
                                >
                                    <option value="today">Today</option>
                                    <option value="week">This Week</option>
                                    <option value="month">This Month</option>
                                    <option value="year">This Year</option>
                                    <option value="all">All Time</option>
                                </select>
                                <Button
                                    onClick={handleDownloadCSV}
                                    variant="secondary"
                                    size="sm"
                                    className="whitespace-nowrap"
                                >
                                    <FileDown className="h-4 w-4 mr-2" />
                                    Download CSV
                                </Button>
                            </div>
                            <Button onClick={onAddPatient} className="sm:w-auto">
                                <UserPlus className="h-4 w-4 mr-2" />
                                Add New Patient
                            </Button>
                        </div>
                    </div>

                    {/* Search and Filter */}
                    <div className="mt-6">
                        <PatientSearchFilter
                            searchTerm={searchTerm}
                            onSearchChange={setSearchTerm}
                            genderFilter={genderFilter}
                            onGenderFilterChange={setGenderFilter}
                            paymentFilter={paymentFilter}
                            onPaymentFilterChange={setPaymentFilter}
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
                                {searchTerm || genderFilter !== 'all'
                                    ? 'No patients found'
                                    : 'No patients registered'}
                            </h3>
                            <p className="text-gray-600 mb-6 max-w-sm mx-auto">
                                {searchTerm || genderFilter !== 'all'
                                    ? 'Try adjusting your search criteria or filters.'
                                    : 'Get started by registering your first patient in the system.'}
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
                            <div className="hidden md:block overflow-x-auto">
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
                                            const isQueued =
                                                patient.consultationStatus === 'waiting' ||
                                                patient.consultationStatus === 'in_consultation';

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
                                                                <div className="text-xs text-gray-500">ID: {patient.idNumber}</div>
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
                                                                <div className="text-xs text-gray-500">{patient.email}</div>
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
                                                        <div className="space-y-1">
                                                            <StatusBadge status={status} lastVisit={patient.createdAt} />

                                                            {/* Consultation Status */}
                                                            <div className="text-xs">
                                                                {patient.consultationStatus === 'in_consultation' ? (
                                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-green-100 text-green-800 font-medium">
                                                                        In Consultation
                                                                    </span>
                                                                ) : patient.consultationStatus === 'served' ? (
                                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-medium">
                                                                        Completed
                                                                    </span>
                                                                ) : patient.consultationStatus === 'waiting' ? (
                                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 font-medium">
                                                                        Waiting
                                                                    </span>
                                                                ) : null}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        <div className="flex items-center">
                                                            <Calendar className="h-3 w-3 text-gray-400 mr-1" />
                                                            {registeredDate}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                                        <div className="flex items-center justify-end space-x-2">
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
                                                                        onClick={() => !isQueued && handleRegularCheckIn(patient.id)}
                                                                        disabled={isQueued}
                                                                        className={`
                                                                           whitespace-nowrap 
                                                                           ${isQueued ? 'opacity-50 cursor-not-allowed bg-gray-100 text-gray-400' : 'hover:bg-yellow-100 text-yellow-700'}
                                                                        `}
                                                                        title={isQueued ? 'Already in Queue' : 'Check In to Queue'}
                                                                    >
                                                                        Check In
                                                                    </Button>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="secondary"
                                                                        onClick={() => !isQueued && handleFollowUpClick(patient.id)}
                                                                        disabled={isQueued}
                                                                        className={`
                                                                           whitespace-nowrap 
                                                                           ${isQueued ? 'opacity-50 cursor-not-allowed bg-gray-100 text-gray-400' : 'hover:bg-orange-100 text-orange-700'}
                                                                        `}
                                                                        title={isQueued ? 'Already in Queue' : 'Add as Follow-up'}
                                                                    >
                                                                        Follow Up
                                                                    </Button>

                                                                    <Button
                                                                        size="sm"
                                                                        variant="secondary"
                                                                        onClick={() => onViewPatient(patient.id)}
                                                                        className="hover:bg-blue-100 whitespace-nowrap"
                                                                    >
                                                                        <Eye className="h-3 w-3 flex-shrink-0" />
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
                                    const isQueued =
                                        patient.consultationStatus === 'waiting' ||
                                        patient.consultationStatus === 'in_consultation';

                                    return (
                                        <Card
                                            key={patient.id}
                                            className="hover:shadow-md transition-shadow duration-200"
                                        >
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

                                                    <div className="mb-2 flex flex-wrap gap-2">
                                                        {patient.consultationStatus === 'in_consultation' ? (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-green-100 text-green-800 font-medium text-xs">
                                                                In Consultation
                                                            </span>
                                                        ) : patient.consultationStatus === 'served' ? (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-medium text-xs">
                                                                Completed
                                                            </span>
                                                        ) : patient.consultationStatus === 'waiting' ? (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 font-medium text-xs">
                                                                Waiting
                                                            </span>
                                                        ) : null}
                                                    </div>

                                                    <div className="space-y-1 text-xs text-gray-600">
                                                        <div>ID: {patient.idNumber}</div>
                                                        <div>
                                                            {age} years old • {patient.sex}
                                                        </div>
                                                        <div className="flex items-center">
                                                            <Phone className="h-3 w-3 mr-1" />
                                                            {formatPhoneNumber(patient.contactNumber)}
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center space-x-2 mt-3">
                                                        {!isQueued && (
                                                            <>
                                                                <Button
                                                                    size="sm"
                                                                    onClick={() => handleRegularCheckIn(patient.id)}
                                                                    variant="secondary"
                                                                    className="flex-1 text-xs"
                                                                >
                                                                    Check In
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    onClick={() => handleFollowUpClick(patient.id)}
                                                                    variant="secondary"
                                                                    className="flex-1 text-xs text-orange-700"
                                                                >
                                                                    Follow Up
                                                                </Button>
                                                            </>
                                                        )}
                                                        <Button
                                                            size="sm"
                                                            onClick={() => onViewPatient(patient.id)}
                                                            className="flex-1"
                                                        >
                                                            <Eye className="h-3 w-3" />
                                                        </Button>
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

            {/* Follow Up Reason Modal */}
            <Modal
                isOpen={isFollowUpModalOpen}
                onClose={() => setIsFollowUpModalOpen(false)}
                title="Follow-up Reason"
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Reason for Follow-up
                        </label>
                        <textarea
                            value={followUpReason}
                            onChange={(e) => setFollowUpReason(e.target.value)}
                            className="w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2"
                            rows={3}
                            placeholder="Enter the reason for this follow-up..."
                        />
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                        <Button variant="secondary" onClick={() => setIsFollowUpModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={confirmFollowUp}
                            className="bg-orange-600 hover:bg-orange-700 text-white"
                        >
                            Confirm Add to Queue
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

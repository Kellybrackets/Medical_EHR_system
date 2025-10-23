import React from 'react';
import { User, Download, Printer, Edit, Copy, CheckCircle, FileText } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { PatientAvatar } from '../ui/PatientAvatar';
import { StatusBadge } from '../ui/StatusBadge';
import { Patient } from '../../types';
import { calculateAge, getPatientStatus, formatDate } from '../../utils/patientUtils';
import { calculateBMI, copyToClipboard, formatContactForCopy, generatePatientCSV, downloadFile } from '../../utils/patientViewUtils';

interface PatientHeaderProps {
  patient: Patient;
  onEdit?: () => void;
  onExportPDF?: () => void;
  canEdit?: boolean;
  showToast?: (message: string, type: 'success' | 'error') => void;
}

export const PatientHeader: React.FC<PatientHeaderProps> = ({
  patient,
  onEdit,
  onExportPDF,
  canEdit = false,
  showToast
}) => {
  const age = calculateAge(patient.dateOfBirth);
  const status = getPatientStatus(patient);
  const bmi = patient.medicalHistory?.height && patient.medicalHistory?.weight 
    ? calculateBMI(patient.medicalHistory.height, patient.medicalHistory.weight)
    : null;

  const handleCopyContact = async () => {
    const contactText = formatContactForCopy(patient);
    const success = await copyToClipboard(contactText);
    if (showToast) {
      showToast(
        success ? 'Contact information copied to clipboard!' : 'Failed to copy contact information',
        success ? 'success' : 'error'
      );
    }
  };

  const handleExportCSV = () => {
    const csvContent = generatePatientCSV(patient);
    const filename = `patient_${patient.firstName}_${patient.surname}_${new Date().toISOString().split('T')[0]}.csv`;
    downloadFile(csvContent, filename, 'text/csv');
    if (showToast) {
      showToast('Patient data exported as CSV!', 'success');
    }
  };

  const handlePrint = () => {
    window.print();
    if (showToast) {
      showToast('Print dialog opened', 'success');
    }
  };

  return (
    <div className="space-y-6">
      {/* Main Patient Header */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          {/* Patient Info */}
          <div className="flex items-start space-x-4">
            <PatientAvatar
              firstName={patient.firstName}
              surname={patient.surname}
              gender={patient.sex}
              size="xl"
              className="ring-4 ring-white shadow-lg"
            />
            <div className="flex-1 min-w-0">
              <div className="flex flex-col gap-2 mb-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h1 className="text-2xl font-bold text-gray-900 break-words">
                    {patient.firstName} {patient.surname}
                  </h1>
                  <StatusBadge status={status} lastVisit={patient.createdAt} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                <div className="flex flex-col">
                  <span className="text-gray-500 text-xs uppercase tracking-wide mb-1">Patient ID</span>
                  <span className="font-medium text-gray-900 font-mono break-all">{patient.idNumber}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-gray-500 text-xs uppercase tracking-wide mb-1">Age</span>
                  <span className="font-medium text-gray-900">{age} years old</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-gray-500 text-xs uppercase tracking-wide mb-1">Gender</span>
                  <span className="font-medium text-gray-900">{patient.sex}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm mt-4">
                <div className="flex flex-col">
                  <span className="text-gray-500 text-xs uppercase tracking-wide mb-1">Date of Birth</span>
                  <span className="font-medium text-gray-900">
                    {patient.dateOfBirth ? formatDate(patient.dateOfBirth) : 'Not provided'}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-gray-500 text-xs uppercase tracking-wide mb-1">Blood Type</span>
                  <span className="font-medium text-red-600">
                    {patient.medicalHistory?.bloodType || 'Unknown'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 lg:flex-nowrap lg:flex-col lg:min-w-[200px]">
            {canEdit && onEdit && (
              <Button
                onClick={onEdit}
                variant="secondary"
                className="w-full sm:w-auto lg:w-full bg-white hover:bg-gray-50 border-gray-300 whitespace-nowrap"
              >
                <Edit className="h-4 w-4 mr-2 flex-shrink-0" />
                <span>Edit Patient</span>
              </Button>
            )}

            <Button
              onClick={handleCopyContact}
              variant="secondary"
              className="w-full sm:w-auto lg:w-full bg-white hover:bg-gray-50 border-gray-300 whitespace-nowrap"
            >
              <Copy className="h-4 w-4 mr-2 flex-shrink-0" />
              <span>Copy Contact</span>
            </Button>

            <div className="flex gap-2 w-full">
              <Button
                onClick={handleExportCSV}
                variant="secondary"
                className="flex-1 bg-white hover:bg-gray-50 border-gray-300 whitespace-nowrap"
              >
                <Download className="h-4 w-4 mr-1 flex-shrink-0" />
                <span>CSV</span>
              </Button>

              {onExportPDF && (
                <Button
                  onClick={onExportPDF}
                  variant="secondary"
                  className="flex-1 bg-white hover:bg-gray-50 border-gray-300 whitespace-nowrap"
                >
                  <FileText className="h-4 w-4 mr-1 flex-shrink-0" />
                  <span>PDF</span>
                </Button>
              )}

              <Button
                onClick={handlePrint}
                variant="secondary"
                className="flex-1 bg-white hover:bg-gray-50 border-gray-300 whitespace-nowrap"
              >
                <Printer className="h-4 w-4 mr-1 flex-shrink-0" />
                <span>Print</span>
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-700">
              {patient.medicalHistory?.height ? `${patient.medicalHistory.height}` : '--'}
            </div>
            <div className="text-sm text-green-600 font-medium">Height (cm)</div>
          </div>
        </Card>

        <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-700">
              {patient.medicalHistory?.weight ? `${patient.medicalHistory.weight}` : '--'}
            </div>
            <div className="text-sm text-blue-600 font-medium">Weight (kg)</div>
          </div>
        </Card>

        <Card className={`bg-gradient-to-r border-2 ${bmi ? bmi.categoryColor.includes('green') ? 'from-green-50 to-emerald-50 border-green-200' : 
          bmi.categoryColor.includes('yellow') ? 'from-yellow-50 to-amber-50 border-yellow-200' :
          bmi.categoryColor.includes('red') ? 'from-red-50 to-rose-50 border-red-200' :
          'from-blue-50 to-cyan-50 border-blue-200' : 'from-gray-50 to-slate-50 border-gray-200'}`}>
          <div className="text-center">
            <div className={`text-2xl font-bold ${bmi ? bmi.categoryColor.split(' ')[0] : 'text-gray-500'}`}>
              {bmi ? bmi.value : '--'}
            </div>
            <div className={`text-sm font-medium ${bmi ? bmi.categoryColor.split(' ')[0] : 'text-gray-500'}`}>
              BMI {bmi ? `(${bmi.category})` : ''}
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-r from-purple-50 to-violet-50 border-purple-200">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-700">
              {(patient.medicalHistory?.allergies?.length || 0) + 
               (patient.medicalHistory?.chronicConditions?.length || 0)}
            </div>
            <div className="text-sm text-purple-600 font-medium">Medical Alerts</div>
          </div>
        </Card>
      </div>
    </div>
  );
};
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
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                <h1 className="text-2xl font-bold text-gray-900">
                  {patient.firstName} {patient.surname}
                </h1>
                <StatusBadge status={status} lastVisit={patient.createdAt} />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                <div>
                  <span className="text-gray-500">Patient ID:</span>
                  <span className="ml-2 font-medium text-gray-900 font-mono">{patient.idNumber}</span>
                </div>
                <div>
                  <span className="text-gray-500">Age:</span>
                  <span className="ml-2 font-medium text-gray-900">{age} years old</span>
                </div>
                <div>
                  <span className="text-gray-500">Gender:</span>
                  <span className="ml-2 font-medium text-gray-900">{patient.sex}</span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm mt-2">
                <div>
                  <span className="text-gray-500">Date of Birth:</span>
                  <span className="ml-2 font-medium text-gray-900">
                    {patient.dateOfBirth ? formatDate(patient.dateOfBirth) : 'Not provided'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Blood Type:</span>
                  <span className="ml-2 font-medium text-red-600">
                    {patient.medicalHistory?.bloodType || 'Unknown'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 lg:flex-col lg:w-48">
            {canEdit && onEdit && (
              <Button
                onClick={onEdit}
                variant="secondary"
                className="bg-white hover:bg-gray-50 border-gray-300"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Patient
              </Button>
            )}
            
            <Button
              onClick={handleCopyContact}
              variant="secondary"
              className="bg-white hover:bg-gray-50 border-gray-300"
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy Contact
            </Button>
            
            <div className="flex gap-2">
              <Button
                onClick={handleExportCSV}
                variant="secondary"
                className="flex-1 bg-white hover:bg-gray-50 border-gray-300"
              >
                <Download className="h-4 w-4 mr-1" />
                CSV
              </Button>
              
              {onExportPDF && (
                <Button
                  onClick={onExportPDF}
                  variant="secondary"
                  className="flex-1 bg-white hover:bg-gray-50 border-gray-300"
                >
                  <FileText className="h-4 w-4 mr-1" />
                  PDF
                </Button>
              )}
              
              <Button
                onClick={handlePrint}
                variant="secondary"
                className="flex-1 bg-white hover:bg-gray-50 border-gray-300"
              >
                <Printer className="h-4 w-4 mr-1" />
                Print
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
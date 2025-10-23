import React, { useState } from 'react';
import { Phone, MapPin, Shield, Heart, Pill, AlertTriangle, Users, Copy, Edit, ChevronDown, ChevronUp } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Patient } from '../../types';
import { formatPhoneNumber } from '../../utils/patientUtils';
import { copyToClipboard } from '../../utils/patientViewUtils';

interface SectionCardProps {
  patient: Patient;
  onEdit?: (section: string) => void;
  canEdit?: boolean;
  showToast?: (message: string, type: 'success' | 'error') => void;
}

export const ContactInfoCard: React.FC<SectionCardProps> = ({ 
  patient, 
  onEdit, 
  canEdit = false,
  showToast 
}) => {
  const handleCopyPhone = async () => {
    const success = await copyToClipboard(patient.contactNumber);
    if (showToast) {
      showToast(
        success ? 'Phone number copied!' : 'Failed to copy phone number',
        success ? 'success' : 'error'
      );
    }
  };

  const handleCopyAddress = async () => {
    const success = await copyToClipboard(patient.address);
    if (showToast) {
      showToast(
        success ? 'Address copied!' : 'Failed to copy address',
        success ? 'success' : 'error'
      );
    }
  };

  return (
    <Card className="h-full">
      <Card.Header>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Phone className="h-5 w-5 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>
          </div>
          {canEdit && onEdit && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => onEdit('contact')}
            >
              <Edit className="h-3 w-3 mr-1" />
              Edit
            </Button>
          )}
        </div>
      </Card.Header>
      
      <Card.Content className="space-y-4">
        {/* Primary Contact */}
        <div className="bg-blue-50 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-3">Primary Contact</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-gray-900">
                  {formatPhoneNumber(patient.contactNumber)}
                </span>
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={handleCopyPhone}
                className="text-xs"
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
            
            {patient.email && (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 flex items-center justify-center">
                  <span className="text-blue-600">@</span>
                </div>
                <span className="text-sm text-gray-900">{patient.email}</span>
              </div>
            )}
          </div>
        </div>

        {/* Address */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-gray-900 flex items-center">
              <MapPin className="h-4 w-4 text-gray-600 mr-2" />
              Address
            </h4>
            <Button
              size="sm"
              variant="secondary"
              onClick={handleCopyAddress}
              className="text-xs"
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed">{patient.address}</p>
        </div>

        {/* Emergency Contact */}
        <div className="bg-red-50 rounded-lg p-4">
          <h4 className="font-medium text-red-900 mb-3 flex items-center">
            <AlertTriangle className="h-4 w-4 text-red-600 mr-2" />
            Emergency Contact
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-red-700">Name:</span>
              <span className="font-medium text-gray-900">{patient.nextOfKin?.name || 'Not provided'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-red-700">Relationship:</span>
              <span className="font-medium text-gray-900">{patient.nextOfKin?.relationship || 'Not provided'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-red-700">Phone:</span>
              <span className="font-medium text-gray-900">
                {patient.nextOfKin?.phone ? formatPhoneNumber(patient.nextOfKin.phone) : 'Not provided'}
              </span>
            </div>
          </div>
        </div>
      </Card.Content>
    </Card>
  );
};

export const MedicalAidCard: React.FC<SectionCardProps> = ({ 
  patient, 
  onEdit, 
  canEdit = false 
}) => {
  const hasInsurance = patient.insuranceDetails?.fundName;

  return (
    <Card className="h-full">
      <Card.Header>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <Shield className="h-5 w-5 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Medical Aid</h3>
          </div>
          {canEdit && onEdit && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => onEdit('insurance')}
            >
              <Edit className="h-3 w-3 mr-1" />
              Edit
            </Button>
          )}
        </div>
      </Card.Header>
      
      <Card.Content>
        {hasInsurance ? (
          <div className="space-y-4">
            <div className="bg-green-50 rounded-lg p-4">
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-green-700">Provider</label>
                  <p className="text-lg font-semibold text-gray-900 mt-1">
                    {patient.insuranceDetails.fundName}
                  </p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-green-700">Member Number</label>
                    <p className="text-sm font-mono text-gray-900 mt-1 bg-white px-2 py-1 rounded border">
                      {patient.insuranceDetails.memberNumber}
                    </p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-green-700">Plan</label>
                    <p className="text-sm text-gray-900 mt-1">
                      {patient.insuranceDetails.plan || 'Not specified'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <Shield className="mx-auto h-12 w-12 text-gray-400" />
            <h4 className="mt-2 text-sm font-medium text-gray-900">No Medical Aid</h4>
            <p className="mt-1 text-sm text-gray-500">No insurance information on file</p>
          </div>
        )}
      </Card.Content>
    </Card>
  );
};

export const MedicalHistoryCard: React.FC<SectionCardProps> = ({ 
  patient, 
  onEdit, 
  canEdit = false 
}) => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  
  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const medicalHistory = patient.medicalHistory;
  const hasAllergies = medicalHistory?.allergies?.length > 0;
  const hasConditions = medicalHistory?.chronicConditions?.length > 0;
  const hasMedications = medicalHistory?.currentMedications?.length > 0;
  const hasSurgeries = medicalHistory?.pastSurgeries?.length > 0;
  const hasFamilyHistory = medicalHistory?.familyHistory;

  const hasAnyMedicalData = hasAllergies || hasConditions || hasMedications || hasSurgeries || hasFamilyHistory;

  return (
    <Card className="h-full">
      <Card.Header>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-red-100 rounded-lg">
              <Heart className="h-5 w-5 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Medical History</h3>
          </div>
          {canEdit && onEdit && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => onEdit('medical')}
            >
              <Edit className="h-3 w-3 mr-1" />
              Edit
            </Button>
          )}
        </div>
      </Card.Header>
      
      <Card.Content>
        {hasAnyMedicalData ? (
          <div className="space-y-4">
            {/* Allergies */}
            {hasAllergies && (
              <div className="bg-red-50 rounded-lg p-4 border-l-4 border-red-400">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-red-900 flex items-center">
                    <AlertTriangle className="h-4 w-4 text-red-600 mr-2" />
                    Allergies
                  </h4>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => toggleSection('allergies')}
                  >
                    {expandedSections.allergies ? 
                      <ChevronUp className="h-4 w-4" /> : 
                      <ChevronDown className="h-4 w-4" />
                    }
                  </Button>
                </div>
                <div className={`${expandedSections.allergies ? 'block' : 'hidden'} space-y-1`}>
                  {medicalHistory.allergies.map((allergy, index) => (
                    <span key={index} className="inline-block bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full mr-1 mb-1">
                      {allergy}
                    </span>
                  ))}
                </div>
                {!expandedSections.allergies && (
                  <p className="text-sm text-red-700">
                    {medicalHistory.allergies.length} allerg{medicalHistory.allergies.length === 1 ? 'y' : 'ies'} on file
                  </p>
                )}
              </div>
            )}

            {/* Chronic Conditions */}
            {hasConditions && (
              <div className="bg-orange-50 rounded-lg p-4 border-l-4 border-orange-400">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-orange-900 flex items-center">
                    <Heart className="h-4 w-4 text-orange-600 mr-2" />
                    Chronic Conditions
                  </h4>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => toggleSection('conditions')}
                  >
                    {expandedSections.conditions ? 
                      <ChevronUp className="h-4 w-4" /> : 
                      <ChevronDown className="h-4 w-4" />
                    }
                  </Button>
                </div>
                <div className={`${expandedSections.conditions ? 'block' : 'hidden'} space-y-1`}>
                  {medicalHistory.chronicConditions.map((condition, index) => (
                    <span key={index} className="inline-block bg-orange-100 text-orange-800 text-xs font-medium px-2 py-1 rounded-full mr-1 mb-1">
                      {condition}
                    </span>
                  ))}
                </div>
                {!expandedSections.conditions && (
                  <p className="text-sm text-orange-700">
                    {medicalHistory.chronicConditions.length} condition{medicalHistory.chronicConditions.length === 1 ? '' : 's'} monitored
                  </p>
                )}
              </div>
            )}

            {/* Current Medications */}
            {hasMedications && (
              <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-400">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-blue-900 flex items-center">
                    <Pill className="h-4 w-4 text-blue-600 mr-2" />
                    Current Medications
                  </h4>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => toggleSection('medications')}
                  >
                    {expandedSections.medications ? 
                      <ChevronUp className="h-4 w-4" /> : 
                      <ChevronDown className="h-4 w-4" />
                    }
                  </Button>
                </div>
                <div className={`${expandedSections.medications ? 'block' : 'hidden'} space-y-2`}>
                  {medicalHistory.currentMedications.map((medication, index) => (
                    <div key={index} className="flex items-center text-sm bg-white p-2 rounded border">
                      <Pill className="h-3 w-3 text-blue-500 mr-2 flex-shrink-0" />
                      <span className="text-gray-900">{medication}</span>
                    </div>
                  ))}
                </div>
                {!expandedSections.medications && (
                  <p className="text-sm text-blue-700">
                    {medicalHistory.currentMedications.length} medication{medicalHistory.currentMedications.length === 1 ? '' : 's'} prescribed
                  </p>
                )}
              </div>
            )}

            {/* Family History */}
            {hasFamilyHistory && (
              <div className="bg-purple-50 rounded-lg p-4 border-l-4 border-purple-400">
                <h4 className="font-medium text-purple-900 mb-2 flex items-center">
                  <Users className="h-4 w-4 text-purple-600 mr-2" />
                  Family History
                </h4>
                <p className="text-sm text-gray-700 leading-relaxed">{medicalHistory.familyHistory}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-6">
            <Heart className="mx-auto h-12 w-12 text-gray-400" />
            <h4 className="mt-2 text-sm font-medium text-gray-900">No Medical History</h4>
            <p className="mt-1 text-sm text-gray-500">No medical history information on file</p>
          </div>
        )}
      </Card.Content>
    </Card>
  );
};
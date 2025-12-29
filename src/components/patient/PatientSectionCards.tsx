import React, { useState } from 'react';
import { Phone, MapPin, Shield, AlertTriangle, Copy, Edit } from 'lucide-react';
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
  showToast,
}) => {
  const handleCopyPhone = async () => {
    const success = await copyToClipboard(patient.contactNumber);
    if (showToast) {
      showToast(
        success ? 'Phone number copied!' : 'Failed to copy phone number',
        success ? 'success' : 'error',
      );
    }
  };

  const handleCopyAddress = async () => {
    const success = await copyToClipboard(patient.address);
    if (showToast) {
      showToast(
        success ? 'Address copied!' : 'Failed to copy address',
        success ? 'success' : 'error',
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
            <Button size="sm" variant="secondary" onClick={() => onEdit('contact')}>
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
              <Button size="sm" variant="secondary" onClick={handleCopyPhone} className="text-xs">
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
            <Button size="sm" variant="secondary" onClick={handleCopyAddress} className="text-xs">
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
              <span className="font-medium text-gray-900">
                {patient.nextOfKin?.name || 'Not provided'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-red-700">Relationship:</span>
              <span className="font-medium text-gray-900">
                {patient.nextOfKin?.relationship || 'Not provided'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-red-700">Phone:</span>
              <span className="font-medium text-gray-900">
                {patient.nextOfKin?.phone
                  ? formatPhoneNumber(patient.nextOfKin.phone)
                  : 'Not provided'}
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
  canEdit = false,
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
            <Button size="sm" variant="secondary" onClick={() => onEdit('insurance')}>
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
                    {patient.insuranceDetails?.fundName}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-green-700">Member Number</label>
                    <p className="text-sm font-mono text-gray-900 mt-1 bg-white px-2 py-1 rounded border">
                      {patient.insuranceDetails?.memberNumber}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-green-700">Plan</label>
                    <p className="text-sm text-gray-900 mt-1">
                      {patient.insuranceDetails?.plan || 'Not specified'}
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

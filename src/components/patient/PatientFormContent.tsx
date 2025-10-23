import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Input } from '../ui/Input';
import { PatientFormData } from '../../types';

interface PatientFormContentProps {
  formData: PatientFormData;
  errors: Partial<PatientFormData>;
  updateFormField: (field: keyof PatientFormData, value: string) => void;
}

export const PatientFormContent: React.FC<PatientFormContentProps> = ({
  formData,
  errors,
  updateFormField
}) => {
  const [showMedicalInfo, setShowMedicalInfo] = useState(false);

  return (
    <div className="space-y-8">
      {/* Personal Information */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
          Personal Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Input
            label="First Name"
            type="text"
            required
            value={formData.firstName}
            onChange={(e) => updateFormField('firstName', e.target.value)}
            error={errors.firstName}
            placeholder="Enter first name"
          />

          <Input
            label="Surname"
            type="text"
            required
            value={formData.surname}
            onChange={(e) => updateFormField('surname', e.target.value)}
            error={errors.surname}
            placeholder="Enter surname"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ID Type <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={formData.idType}
              onChange={(e) => updateFormField('idType', e.target.value as 'id_number' | 'passport')}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="id_number">SA ID Number</option>
              <option value="passport">Passport</option>
            </select>
          </div>

          <Input
            label={formData.idType === 'passport' ? 'Passport Number' : 'ID Number'}
            type="text"
            required
            value={formData.idNumber}
            onChange={(e) => updateFormField('idNumber', e.target.value)}
            error={errors.idNumber}
            placeholder={formData.idType === 'passport' ? 'A1234567' : '0001010001088'}
          />

          <Input
            label="Date of Birth"
            type="date"
            required
            value={formData.dateOfBirth}
            onChange={(e) => updateFormField('dateOfBirth', e.target.value)}
            error={errors.dateOfBirth}
          />

          <Input
            label="Age"
            type="number"
            value={formData.age}
            readOnly
            className="bg-gray-50"
            placeholder="Auto-calculated"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Gender <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={formData.gender}
              onChange={(e) => updateFormField('gender', e.target.value)}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
          Contact Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Input
            label="Primary Phone"
            type="tel"
            required
            value={formData.contactNumber}
            onChange={(e) => updateFormField('contactNumber', e.target.value)}
            error={errors.contactNumber}
            placeholder="082 123 4567"
          />

          <Input
            label="Alternate Phone"
            type="tel"
            value={formData.alternateNumber}
            onChange={(e) => updateFormField('alternateNumber', e.target.value)}
            error={errors.alternateNumber}
            placeholder="081 234 5678 (optional)"
          />

          <Input
            label="Email Address"
            type="email"
            value={formData.email}
            onChange={(e) => updateFormField('email', e.target.value)}
            error={errors.email}
            placeholder="email@example.com (optional)"
          />

          <Input
            label="Street Address"
            type="text"
            required
            value={formData.address}
            onChange={(e) => updateFormField('address', e.target.value)}
            error={errors.address}
            placeholder="123 Main Street"
          />

          <Input
            label="City"
            type="text"
            required
            value={formData.city}
            onChange={(e) => updateFormField('city', e.target.value)}
            error={errors.city}
            placeholder="Cape Town"
          />

          <Input
            label="Postal Code"
            type="text"
            value={formData.postalCode}
            onChange={(e) => updateFormField('postalCode', e.target.value)}
            error={errors.postalCode}
            placeholder="8001"
          />
        </div>
      </div>

      {/* Emergency Contact */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
          Emergency Contact
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Input
            label="Full Name"
            type="text"
            required
            value={formData.emergencyContactName}
            onChange={(e) => updateFormField('emergencyContactName', e.target.value)}
            error={errors.emergencyContactName}
            placeholder="John Doe"
          />

          <Input
            label="Relationship"
            type="text"
            required
            value={formData.emergencyContactRelationship}
            onChange={(e) => updateFormField('emergencyContactRelationship', e.target.value)}
            error={errors.emergencyContactRelationship}
            placeholder="Father, Mother, Spouse"
          />

          <Input
            label="Phone Number"
            type="tel"
            required
            value={formData.emergencyContactPhone}
            onChange={(e) => updateFormField('emergencyContactPhone', e.target.value)}
            error={errors.emergencyContactPhone}
            placeholder="082 123 4567"
          />

          <Input
            label="Alternate Phone"
            type="tel"
            value={formData.emergencyContactAlternatePhone}
            onChange={(e) => updateFormField('emergencyContactAlternatePhone', e.target.value)}
            error={errors.emergencyContactAlternatePhone}
            placeholder="081 234 5678 (optional)"
          />

          <Input
            label="Email Address"
            type="email"
            value={formData.emergencyContactEmail}
            onChange={(e) => updateFormField('emergencyContactEmail', e.target.value)}
            error={errors.emergencyContactEmail}
            placeholder="contact@example.com (optional)"
          />
        </div>
      </div>

      {/* Medical Aid Information */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
          Medical Aid Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Input
            label="Medical Aid Provider"
            type="text"
            value={formData.medicalAidProvider}
            onChange={(e) => updateFormField('medicalAidProvider', e.target.value)}
            error={errors.medicalAidProvider}
            placeholder="Discovery Health, Momentum"
          />

          <Input
            label="Member Number"
            type="text"
            value={formData.medicalAidNumber}
            onChange={(e) => updateFormField('medicalAidNumber', e.target.value)}
            error={errors.medicalAidNumber}
            placeholder="123456789"
          />

          <Input
            label="Plan"
            type="text"
            value={formData.medicalAidPlan}
            onChange={(e) => updateFormField('medicalAidPlan', e.target.value)}
            error={errors.medicalAidPlan}
            placeholder="Comprehensive, Executive"
          />
        </div>
      </div>

      {/* Health Information & Medical History - Collapsible */}
      <div>
        <button
          type="button"
          onClick={() => setShowMedicalInfo(!showMedicalInfo)}
          className="w-full flex items-center justify-between text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200 hover:text-blue-600 transition-colors"
        >
          <span>Health Information & Medical History (Optional)</span>
          {showMedicalInfo ? (
            <ChevronUp className="h-5 w-5" />
          ) : (
            <ChevronDown className="h-5 w-5" />
          )}
        </button>

        {showMedicalInfo && (
          <div className="space-y-8 animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Health Information */}
            <div>
              <h4 className="text-md font-medium text-gray-800 mb-4">
                Health Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Blood Type
                  </label>
                  <select
                    value={formData.bloodType}
                    onChange={(e) => updateFormField('bloodType', e.target.value)}
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Select blood type</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>

                <Input
                  label="Height (cm)"
                  type="number"
                  value={formData.height}
                  onChange={(e) => updateFormField('height', e.target.value)}
                  error={errors.height}
                  placeholder="175"
                  min="30"
                  max="300"
                />

                <Input
                  label="Weight (kg)"
                  type="number"
                  value={formData.weight}
                  onChange={(e) => updateFormField('weight', e.target.value)}
                  error={errors.weight}
                  placeholder="70"
                  min="1"
                  max="500"
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Smoking Status
                  </label>
                  <select
                    value={formData.smokingStatus}
                    onChange={(e) => updateFormField('smokingStatus', e.target.value)}
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="never">Never smoked</option>
                    <option value="former">Former smoker</option>
                    <option value="current">Current smoker</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Alcohol Consumption
                  </label>
                  <select
                    value={formData.alcoholConsumption}
                    onChange={(e) => updateFormField('alcoholConsumption', e.target.value)}
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="never">Never drinks</option>
                    <option value="occasional">Occasional</option>
                    <option value="moderate">Moderate</option>
                    <option value="heavy">Heavy</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Medical History */}
            <div>
              <h4 className="text-md font-medium text-gray-800 mb-4">
                Medical History
              </h4>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Known Allergies
                  </label>
                  <textarea
                    value={formData.allergies}
                    onChange={(e) => updateFormField('allergies', e.target.value)}
                    placeholder="Enter allergies separated by commas (e.g., Penicillin, Shellfish, Peanuts)"
                    rows={2}
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">Separate multiple allergies with commas</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Chronic Conditions
                  </label>
                  <textarea
                    value={formData.chronicConditions}
                    onChange={(e) => updateFormField('chronicConditions', e.target.value)}
                    placeholder="Enter chronic conditions separated by commas (e.g., Hypertension, Diabetes, Asthma)"
                    rows={2}
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">Separate multiple conditions with commas</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Medications
                  </label>
                  <textarea
                    value={formData.currentMedications}
                    onChange={(e) => updateFormField('currentMedications', e.target.value)}
                    placeholder="Enter current medications separated by commas (e.g., Amlodipine 5mg, Metformin 500mg)"
                    rows={2}
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">Include dosage where known, separate with commas</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Past Surgeries/Major Procedures
                  </label>
                  <textarea
                    value={formData.pastSurgeries}
                    onChange={(e) => updateFormField('pastSurgeries', e.target.value)}
                    placeholder="Enter past surgeries or procedures separated by commas (e.g., Appendectomy 2019, Knee surgery 2021)"
                    rows={2}
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">Include approximate dates where known</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Family Medical History
                  </label>
                  <textarea
                    value={formData.familyHistory}
                    onChange={(e) => updateFormField('familyHistory', e.target.value)}
                    placeholder="Enter relevant family medical history (e.g., Father - Heart disease, Mother - Diabetes)"
                    rows={3}
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">Include major conditions in immediate family</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
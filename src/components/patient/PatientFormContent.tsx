import React from 'react';
import { Input } from '../ui/Input';
import { Patient } from '../../types';
import { PatientFormSchema } from '../../lib/validators';
import { UseFormRegister, FieldErrors, Control, useWatch, UseFormSetValue } from 'react-hook-form';

interface PatientFormContentProps {
  register: UseFormRegister<PatientFormSchema>;
  errors: FieldErrors<PatientFormSchema>;
  control: Control<PatientFormSchema>;
  setValue: UseFormSetValue<PatientFormSchema>;
  patients: Patient[];
}

export const PatientFormContent: React.FC<PatientFormContentProps> = ({
  register,
  errors,
  control,
  setValue,
  patients,
}) => {


  const idType = useWatch({ control, name: 'idType' });
  const paymentMethod = useWatch({ control, name: 'paymentMethod' });
  const age = useWatch({ control, name: 'age' });
  const isDependent = useWatch({ control, name: 'isDependent' });

  const isMinor = age ? parseInt(age) < 18 : false;
  const showParentLink = isMinor || isDependent;

  // Filter out the current patient from the list if trying to edit (though we don't have current patient ID here easily, but typically can't be own parent)
  // For simplicity, just show all.

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
            {...register('firstName')}
            error={errors.firstName?.message}
            placeholder="Enter first name"
          />

          <Input
            label="Surname"
            type="text"
            required
            {...register('surname')}
            error={errors.surname?.message}
            placeholder="Enter surname"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ID Type <span className="text-red-500">*</span>
            </label>
            <select
              required
              {...register('idType')}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="id_number">SA ID Number</option>
              <option value="passport">Passport</option>
            </select>
          </div>

          <Input
            label={idType === 'passport' ? 'Passport Number' : 'ID Number'}
            type="text"
            required
            {...register('idNumber')}
            error={errors.idNumber?.message}
            placeholder={idType === 'passport' ? 'A1234567' : '0001010001088'}
          />

          <Input
            label="Date of Birth"
            type="date"
            required
            {...register('dateOfBirth')}
            error={errors.dateOfBirth?.message}
          />

          <Input
            label="Age"
            type="number"
            {...register('age')}
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
              {...register('gender')}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
      </div>


      {/* Parent/Guardian Linking */}
      {
        (showParentLink || true) && (
          <div>
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Parent / Guardian Link
              </h3>
              <div className="flex items-center">
                <input
                  id="isDependent"
                  type="checkbox"
                  {...register('isDependent')}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isDependent" className="ml-2 block text-sm text-gray-900">
                  Link to Parent/Guardian
                </label>
              </div>
            </div>

            {showParentLink && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Parent / Guardian
                  </label>
                  <select
                    {...register('parentId')}
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">-- Select Parent --</option>
                    {patients && patients.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.firstName} {p.surname} ({p.uidNumber || p.idNumber})
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    Link this patient to an existing main member/parent.
                  </p>
                </div>
              </div>
            )}
          </div>
        )
      }

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
            {...register('contactNumber')}
            error={errors.contactNumber?.message}
            placeholder="082 123 4567"
          />

          <Input
            label="Alternate Phone"
            type="tel"
            {...register('alternateNumber')}
            error={errors.alternateNumber?.message}
            placeholder="081 234 5678 (optional)"
          />

          <Input
            label="Email Address"
            type="email"
            {...register('email')}
            error={errors.email?.message}
            placeholder="email@example.com (optional)"
          />

          <Input
            label="Street Address"
            type="text"
            required
            {...register('address')}
            error={errors.address?.message}
            placeholder="123 Main Street"
          />

          <Input
            label="City"
            type="text"
            required
            {...register('city')}
            error={errors.city?.message}
            placeholder="Cape Town"
          />

          <Input
            label="Postal Code"
            type="text"
            {...register('postalCode')}
            error={errors.postalCode?.message}
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
            {...register('emergencyContactName')}
            error={errors.emergencyContactName?.message}
            placeholder="John Doe"
          />

          <Input
            label="Relationship"
            type="text"
            required
            {...register('emergencyContactRelationship')}
            error={errors.emergencyContactRelationship?.message}
            placeholder="Father, Mother, Spouse"
          />

          <Input
            label="Phone Number"
            type="tel"
            required
            {...register('emergencyContactPhone')}
            error={errors.emergencyContactPhone?.message}
            placeholder="082 123 4567"
          />

          <Input
            label="Alternate Phone"
            type="tel"
            {...register('emergencyContactAlternatePhone')}
            error={errors.emergencyContactAlternatePhone?.message}
            placeholder="081 234 5678 (optional)"
          />

          <Input
            label="Email Address"
            type="email"
            {...register('emergencyContactEmail')}
            error={errors.emergencyContactEmail?.message}
            placeholder="contact@example.com (optional)"
          />
        </div>
      </div>

      {/* Payment Method & Medical Aid Information */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
          Payment Method & Medical Aid Information
        </h3>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Payment Method <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setValue('paymentMethod', 'cash')}
              className={`
                p-4 border-2 rounded-lg text-center transition-all
                ${paymentMethod === 'cash'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                }
              `}
            >
              <div className="font-semibold mb-1">Cash / Self Pay</div>
              <div className="text-xs text-gray-600">Patient pays directly</div>
            </button>

            <button
              type="button"
              onClick={() => setValue('paymentMethod', 'medical_aid')}
              className={`
                p-4 border-2 rounded-lg text-center transition-all
                ${paymentMethod === 'medical_aid'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                }
              `}
            >
              <div className="font-semibold mb-1">Medical Aid</div>
              <div className="text-xs text-gray-600">Insured patient</div>
            </button>
          </div>
        </div>

        {paymentMethod === 'medical_aid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Input
              label="Medical Aid Provider"
              type="text"
              {...register('medicalAidProvider')}
              error={errors.medicalAidProvider?.message}
              placeholder="Discovery Health, Momentum"
            />

            <Input
              label="Member Number"
              type="text"
              {...register('medicalAidNumber')}
              error={errors.medicalAidNumber?.message}
              placeholder="123456789"
            />

            <Input
              label="Plan"
              type="text"
              {...register('medicalAidPlan')}
              error={errors.medicalAidPlan?.message}
              placeholder="Comprehensive, Executive"
            />

            <Input
              label="Scheme Code"
              type="text"
              {...register('medicalAidSchemeCode')}
              error={errors.medicalAidSchemeCode?.message}
              placeholder="Code (e.g. DIG001)"
            />
          </div>
        )}
      </div>

    </div >
  );
};

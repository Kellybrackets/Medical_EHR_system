import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Search, Upload, X, CheckCircle2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { usePatients } from '../../hooks/usePatients';

interface PaymentFormProps {
    onSubmit: (data: any) => Promise<void>;
    onCancel: () => void;
    initialPatientId?: string;
}

export const PaymentForm: React.FC<PaymentFormProps> = ({ onSubmit, onCancel, initialPatientId }) => {
    const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm({
        defaultValues: {
            patient_id: initialPatientId || '',
            amount: '',
            method: 'cash',
            reference: '',
            notes: ''
        }
    });

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const { patients } = usePatients();
    const selectedPatientId = watch('patient_id');

    const filteredPatients = patients.filter(p =>
        `${p.firstName} ${p.surname} ${p.idNumber}`.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 5);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const onFormSubmit = async (data: any) => {
        await onSubmit({
            ...data,
            proofFile: selectedFile
        });
    };

    const selectedPatient = patients.find(p => p.id === selectedPatientId);

    return (
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
            {/* Patient Selection */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Patient</label>
                {selectedPatient ? (
                    <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div>
                            <p className="font-medium text-blue-900">{selectedPatient.firstName} {selectedPatient.surname}</p>
                            <p className="text-xs text-blue-700">{selectedPatient.idNumber}</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                setValue('patient_id', '');
                            }}
                            className="text-blue-500 hover:text-blue-700"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                ) : (
                    <div className="relative">
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search patient by name or ID..."
                                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        {searchTerm && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                                {filteredPatients.map(patient => (
                                    <button
                                        key={patient.id}
                                        type="button"
                                        className="w-full text-left px-4 py-2 hover:bg-gray-50 border-b last:border-0"
                                        onClick={() => {
                                            setValue('patient_id', patient.id);
                                            setSearchTerm('');
                                        }}
                                    >
                                        <p className="font-medium text-gray-900">{patient.firstName} {patient.surname}</p>
                                        <p className="text-xs text-gray-500">{patient.idNumber}</p>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}
                <input type="hidden" {...register('patient_id', { required: 'Patient is required' })} />
                {errors.patient_id && <p className="mt-1 text-sm text-red-600">{errors.patient_id.message}</p>}
            </div>

            {/* Amount & Method */}
            <div className="grid grid-cols-2 gap-4">
                <Input
                    label="Amount (ZAR)"
                    type="number"
                    step="0.01"
                    required
                    {...register('amount', { required: 'Amount is required' })}
                    error={errors.amount?.message}
                />

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Payment Method
                    </label>
                    <select
                        {...register('method')}
                        className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                        <option value="cash">Cash</option>
                        <option value="card">Card</option>
                        <option value="eft">EFT</option>
                        <option value="medical_aid">Medical Aid</option>
                    </select>
                </div>
            </div>

            <Input
                label="Reference / Receipt Number"
                {...register('reference')}
                placeholder="Optional"
            />

            {/* File Upload */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Proof of Payment / Receipt
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-blue-400 transition-colors">
                    <div className="space-y-1 text-center">
                        {selectedFile ? (
                            <div className="flex flex-col items-center">
                                <CheckCircle2 className="h-12 w-12 text-green-500" />
                                <p className="mt-2 text-sm text-gray-900">{selectedFile.name}</p>
                                <button
                                    type="button"
                                    onClick={() => setSelectedFile(null)}
                                    className="mt-2 text-xs text-red-600 hover:text-red-800"
                                >
                                    Remove file
                                </button>
                            </div>
                        ) : (
                            <>
                                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                                <div className="flex text-sm text-gray-600">
                                    <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none">
                                        <span>Upload a file</span>
                                        <input type="file" className="sr-only" onChange={handleFileChange} accept="image/*,.pdf" />
                                    </label>
                                    <p className="pl-1">or drag and drop</p>
                                </div>
                                <p className="text-xs text-gray-500">
                                    PNG, JPG, PDF up to 10MB
                                </p>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button variant="secondary" type="button" onClick={onCancel}>
                    Cancel
                </Button>
                <Button type="submit">
                    Record Payment
                </Button>
            </div>
        </form>
    );
};

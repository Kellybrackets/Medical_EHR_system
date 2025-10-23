import { User, Patient, ConsultationNote } from '../types';

export const mockUsers: User[] = [
  {
    id: '1',
    username: 'dr.smith',
    role: 'doctor',
    name: 'Dr. Sarah Smith'
  },
  {
    id: '2',
    username: 'receptionist',
    role: 'receptionist',
    name: 'Mary Johnson'
  }
];

export const mockPatients: Patient[] = [
  {
    id: '1',
    firstName: 'John',
    surname: 'Doe',
    idNumber: '8501015009087',
    sex: 'Male',
    dateOfBirth: '1985-01-01',
    age: 39,
    contactNumber: '082 555 0123',
    address: '123 Main Street, Cape Town, 8001',
    nextOfKin: {
      name: 'Jane Doe',
      relationship: 'Wife',
      phone: '082 555 0124'
    },
    medicalAid: {
      fundName: 'Discovery Health',
      memberNumber: '123456789',
      plan: 'Comprehensive'
    },
    medicalHistory: {
      allergies: ['Penicillin', 'Shellfish'],
      chronicConditions: ['Hypertension'],
      pastDiagnoses: ['Pneumonia (2020)', 'Ankle fracture (2018)']
    },
    createdAt: '2024-01-15',
    updatedAt: '2024-01-15'
  },
  {
    id: '2',
    firstName: 'Sarah',
    surname: 'Wilson',
    idNumber: '9203122345082',
    sex: 'Female',
    dateOfBirth: '1992-03-12',
    age: 32,
    contactNumber: '081 444 5678',
    address: '456 Oak Avenue, Johannesburg, 2001',
    nextOfKin: {
      name: 'Mike Wilson',
      relationship: 'Husband',
      phone: '081 444 5679'
    },
    medicalAid: {
      fundName: 'Momentum Health',
      memberNumber: '987654321',
      plan: 'Standard'
    },
    medicalHistory: {
      allergies: ['None known'],
      chronicConditions: [],
      pastDiagnoses: ['Appendicitis (2019)']
    },
    createdAt: '2024-02-10',
    updatedAt: '2024-02-10'
  }
];

export const mockConsultationNotes: ConsultationNote[] = [
  {
    id: '1',
    patientId: '1',
    doctorId: '1',
    date: '2024-01-10',
    reasonForVisit: 'Hypertension follow-up',
    icd10Code: 'I10',
    soap: {
      subjective: 'Patient reports feeling well. Taking medication as prescribed. No chest pain or shortness of breath.',
      objective: 'BP: 135/85 mmHg, HR: 72 bpm, normal heart sounds, no peripheral edema',
      assessment: 'Hypertension, well controlled',
      plan: 'Continue current medication. Return in 3 months. Lifestyle counseling provided.'
    },
    createdAt: '2024-01-10'
  }
];
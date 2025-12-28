import { z } from 'zod';

const phoneRegex = /^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s\./0-9]*$/;

export const patientFormSchema = z
  .object({
    // Personal Information
    firstName: z.string().min(1, 'First name is required'),
    surname: z.string().min(1, 'Surname is required'),
    idType: z.enum(['id_number', 'passport']),
    idNumber: z.string().min(1, 'ID or Passport number is required'),
    dateOfBirth: z.string().min(1, 'Date of birth is required'),
    age: z.string().optional(),
    gender: z.enum(['male', 'female', 'other']),

    // Contact Information
    contactNumber: z.string().regex(phoneRegex, 'Please enter a valid phone number'),
    alternateNumber: z.string().optional(),
    email: z.string().email('Please enter a valid email address').optional().or(z.literal('')),
    address: z.string().min(1, 'Address is required'),
    city: z.string().min(1, 'City is required'),
    postalCode: z.string().optional(),

    // Emergency Contact
    emergencyContactName: z.string().min(1, 'Emergency contact name is required'),
    emergencyContactRelationship: z.string().min(1, 'Relationship is required'),
    emergencyContactPhone: z.string().regex(phoneRegex, 'Please enter a valid phone number'),
    emergencyContactAlternatePhone: z.string().optional(),
    emergencyContactEmail: z
      .string()
      .email('Please enter a valid email address')
      .optional()
      .or(z.literal('')),

    // Payment & Medical Aid Information
    paymentMethod: z.enum(['cash', 'medical_aid']),
    medicalAidProvider: z.string().optional(),
    medicalAidNumber: z.string().optional(),
    medicalAidPlan: z.string().optional(),
    dependentType: z.string().optional(),


  })
  .superRefine((data, ctx) => {
    if (data.idType === 'id_number' && !/^\d{13}$/.test(data.idNumber)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['idNumber'],
        message: 'Please enter a valid 13-digit ID number',
      });
    }
    if (data.idType === 'passport' && !/^[A-Z0-9]{6,20}$/i.test(data.idNumber.replace(/\s/g, ''))) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['idNumber'],
        message: 'Please enter a valid passport number (6-20 alphanumeric characters)',
      });
    }

  });

export type PatientFormSchema = z.infer<typeof patientFormSchema>;

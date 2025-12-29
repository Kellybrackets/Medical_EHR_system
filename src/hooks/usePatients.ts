/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from 'react';
import { Patient, PatientFormData, ApiResponse } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { formDataToPatientData } from '../utils/patientDataTransforms';
import { useAuthContext } from '../contexts/AuthContext';

export const usePatients = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPatientAdded, setNewPatientAdded] = useState<Patient | null>(null);
  const { user } = useAuthContext();

  const loadPatients = useCallback(async () => {
    try {
      if (!isSupabaseConfigured) {
        setPatients([]);
        return;
      }

      const { data: basicPatientsData, error: basicError } = await supabase
        .from('patients')
        .select('*');

      if (basicPatientsData && !basicError) {
        const patientIds = basicPatientsData.map((p) => p.id);

        const [insuranceDetails, nextOfKinData] = await Promise.all([
          supabase.from('insurance_details').select('*').in('patient_id', patientIds),
          supabase.from('next_of_kin').select('*').in('patient_id', patientIds),
        ]);

        const fallbackPatients: Patient[] = basicPatientsData.map((patient: any) => {
          const insurance = insuranceDetails.data?.find((ins) => ins.patient_id === patient.id);
          const nextOfKin = nextOfKinData.data?.find((nok) => nok.patient_id === patient.id);

          return {
            id: patient.id,
            firstName: patient.first_name,
            surname: patient.surname,
            idType: patient.id_type || 'id_number',
            idNumber: patient.id_number,
            sex: patient.sex,
            dateOfBirth: patient.date_of_birth,
            age: patient.age,
            contactNumber: patient.contact_number,
            alternateNumber: patient.alternate_number,
            email: patient.email,
            address: patient.address,
            city: patient.city,
            postalCode: patient.postal_code,
            createdAt: patient.created_at,
            updatedAt: patient.updated_at,
            consultationStatus: patient.consultation_status,
            currentDoctorId: patient.current_doctor_id,
            lastStatusChange: patient.last_status_change,
            visitType: patient.visit_type,
            visitReason: patient.visit_reason,
            paymentMethod: patient.payment_method || 'cash',
            parentId: patient.parent_id,
            isDependent: patient.is_dependent,

            insuranceDetails: insurance
              ? {
                  id: insurance.id,
                  patientId: patient.id,
                  fundName: insurance.fund_name,
                  memberNumber: insurance.member_number,
                  plan: insurance.plan,
                  schemeCode: insurance.scheme_code,
                  createdAt: patient.created_at,
                  updatedAt: patient.updated_at,
                }
              : undefined,
            nextOfKin: nextOfKin
              ? {
                  id: nextOfKin.id,
                  patientId: patient.id,
                  name: nextOfKin.name,
                  relationship: nextOfKin.relationship,
                  phone: nextOfKin.phone,
                  alternatePhone: nextOfKin.alternate_phone,
                  email: nextOfKin.email,
                  createdAt: patient.created_at,
                  updatedAt: patient.updated_at,
                }
              : undefined,
          };
        });

        setPatients(fallbackPatients);
        return;
      } else {
        setPatients([]);
      }
    } catch (error) {
      console.error('Error loading patients:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      return;
    }

    const channel = supabase
      .channel('patients-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'patients',
        },
        async (payload) => {
          const newPatientId = payload.new.id;

          try {
            const [insurance, nextOfKin] = await Promise.all([
              supabase
                .from('insurance_details')
                .select('*')
                .eq('patient_id', newPatientId)
                .single(),
              supabase.from('next_of_kin').select('*').eq('patient_id', newPatientId).single(),
            ]);

            const completePatient: Patient = {
              id: payload.new.id,
              firstName: payload.new.first_name,
              surname: payload.new.surname,
              idType: payload.new.id_type || 'id_number',
              idNumber: payload.new.id_number,
              sex: payload.new.sex,
              dateOfBirth: payload.new.date_of_birth,
              age: payload.new.age,
              contactNumber: payload.new.contact_number,
              alternateNumber: payload.new.alternate_number,
              email: payload.new.email,
              address: payload.new.address,
              city: payload.new.city,
              postalCode: payload.new.postal_code,
              createdAt: payload.new.created_at,
              updatedAt: payload.new.updated_at,
              consultationStatus: payload.new.consultation_status,
              currentDoctorId: payload.new.current_doctor_id,
              lastStatusChange: payload.new.last_status_change,
              visitType: payload.new.visit_type,
              visitReason: payload.new.visit_reason,
              parentId: payload.new.parent_id,
              isDependent: payload.new.is_dependent,

              insuranceDetails: insurance.data
                ? {
                    id: insurance.data.id,
                    patientId: newPatientId,
                    fundName: insurance.data.fund_name,
                    memberNumber: insurance.data.member_number,
                    plan: insurance.data.plan,
                    schemeCode: insurance.data.scheme_code,
                    createdAt: insurance.data.created_at,
                    updatedAt: insurance.data.updated_at,
                  }
                : undefined,
              nextOfKin: nextOfKin.data
                ? {
                    id: nextOfKin.data.id,
                    patientId: newPatientId,
                    name: nextOfKin.data.name,
                    relationship: nextOfKin.data.relationship,
                    phone: nextOfKin.data.phone,
                    alternatePhone: nextOfKin.data.alternate_phone,
                    email: nextOfKin.data.email,
                    createdAt: nextOfKin.data.created_at,
                    updatedAt: nextOfKin.data.updated_at,
                  }
                : undefined,
            };

            setPatients((prev) => {
              const exists = prev.find((p) => p.id === completePatient.id);
              if (exists) {
                return prev;
              }
              setNewPatientAdded(completePatient);
              return [...prev, completePatient];
            });
          } catch (error) {
            console.error('Error fetching complete patient data:', error);
            await loadPatients();
          }
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'patients',
        },
        async (payload) => {
          const updatedPatientId = payload.new.id;

          try {
            const [insurance, nextOfKin] = await Promise.all([
              supabase
                .from('insurance_details')
                .select('*')
                .eq('patient_id', updatedPatientId)
                .single(),
              supabase.from('next_of_kin').select('*').eq('patient_id', updatedPatientId).single(),
            ]);

            const updatedPatient: Patient = {
              id: payload.new.id,
              firstName: payload.new.first_name,
              surname: payload.new.surname,
              idType: payload.new.id_type || 'id_number',
              idNumber: payload.new.id_number,
              sex: payload.new.sex,
              dateOfBirth: payload.new.date_of_birth,
              age: payload.new.age,
              contactNumber: payload.new.contact_number,
              alternateNumber: payload.new.alternate_number,
              email: payload.new.email,
              address: payload.new.address,
              city: payload.new.city,
              postalCode: payload.new.postal_code,
              createdAt: payload.new.created_at,
              updatedAt: payload.new.updated_at,
              consultationStatus: payload.new.consultation_status,
              currentDoctorId: payload.new.current_doctor_id,
              lastStatusChange: payload.new.last_status_change,
              visitType: payload.new.visit_type,
              visitReason: payload.new.visit_reason,
              parentId: payload.new.parent_id,
              isDependent: payload.new.is_dependent,

              insuranceDetails: insurance.data
                ? {
                    id: insurance.data.id,
                    patientId: updatedPatientId,
                    fundName: insurance.data.fund_name,
                    memberNumber: insurance.data.member_number,
                    plan: insurance.data.plan,
                    createdAt: insurance.data.created_at,
                    updatedAt: insurance.data.updated_at,
                  }
                : undefined,
              nextOfKin: nextOfKin.data
                ? {
                    id: nextOfKin.data.id,
                    patientId: updatedPatientId,
                    name: nextOfKin.data.name,
                    relationship: nextOfKin.data.relationship,
                    phone: nextOfKin.data.phone,
                    alternatePhone: nextOfKin.data.alternate_phone,
                    email: nextOfKin.data.email,
                    createdAt: nextOfKin.data.created_at,
                    updatedAt: nextOfKin.data.updated_at,
                  }
                : undefined,
            };

            setPatients((prev) =>
              prev.map((p) => (p.id === updatedPatient.id ? updatedPatient : p)),
            );
          } catch (error) {
            console.error('Error fetching updated patient data:', error);
          }
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'patients',
        },
        (payload) => {
          setPatients((prev) => prev.filter((p) => p.id !== payload.old.id));
        },
      )
      .subscribe((_status, err) => {
        if (err) {
          console.error('Realtime subscription error:', err);
        }
      });

    const pollInterval = setInterval(() => {
      loadPatients();
    }, 15000);

    return () => {
      clearInterval(pollInterval);
      supabase.removeChannel(channel);
    };
  }, [loadPatients]);

  const createPatient = useCallback(
    async (formData: PatientFormData): Promise<ApiResponse> => {
      try {
        const transformedData = formDataToPatientData(formData);

        const patientWithPractice = {
          ...transformedData.patient,
          practice_code: user?.practiceCode || null,
          consultation_status: null,
        };

        const { data: patientData, error: patientError } = await supabase
          .from('patients')
          .insert([patientWithPractice])
          .select()
          .single();

        if (patientError) {
          if (
            patientError.code === '23505' &&
            patientError.message.includes('patients_id_number_key')
          ) {
            return {
              success: false,
              error:
                'A patient with this ID number already exists. Please check the ID number and try again.',
              field: 'idNumber',
            };
          }
          return { success: false, error: patientError.message };
        }

        const patientId = patientData.id;

        const { error: nextOfKinError } = await supabase.from('next_of_kin').insert([
          {
            patient_id: patientId,
            ...transformedData.nextOfKin,
          },
        ]);

        if (nextOfKinError) {
          await supabase.from('patients').delete().eq('id', patientId);
          return { success: false, error: 'Failed to create emergency contact information' };
        }

        const { error: insuranceError } = await supabase.from('insurance_details').insert([
          {
            patient_id: patientId,
            ...transformedData.insuranceDetails,
          },
        ]);

        if (insuranceError) {
          await supabase.from('next_of_kin').delete().eq('patient_id', patientId);
          await supabase.from('patients').delete().eq('id', patientId);
          return { success: false, error: 'Failed to create insurance information' };
        }

        await loadPatients();

        return { success: true, data: patientData };
      } catch (error: any) {
        return { success: false, error: error.message || 'An unexpected error occurred' };
      }
    },
    [loadPatients, user],
  );

  const updatePatient = useCallback(
    async (patientId: string, formData: PatientFormData): Promise<ApiResponse> => {
      try {
        const transformedData = formDataToPatientData(formData);

        const { error: patientError } = await supabase
          .from('patients')
          .update(transformedData.patient)
          .eq('id', patientId);

        if (patientError) {
          if (
            patientError.code === '23505' &&
            patientError.message.includes('patients_id_number_key')
          ) {
            return {
              success: false,
              error:
                'A patient with this ID number already exists. Please check the ID number and try again.',
              field: 'idNumber',
            };
          }
          return { success: false, error: patientError.message };
        }

        const { error: nextOfKinError } = await supabase.from('next_of_kin').upsert(
          [
            {
              patient_id: patientId,
              ...transformedData.nextOfKin,
            },
          ],
          { onConflict: 'patient_id' },
        );

        if (nextOfKinError) {
          return { success: false, error: 'Failed to update emergency contact information' };
        }

        const { error: insuranceError } = await supabase.from('insurance_details').upsert(
          [
            {
              patient_id: patientId,
              ...transformedData.insuranceDetails,
            },
          ],
          { onConflict: 'patient_id' },
        );

        if (insuranceError) {
          return { success: false, error: 'Failed to update insurance information' };
        }

        await loadPatients();

        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message || 'An unexpected error occurred' };
      }
    },
    [loadPatients],
  );

  const deletePatient = useCallback(
    async (patientId: string): Promise<ApiResponse> => {
      try {
        const { error } = await supabase.from('patients').delete().eq('id', patientId);

        if (error) {
          return { success: false, error: error.message };
        }

        await loadPatients();

        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message || 'An unexpected error occurred' };
      }
    },
    [loadPatients],
  );

  const getPatientById = useCallback(async (patientId: string): Promise<Patient | null> => {
    try {
      const { data, error } = await supabase.rpc('get_complete_patient_data', {
        patient_uuid: patientId,
      });

      if (error) {
        console.error('Error loading patient:', error);
        return null;
      }

      if (!data) {
        return null;
      }

      const patient: Patient = {
        id: data.id,
        firstName: data.firstName,
        surname: data.surname,
        idType: data.idType || 'id_number',
        idNumber: data.idNumber,
        sex: data.sex,
        dateOfBirth: data.dateOfBirth,
        age: data.age,
        contactNumber: data.contactNumber,
        alternateNumber: data.alternateNumber,
        email: data.email,
        address: data.address,
        city: data.city,
        postalCode: data.postalCode,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        visitType: data.visit_type,
        visitReason: data.visit_reason,
        parentId: data.parent_id,
        isDependent: data.is_dependent,

        insuranceDetails: data.insuranceDetails
          ? {
              id: data.insuranceDetails.id,
              patientId: data.id,
              fundName: data.insuranceDetails.fundName,
              memberNumber: data.insuranceDetails.memberNumber,
              plan: data.insuranceDetails.plan,
              schemeCode: data.insuranceDetails.scheme_code,
              createdAt: data.createdAt,
              updatedAt: data.updatedAt,
            }
          : undefined,
        nextOfKin: data.nextOfKin
          ? {
              id: data.nextOfKin.id,
              patientId: data.id,
              name: data.nextOfKin.name,
              relationship: data.nextOfKin.relationship,
              phone: data.nextOfKin.phone,
              alternatePhone: data.nextOfKin.alternatePhone,
              email: data.nextOfKin.email,
              createdAt: data.createdAt,
              updatedAt: data.updatedAt,
            }
          : undefined,
      };

      return patient;
    } catch (error) {
      console.error('Error loading patient:', error);
      return null;
    }
  }, []);

  const startConsultation = useCallback(
    async (patientId: string, doctorId: string): Promise<ApiResponse> => {
      try {
        const { data, error } = await supabase.rpc('start_consultation', {
          p_patient_id: patientId,
          p_doctor_id: doctorId,
        });

        if (error) {
          return { success: false, error: error.message };
        }

        const result = data as { success: boolean; error?: string };

        if (!result.success) {
          return { success: false, error: result.error || 'Failed to start consultation' };
        }

        await loadPatients();

        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message || 'An unexpected error occurred' };
      }
    },
    [loadPatients],
  );

  const completeConsultation = useCallback(
    async (patientId: string, doctorId: string): Promise<ApiResponse> => {
      try {
        const { data, error } = await supabase.rpc('complete_consultation', {
          p_patient_id: patientId,
          p_doctor_id: doctorId,
        });

        if (error) {
          return { success: false, error: error.message };
        }

        const result = data as { success: boolean; error?: string };

        if (!result.success) {
          return { success: false, error: result.error || 'Failed to complete consultation' };
        }

        await loadPatients();

        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message || 'An unexpected error occurred' };
      }
    },
    [loadPatients],
  );

  const addToQueue = useCallback(
    async (
      patientId: string,
      visitType: 'regular' | 'follow_up' | 'emergency' = 'regular',
      visitReason?: string,
    ): Promise<ApiResponse> => {
      try {
        const { error } = await supabase
          .from('patients')
          .update({
            consultation_status: 'waiting',
            last_status_change: new Date().toISOString(),
            visit_type: visitType,
            visit_reason: visitReason,
          })
          .eq('id', patientId);

        if (error) {
          return { success: false, error: error.message };
        }

        await loadPatients();

        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message || 'An unexpected error occurred' };
      }
    },
    [loadPatients],
  );

  return {
    patients,
    loading,
    addPatient: createPatient,
    updatePatient,
    deletePatient,
    getPatientById,
    reloadPatients: loadPatients,
    newPatientAdded,
    clearNewPatientNotification: () => setNewPatientAdded(null),
    startConsultation,
    completeConsultation,
    addToQueue,
  };
};

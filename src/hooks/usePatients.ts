import { useState, useEffect, useCallback } from 'react';
import { Patient, PatientFormData, ApiResponse } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { formDataToPatientData, validateMedicalData } from '../utils/patientDataTransforms';
import { useAuthContext } from '../contexts/AuthProvider';

export const usePatients = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPatientAdded, setNewPatientAdded] = useState<Patient | null>(null);
  const { user } = useAuthContext();


  const loadPatients = useCallback(async () => {
    try {
      console.log('🔍 Loading patients...');
      console.log('🔧 Supabase configured?', isSupabaseConfigured);
      console.log('🔗 Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
      
      if (!isSupabaseConfigured) {
        console.error('❌ Supabase is not properly configured!');
        console.log('📝 Expected env vars: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY');
        setPatients([]);
        return;
      }
      
      // First check if we can access the basic patients table
      const { data: basicPatientsData, error: basicError } = await supabase
        .from('patients')
        .select('*');
      
      console.log('🔍 Basic patients query:', { 
        data: basicPatientsData, 
        error: basicError,
        count: basicPatientsData?.length || 0
      });
      
      // Function was intentionally removed, use direct data loading
      console.log('📊 Using direct patient data loading (function removed)');
      
      // Load complete patient data using multiple queries
      if (basicPatientsData && !basicError) {
          console.log('🔄 Using fallback with manual data loading...');
          
          // Load related data for all patients
          const patientIds = basicPatientsData.map(p => p.id);
          
          const [medicalHistories, insuranceDetails, nextOfKinData] = await Promise.all([
            supabase.from('medical_histories').select('*').in('patient_id', patientIds),
            supabase.from('insurance_details').select('*').in('patient_id', patientIds),
            supabase.from('next_of_kin').select('*').in('patient_id', patientIds)
          ]);
          
          console.log('📊 Related data loaded:', {
            medical: medicalHistories.data?.length || 0,
            insurance: insuranceDetails.data?.length || 0,
            nextOfKin: nextOfKinData.data?.length || 0
          });
          
          const fallbackPatients: Patient[] = basicPatientsData.map((patient: any) => {
            const medicalHistory = medicalHistories.data?.find(mh => mh.patient_id === patient.id);
            const insurance = insuranceDetails.data?.find(ins => ins.patient_id === patient.id);
            const nextOfKin = nextOfKinData.data?.find(nok => nok.patient_id === patient.id);

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
              // Queue/Consultation status
              consultationStatus: patient.consultation_status || 'waiting',
              currentDoctorId: patient.current_doctor_id,
              lastStatusChange: patient.last_status_change,
              medicalHistory: medicalHistory ? {
                id: medicalHistory.id,
                patientId: patient.id,
                height: medicalHistory.height,
                weight: medicalHistory.weight,
                bloodType: medicalHistory.blood_type,
                allergies: medicalHistory.allergies || [],
                chronicConditions: medicalHistory.chronic_conditions || [],
                currentMedications: medicalHistory.current_medications || [],
                pastSurgeries: medicalHistory.past_surgeries || [],
                familyHistory: medicalHistory.family_history,
                smokingStatus: medicalHistory.smoking_status || 'never',
                alcoholConsumption: medicalHistory.alcohol_consumption || 'never',
                createdAt: patient.created_at,
                updatedAt: patient.updated_at,
              } : undefined,
              insuranceDetails: insurance ? {
                id: insurance.id,
                patientId: patient.id,
                fundName: insurance.fund_name,
                memberNumber: insurance.member_number,
                plan: insurance.plan,
                createdAt: patient.created_at,
                updatedAt: patient.updated_at,
              } : undefined,
              nextOfKin: nextOfKin ? {
                id: nextOfKin.id,
                patientId: patient.id,
                name: nextOfKin.name,
                relationship: nextOfKin.relationship,
                phone: nextOfKin.phone,
                alternatePhone: nextOfKin.alternate_phone,
                email: nextOfKin.email,
                createdAt: patient.created_at,
                updatedAt: patient.updated_at,
              } : undefined,
            };
          });
          
          console.log('✅ Complete fallback patients loaded:', { count: fallbackPatients.length });
          setPatients(fallbackPatients);
          return;
        } else {
          console.error('❌ Failed to load basic patient data');
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

  // Real-time subscription for patient changes
  useEffect(() => {
    if (!isSupabaseConfigured) {
      console.log('⚠️ Supabase not configured, skipping realtime subscription');
      return;
    }

    console.log('🔔 Setting up realtime subscription for patients table...');
    console.log('📍 Current patients count:', patients.length);
    console.log('🔧 Supabase client:', supabase ? 'OK' : 'MISSING');

    // Subscribe to patient table changes
    const channel = supabase
      .channel('patients-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'patients'
        },
        async (payload) => {
          console.log('🆕 New patient inserted:', payload.new);

          // Fetch complete patient data including related tables
          const newPatientId = payload.new.id;

          try {
            const [medicalHistory, insurance, nextOfKin] = await Promise.all([
              supabase.from('medical_histories').select('*').eq('patient_id', newPatientId).single(),
              supabase.from('insurance_details').select('*').eq('patient_id', newPatientId).single(),
              supabase.from('next_of_kin').select('*').eq('patient_id', newPatientId).single()
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
              // Queue/Consultation status
              consultationStatus: payload.new.consultation_status || 'waiting',
              currentDoctorId: payload.new.current_doctor_id,
              lastStatusChange: payload.new.last_status_change,
              medicalHistory: medicalHistory.data ? {
                id: medicalHistory.data.id,
                patientId: newPatientId,
                height: medicalHistory.data.height,
                weight: medicalHistory.data.weight,
                bloodType: medicalHistory.data.blood_type,
                allergies: medicalHistory.data.allergies || [],
                chronicConditions: medicalHistory.data.chronic_conditions || [],
                currentMedications: medicalHistory.data.current_medications || [],
                pastSurgeries: medicalHistory.data.past_surgeries || [],
                familyHistory: medicalHistory.data.family_history,
                smokingStatus: medicalHistory.data.smoking_status || 'never',
                alcoholConsumption: medicalHistory.data.alcohol_consumption || 'never',
                createdAt: medicalHistory.data.created_at,
                updatedAt: medicalHistory.data.updated_at,
              } : undefined,
              insuranceDetails: insurance.data ? {
                id: insurance.data.id,
                patientId: newPatientId,
                fundName: insurance.data.fund_name,
                memberNumber: insurance.data.member_number,
                plan: insurance.data.plan,
                createdAt: insurance.data.created_at,
                updatedAt: insurance.data.updated_at,
              } : undefined,
              nextOfKin: nextOfKin.data ? {
                id: nextOfKin.data.id,
                patientId: newPatientId,
                name: nextOfKin.data.name,
                relationship: nextOfKin.data.relationship,
                phone: nextOfKin.data.phone,
                alternatePhone: nextOfKin.data.alternate_phone,
                email: nextOfKin.data.email,
                createdAt: nextOfKin.data.created_at,
                updatedAt: nextOfKin.data.updated_at,
              } : undefined,
            };

            // Add to patients list if not already present (avoid duplicates)
            setPatients(prev => {
              const exists = prev.find(p => p.id === completePatient.id);
              if (exists) {
                console.log('⚠️ Patient already in list, skipping duplicate');
                return prev;
              }
              console.log('✅ Adding new patient to list');
              // Trigger notification
              setNewPatientAdded(completePatient);
              return [...prev, completePatient];
            });
          } catch (error) {
            console.error('❌ Error fetching complete patient data:', error);
            // Fallback: reload all patients
            await loadPatients();
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'patients'
        },
        async (payload) => {
          console.log('📝 Patient updated:', payload.new);

          // Update the patient in the list
          const updatedPatientId = payload.new.id;

          try {
            const [medicalHistory, insurance, nextOfKin] = await Promise.all([
              supabase.from('medical_histories').select('*').eq('patient_id', updatedPatientId).single(),
              supabase.from('insurance_details').select('*').eq('patient_id', updatedPatientId).single(),
              supabase.from('next_of_kin').select('*').eq('patient_id', updatedPatientId).single()
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
              // Queue/Consultation status
              consultationStatus: payload.new.consultation_status || 'waiting',
              currentDoctorId: payload.new.current_doctor_id,
              lastStatusChange: payload.new.last_status_change,
              medicalHistory: medicalHistory.data ? {
                id: medicalHistory.data.id,
                patientId: updatedPatientId,
                height: medicalHistory.data.height,
                weight: medicalHistory.data.weight,
                bloodType: medicalHistory.data.blood_type,
                allergies: medicalHistory.data.allergies || [],
                chronicConditions: medicalHistory.data.chronic_conditions || [],
                currentMedications: medicalHistory.data.current_medications || [],
                pastSurgeries: medicalHistory.data.past_surgeries || [],
                familyHistory: medicalHistory.data.family_history,
                smokingStatus: medicalHistory.data.smoking_status || 'never',
                alcoholConsumption: medicalHistory.data.alcohol_consumption || 'never',
                createdAt: medicalHistory.data.created_at,
                updatedAt: medicalHistory.data.updated_at,
              } : undefined,
              insuranceDetails: insurance.data ? {
                id: insurance.data.id,
                patientId: updatedPatientId,
                fundName: insurance.data.fund_name,
                memberNumber: insurance.data.member_number,
                plan: insurance.data.plan,
                createdAt: insurance.data.created_at,
                updatedAt: insurance.data.updated_at,
              } : undefined,
              nextOfKin: nextOfKin.data ? {
                id: nextOfKin.data.id,
                patientId: updatedPatientId,
                name: nextOfKin.data.name,
                relationship: nextOfKin.data.relationship,
                phone: nextOfKin.data.phone,
                alternatePhone: nextOfKin.data.alternate_phone,
                email: nextOfKin.data.email,
                createdAt: nextOfKin.data.created_at,
                updatedAt: nextOfKin.data.updated_at,
              } : undefined,
            };

            setPatients(prev =>
              prev.map(p => p.id === updatedPatient.id ? updatedPatient : p)
            );
          } catch (error) {
            console.error('❌ Error fetching updated patient data:', error);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'patients'
        },
        (payload) => {
          console.log('🗑️ Patient deleted:', payload.old);
          setPatients(prev => prev.filter(p => p.id !== payload.old.id));
        }
      )
      .subscribe((status, err) => {
        console.log('📡 Realtime subscription status:', status);
        if (err) {
          console.error('❌ Realtime subscription error:', err);
        }
        if (status === 'SUBSCRIBED') {
          console.log('✅ Successfully subscribed to patients changes!');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Channel error - realtime may not be enabled on patients table');
          console.error('💡 Run this SQL in Supabase: ALTER PUBLICATION supabase_realtime ADD TABLE patients;');
        } else if (status === 'TIMED_OUT') {
          console.error('⏱️ Subscription timed out - check network connection');
        } else if (status === 'CLOSED') {
          console.warn('🔌 Channel closed');
        }
      });

    // Fallback: Poll every 15 seconds if realtime is not working reliably
    // This ensures data stays fresh even if WebSocket fails
    const pollInterval = setInterval(() => {
      console.log('🔄 Auto-refresh polling (15s interval)...');
      loadPatients();
    }, 15000); // 15 seconds

    // Cleanup subscription on unmount
    return () => {
      console.log('🔌 Unsubscribing from patients realtime channel');
      clearInterval(pollInterval);
      supabase.removeChannel(channel);
    };
  }, [loadPatients]);

  const createPatient = useCallback(async (formData: PatientFormData): Promise<ApiResponse> => {
    try {
      // Transform and validate form data
      const transformedData = formDataToPatientData(formData);
      
      // Validate medical data
      const medicalValidation = validateMedicalData(transformedData.medicalHistory);
      if (!medicalValidation.isValid) {
        return { success: false, error: `Medical data validation failed: ${medicalValidation.errors.join(', ')}` };
      }

      // Start a Supabase transaction-like operation
      // First, create the patient with practice_code from the logged-in user
      const patientWithPractice = {
        ...transformedData.patient,
        practice_code: user?.practiceCode || null
      };

      const { data: patientData, error: patientError } = await supabase
        .from('patients')
        .insert([patientWithPractice])
        .select()
        .single();

      if (patientError) {
        console.error('Error creating patient:', patientError);
        if (patientError.code === '23505' && patientError.message.includes('patients_id_number_key')) {
          return { success: false, error: 'A patient with this ID number already exists. Please check the ID number and try again.', field: 'idNumber' };
        }
        return { success: false, error: patientError.message };
      }

      const patientId = patientData.id;

      // Create next of kin record
      const { error: nextOfKinError } = await supabase
        .from('next_of_kin')
        .insert([{
          patient_id: patientId,
          ...transformedData.nextOfKin
        }]);

      if (nextOfKinError) {
        console.error('Error creating next of kin:', nextOfKinError);
        // Clean up patient record
        await supabase.from('patients').delete().eq('id', patientId);
        return { success: false, error: 'Failed to create emergency contact information' };
      }

      // Create medical history record
      const { error: medicalHistoryError } = await supabase
        .from('medical_histories')
        .insert([{
          patient_id: patientId,
          ...transformedData.medicalHistory
        }]);

      if (medicalHistoryError) {
        console.error('Error creating medical history:', medicalHistoryError);
        // Clean up previous records
        await supabase.from('next_of_kin').delete().eq('patient_id', patientId);
        await supabase.from('patients').delete().eq('id', patientId);
        return { success: false, error: 'Failed to create medical history' };
      }

      // Create insurance details record
      const { error: insuranceError } = await supabase
        .from('insurance_details')
        .insert([{
          patient_id: patientId,
          ...transformedData.insuranceDetails
        }]);

      if (insuranceError) {
        console.error('Error creating insurance details:', insuranceError);
        // Clean up previous records
        await supabase.from('medical_histories').delete().eq('patient_id', patientId);
        await supabase.from('next_of_kin').delete().eq('patient_id', patientId);
        await supabase.from('patients').delete().eq('id', patientId);
        return { success: false, error: 'Failed to create insurance information' };
      }

      // Reload patients to get the updated list
      await loadPatients();
      
      return { success: true, data: patientData };
    } catch (error: any) {
      console.error('Error creating patient:', error);
      return { success: false, error: error.message || 'An unexpected error occurred' };
    }
  }, [loadPatients]);

  const updatePatient = useCallback(async (patientId: string, formData: PatientFormData): Promise<ApiResponse> => {
    try {
      // Transform and validate form data
      const transformedData = formDataToPatientData(formData);
      
      // Validate medical data
      const medicalValidation = validateMedicalData(transformedData.medicalHistory);
      if (!medicalValidation.isValid) {
        return { success: false, error: `Medical data validation failed: ${medicalValidation.errors.join(', ')}` };
      }

      // Update patient record
      const { error: patientError } = await supabase
        .from('patients')
        .update(transformedData.patient)
        .eq('id', patientId);

      if (patientError) {
        console.error('Error updating patient:', patientError);
        if (patientError.code === '23505' && patientError.message.includes('patients_id_number_key')) {
          return { success: false, error: 'A patient with this ID number already exists. Please check the ID number and try again.', field: 'idNumber' };
        }
        return { success: false, error: patientError.message };
      }

      // Update or create next of kin record
      const { error: nextOfKinError } = await supabase
        .from('next_of_kin')
        .upsert([{
          patient_id: patientId,
          ...transformedData.nextOfKin
        }], { onConflict: 'patient_id' });

      if (nextOfKinError) {
        console.error('Error updating next of kin:', nextOfKinError);
        return { success: false, error: 'Failed to update emergency contact information' };
      }

      // Update or create medical history record
      const { error: medicalHistoryError } = await supabase
        .from('medical_histories')
        .upsert([{
          patient_id: patientId,
          ...transformedData.medicalHistory
        }], { onConflict: 'patient_id' });

      if (medicalHistoryError) {
        console.error('Error updating medical history:', medicalHistoryError);
        return { success: false, error: 'Failed to update medical history' };
      }

      // Update or create insurance details record
      const { error: insuranceError } = await supabase
        .from('insurance_details')
        .upsert([{
          patient_id: patientId,
          ...transformedData.insuranceDetails
        }], { onConflict: 'patient_id' });

      if (insuranceError) {
        console.error('Error updating insurance details:', insuranceError);
        return { success: false, error: 'Failed to update insurance information' };
      }

      // Reload patients to get the updated list
      await loadPatients();
      
      return { success: true };
    } catch (error: any) {
      console.error('Error updating patient:', error);
      return { success: false, error: error.message || 'An unexpected error occurred' };
    }
  }, [loadPatients]);

  const deletePatient = useCallback(async (patientId: string): Promise<ApiResponse> => {
    try {
      // Delete patient (cascade will handle related records)
      const { error } = await supabase
        .from('patients')
        .delete()
        .eq('id', patientId);

      if (error) {
        console.error('Error deleting patient:', error);
        return { success: false, error: error.message };
      }

      // Reload patients to get the updated list
      await loadPatients();
      
      return { success: true };
    } catch (error: any) {
      console.error('Error deleting patient:', error);
      return { success: false, error: error.message || 'An unexpected error occurred' };
    }
  }, [loadPatients]);

  const getPatientById = useCallback(async (patientId: string): Promise<Patient | null> => {
    try {
      const { data, error } = await supabase
        .rpc('get_complete_patient_data', { patient_uuid: patientId });

      if (error) {
        console.error('Error loading patient:', error);
        return null;
      }

      if (!data) {
        return null;
      }

      // Transform the JSON response to Patient object
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
        medicalHistory: data.medicalHistory ? {
          id: data.medicalHistory.id,
          patientId: data.id,
          height: data.medicalHistory.height,
          weight: data.medicalHistory.weight,
          bloodType: data.medicalHistory.bloodType,
          allergies: data.medicalHistory.allergies || [],
          chronicConditions: data.medicalHistory.chronicConditions || [],
          currentMedications: data.medicalHistory.currentMedications || [],
          pastSurgeries: data.medicalHistory.pastSurgeries || [],
          familyHistory: data.medicalHistory.familyHistory,
          smokingStatus: data.medicalHistory.smokingStatus || 'never',
          alcoholConsumption: data.medicalHistory.alcoholConsumption || 'never',
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        } : undefined,
        insuranceDetails: data.insuranceDetails ? {
          id: data.insuranceDetails.id,
          patientId: data.id,
          fundName: data.insuranceDetails.fundName,
          memberNumber: data.insuranceDetails.memberNumber,
          plan: data.insuranceDetails.plan,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        } : undefined,
        nextOfKin: data.nextOfKin ? {
          id: data.nextOfKin.id,
          patientId: data.id,
          name: data.nextOfKin.name,
          relationship: data.nextOfKin.relationship,
          phone: data.nextOfKin.phone,
          alternatePhone: data.nextOfKin.alternatePhone,
          email: data.nextOfKin.email,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        } : undefined,
      };

      return patient;
    } catch (error) {
      console.error('Error loading patient:', error);
      return null;
    }
  }, []);

  const startConsultation = useCallback(async (patientId: string, doctorId: string): Promise<ApiResponse> => {
    try {
      const { data, error } = await supabase
        .rpc('start_consultation', {
          p_patient_id: patientId,
          p_doctor_id: doctorId
        });

      if (error) {
        console.error('Error starting consultation:', error);
        return { success: false, error: error.message };
      }

      const result = data as { success: boolean; error?: string };

      if (!result.success) {
        return { success: false, error: result.error || 'Failed to start consultation' };
      }

      // Realtime will handle the update, but we can reload to be sure
      await loadPatients();

      return { success: true };
    } catch (error: any) {
      console.error('Error starting consultation:', error);
      return { success: false, error: error.message || 'An unexpected error occurred' };
    }
  }, [loadPatients]);

  const completeConsultation = useCallback(async (patientId: string, doctorId: string): Promise<ApiResponse> => {
    try {
      const { data, error } = await supabase
        .rpc('complete_consultation', {
          p_patient_id: patientId,
          p_doctor_id: doctorId
        });

      if (error) {
        console.error('Error completing consultation:', error);
        return { success: false, error: error.message };
      }

      const result = data as { success: boolean; error?: string };

      if (!result.success) {
        return { success: false, error: result.error || 'Failed to complete consultation' };
      }

      // Realtime will handle the update, but we can reload to be sure
      await loadPatients();

      return { success: true };
    } catch (error: any) {
      console.error('Error completing consultation:', error);
      return { success: false, error: error.message || 'An unexpected error occurred' };
    }
  }, [loadPatients]);

  return {
    patients,
    loading,
    addPatient: createPatient,
    updatePatient,
    deletePatient,
    getPatientById,
    reloadPatients: loadPatients,
    newPatientAdded, // For showing notifications
    clearNewPatientNotification: () => setNewPatientAdded(null),
    // Queue management
    startConsultation,
    completeConsultation
  };
};
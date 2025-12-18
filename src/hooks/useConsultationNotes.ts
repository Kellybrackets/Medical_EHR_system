import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthContext } from '../contexts/AuthProvider';

export interface ConsultationNote {
  id: string;
  patientId: string;
  date: string;
  reasonForVisit: string;
  icd10Code?: string;
  clinicalNotes: string;
  createdAt: string;
}

interface AddConsultationData {
  patientId: string;
  date: string;
  reasonForVisit: string;
  icd10Code?: string;
  clinicalNotes: string;
}

interface HookResult {
  success: boolean;
  error?: string;
  data?: any;
}

export const useConsultationNotes = () => {
  const [consultationNotes, setConsultationNotes] = useState<ConsultationNote[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthContext();

  const loadConsultationNotes = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('consultation_notes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading consultation notes:', error);
        return;
      }

      const formattedNotes = data?.map(note => ({
        id: note.id,
        patientId: note.patient_id,
        date: note.date,
        reasonForVisit: note.reason_for_visit,
        icd10Code: note.icd10_code || undefined,
        clinicalNotes: note.clinical_notes || '',
        createdAt: note.created_at
      })) || [];

      setConsultationNotes(formattedNotes);
    } catch (error) {
      console.error('Error loading consultation notes:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConsultationNotes();
  }, [loadConsultationNotes]);


  const addConsultationNote = useCallback(async (data: AddConsultationData): Promise<HookResult> => {
    try {
      console.log('🚀 Starting addConsultationNote...');
      console.log('👤 Current user:', user);
      
      // Temporary fix: Use demo doctor ID or first available doctor
      let doctorId = user?.id;
      
      if (!doctorId) {
        console.warn('⚠️ No authenticated user, checking for existing doctors...');
        
        // Try to find any existing doctor in the database
        const { data: doctors } = await supabase
          .from('users')
          .select('id')
          .eq('role', 'doctor')
          .limit(1);
        
        if (doctors && doctors.length > 0) {
          doctorId = doctors[0].id;
          console.log('✅ Using existing doctor:', doctorId);
        } else {
          console.log('❌ No doctors found, using demo doctor ID');
          // Use the demo doctor ID that should be created by running CONSULTATION_FIX.sql
          doctorId = '00000000-0000-0000-0000-000000000001';
        }
      }

      console.log('🔍 Saving consultation note with data:', data);
      console.log('🆔 Doctor ID:', doctorId);
      
      // Prepare the insert data - handle null doctor_id gracefully
      const insertData: any = {
        patient_id: data.patientId,
        date: data.date,
        reason_for_visit: data.reasonForVisit,
        icd10_code: data.icd10Code || null,
        clinical_notes: data.clinicalNotes
      };
      
      // Only add doctor_id if we have one
      if (doctorId) {
        insertData.doctor_id = doctorId;
      }
      
      console.log('📤 Insert data:', insertData);
      
      const { data: result, error } = await supabase
        .from('consultation_notes')
        .insert([insertData])
        .select()
        .single();
      
      console.log('📊 Insert result:', { result, error });

      if (error) {
        console.error('Error creating consultation note:', error);
        return { success: false, error: error.message };
      }

      // Reload consultation notes to get the updated list
      await loadConsultationNotes();
      
      return { success: true, data: result };
    } catch (error: any) {
      console.error('Error adding consultation note:', error);
      return { success: false, error: error.message || 'Failed to add consultation note' };
    }
  }, [user, loadConsultationNotes]);

  const updateConsultationNote = useCallback(async (
    id: string,
    data: Partial<AddConsultationData>
  ): Promise<HookResult> => {
    try {
      const updateData: any = {};
      if (data.date) updateData.date = data.date;
      if (data.reasonForVisit) updateData.reason_for_visit = data.reasonForVisit;
      if (data.icd10Code !== undefined) updateData.icd10_code = data.icd10Code || null;
      if (data.clinicalNotes !== undefined) updateData.clinical_notes = data.clinicalNotes;

      const { error } = await supabase
        .from('consultation_notes')
        .update(updateData)
        .eq('id', id);

      if (error) {
        console.error('Error updating consultation note:', error);
        return { success: false, error: error.message };
      }

      // Reload consultation notes to get the updated list
      await loadConsultationNotes();
      
      return { success: true };
    } catch (error: any) {
      console.error('Error updating consultation note:', error);
      return { success: false, error: error.message || 'Failed to update consultation note' };
    }
  }, [loadConsultationNotes]);

  const deleteConsultationNote = useCallback(async (id: string): Promise<HookResult> => {
    try {
      const { error } = await supabase
        .from('consultation_notes')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting consultation note:', error);
        return { success: false, error: error.message };
      }

      // Reload consultation notes to get the updated list
      await loadConsultationNotes();
      
      return { success: true };
    } catch (error: any) {
      console.error('Error deleting consultation note:', error);
      return { success: false, error: error.message || 'Failed to delete consultation note' };
    }
  }, [loadConsultationNotes]);

  const getConsultationsByPatient = useCallback((patientId: string) => {
    return consultationNotes
      .filter(note => note.patientId === patientId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [consultationNotes]);

  return {
    consultationNotes,
    loading,
    addConsultationNote,
    updateConsultationNote,
    deleteConsultationNote,
    getConsultationsByPatient
  };
};
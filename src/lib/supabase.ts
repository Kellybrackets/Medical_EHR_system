import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create a dummy client if environment variables are not set
const defaultUrl = 'https://placeholder.supabase.co';
const defaultKey = 'placeholder-key';

export const supabase = createClient(
  supabaseUrl || defaultUrl,
  supabaseAnonKey || defaultKey
);

// Check if Supabase is properly configured
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey && 
  supabaseUrl !== 'your_supabase_project_url' && 
  supabaseAnonKey !== 'your_supabase_anon_key');

// Database types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          username: string;
          role: 'doctor' | 'receptionist';
          name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          username: string;
          role: 'doctor' | 'receptionist';
          name: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          role?: 'doctor' | 'receptionist';
          name?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      patients: {
        Row: {
          id: string;
          first_name: string;
          surname: string;
          id_number: string;
          sex: 'Male' | 'Female' | 'Other';
          date_of_birth: string;
          age: number;
          contact_number: string;
          address: string;
          next_of_kin: {
            name: string;
            relationship: string;
            phone: string;
          };
          medical_aid: {
            fundName: string;
            memberNumber: string;
            plan: string;
          };
          medical_history: {
            allergies: string[];
            chronicConditions: string[];
            pastDiagnoses: string[];
          };
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          first_name: string;
          surname: string;
          id_number: string;
          sex: 'Male' | 'Female' | 'Other';
          date_of_birth: string;
          age: number;
          contact_number: string;
          address: string;
          next_of_kin: {
            name: string;
            relationship: string;
            phone: string;
          };
          medical_aid: {
            fundName: string;
            memberNumber: string;
            plan: string;
          };
          medical_history: {
            allergies: string[];
            chronicConditions: string[];
            pastDiagnoses: string[];
          };
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          first_name?: string;
          surname?: string;
          id_number?: string;
          sex?: 'Male' | 'Female' | 'Other';
          date_of_birth?: string;
          age?: number;
          contact_number?: string;
          address?: string;
          next_of_kin?: {
            name: string;
            relationship: string;
            phone: string;
          };
          medical_aid?: {
            fundName: string;
            memberNumber: string;
            plan: string;
          };
          medical_history?: {
            allergies: string[];
            chronicConditions: string[];
            pastDiagnoses: string[];
          };
          created_at?: string;
          updated_at?: string;
        };
      };
      consultation_notes: {
        Row: {
          id: string;
          patient_id: string;
          doctor_id: string;
          date: string;
          reason_for_visit: string;
          icd10_code: string | null;
          soap: {
            subjective: string;
            objective: string;
            assessment: string;
            plan: string;
          };
          created_at: string;
        };
        Insert: {
          id?: string;
          patient_id: string;
          doctor_id: string;
          date: string;
          reason_for_visit: string;
          icd10_code?: string | null;
          soap: {
            subjective: string;
            objective: string;
            assessment: string;
            plan: string;
          };
          created_at?: string;
        };
        Update: {
          id?: string;
          patient_id?: string;
          doctor_id?: string;
          date?: string;
          reason_for_visit?: string;
          icd10_code?: string | null;
          soap?: {
            subjective: string;
            objective: string;
            assessment: string;
            plan: string;
          };
          created_at?: string;
        };
      };
    };
  };
}
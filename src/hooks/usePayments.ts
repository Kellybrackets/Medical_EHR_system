import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from '../components/ui/Toast';

export interface Payment {
    id: string;
    patient_id: string;
    amount: number;
    method: 'cash' | 'card' | 'eft' | 'medical_aid';
    status: 'pending' | 'completed' | 'failed' | 'refunded';
    reference?: string;
    proof_url?: string;
    notes?: string;
    created_at: string;
    patient?: {
        firstName: string;
        surname: string;
        idNumber: string;
    };
}

export function usePayments() {
    const [loading, setLoading] = useState(false);
    const [payments, setPayments] = useState<Payment[]>([]);
    const { showToast } = useToast();

    const fetchPayments = useCallback(async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('payments')
                .select(`
          *,
          patient:patients(firstName, surname, idNumber)
        `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setPayments(data || []);
        } catch (error: any) {
            console.error('Error fetching payments:', error);
            showToast('Failed to fetch payments', 'error');
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    const createPayment = async (paymentData: {
        patient_id: string;
        amount: number;
        method: string;
        reference?: string;
        notes?: string;
        proofFile?: File;
    }) => {
        try {
            setLoading(true);
            let proof_url = null;

            // Upload proof if exists
            if (paymentData.proofFile) {
                const fileExt = paymentData.proofFile.name.split('.').pop();
                const fileName = `${Math.random()}.${fileExt}`;
                const filePath = `${paymentData.patient_id}/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('payment-proofs')
                    .upload(filePath, paymentData.proofFile);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('payment-proofs')
                    .getPublicUrl(filePath);

                proof_url = publicUrl;
            }

            // Create payment record
            const { error } = await supabase
                .from('payments')
                .insert({
                    patient_id: paymentData.patient_id,
                    amount: paymentData.amount,
                    method: paymentData.method,
                    reference: paymentData.reference,
                    notes: paymentData.notes,
                    proof_url,
                    status: 'completed' // Default to completed for cashier
                });

            if (error) throw error;

            showToast('Payment recorded successfully', 'success');
            await fetchPayments();
            return { success: true };
        } catch (error: any) {
            console.error('Error creating payment:', error);
            return { success: false, error: error.message };
        } finally {
            setLoading(false);
        }
    };

    return {
        payments,
        loading,
        fetchPayments,
        createPayment
    };
}

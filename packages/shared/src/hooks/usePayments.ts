import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { getPaymentTrancheStatus } from '../lib/utils';
import type { PaymentSummary, TrancheWithPayments, PaymentHistoryItem } from '../types/payments';

export function usePayments(studentId: string | undefined, schoolYearId?: string) {
  return useQuery<PaymentSummary | null>({
    queryKey: ['payments', studentId, schoolYearId],
    queryFn: async () => {
      if (!studentId) return null;

      // Get the student's enrollment for this year
      let query = supabase
        .from('student_school_year_loggings')
        .select('*')
        .eq('student_id', studentId)
        .is('deleted_at', null);

      if (schoolYearId) {
        query = query.eq('school_year_id', schoolYearId);
      }

      const { data: loggings } = await query.order('created_at', { ascending: false }).limit(1) as any;
      if (!loggings || loggings.length === 0) return null;
      const logging = loggings[0];

      // Get fees structure via school_fees_id from the logging
      const feesId = logging.school_fees_id;
      if (!feesId) return null;

      const { data: fees } = await supabase
        .from('classroom_school_fees')
        .select('*')
        .eq('id', feesId)
        .single() as any;
      if (!fees) return null;

      // Get fee parts
      const { data: parts } = await supabase
        .from('classroom_school_fees_by_parts')
        .select('*')
        .eq('school_fees_id', feesId)
        .is('deleted_at', null)
        .order('order') as any;

      // Get student payment parts for this enrollment
      const partIds = (parts || []).map((p: any) => p.id);
      const { data: paidParts } = await supabase
        .from('student_paiement_by_parts')
        .select('*')
        .eq('student_school_year_logging_id', logging.id)
        .in('part_id', partIds.length > 0 ? partIds : ['__none__'])
        .is('deleted_at', null) as any;

      const tranches: TrancheWithPayments[] = (parts || []).map((part: any) => {
        const paid = (paidParts || [])
          .filter((p: any) => p.part_id === part.id)
          .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
        return {
          ...part,
          amountPaid: paid,
          remaining: Math.max(0, (part.amount || 0) - paid),
          status: getPaymentTrancheStatus(part.due_date || '', paid, part.amount || 0),
        };
      });

      const totalPaid = logging.school_fees_paid || 0;
      const totalFees = logging.school_fees_total || 0;
      const discount = logging.discount || 0;

      return {
        totalFees,
        totalPaid,
        totalRemaining: Math.max(0, totalFees - discount - totalPaid),
        discount,
        registrationFees: parseFloat(fees.registration_fees || '0'),
        additionnalFees: parseFloat(fees.additionnal_fees || '0'),
        schoolFees: parseFloat(fees.school_fees || '0'),
        schoolFeesNet: parseFloat(fees.school_fees_net || '0'),
        tranches,
      };
    },
    enabled: !!studentId,
  });
}

export function usePaymentHistory(studentId: string | undefined) {
  return useQuery<PaymentHistoryItem[]>({
    queryKey: ['payment-history', studentId],
    queryFn: async () => {
      if (!studentId) return [];

      // Get enrollments for this student
      const { data: loggings } = await supabase
        .from('student_school_year_loggings')
        .select('id')
        .eq('student_id', studentId)
        .is('deleted_at', null) as any;

      if (!loggings || loggings.length === 0) return [];
      const loggingIds = loggings.map((l: any) => l.id);

      const { data, error } = await supabase
        .from('paiements')
        .select('*')
        .in('student_school_year_logging_id', loggingIds)
        .is('deleted_at', null)
        .order('created_at', { ascending: false }) as any;
      if (error) throw error;
      return (data || []) as PaymentHistoryItem[];
    },
    enabled: !!studentId,
  });
}

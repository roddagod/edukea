import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface SsylInstallmentStatus {
  ssyl_id: string;
  installment_id: string;
  label: string;
  category: string;
  due_date: string;
  amount_due: number;
  amount_paid: number;
  status: 'paid' | 'partial' | 'due' | 'overdue' | 'future';
}

export function useSsylInstallmentStatus(ssylId: string | undefined) {
  return useQuery<SsylInstallmentStatus[]>({
    queryKey: ['ssyl-installment-status', ssylId],
    queryFn: async () => {
      if (!ssylId) return [];
      const { data, error } = await supabase
        .from('v_ssyl_installment_status')
        .select('*')
        .eq('ssyl_id', ssylId)
        .order('due_date');
      if (error) throw error;
      return (data ?? []) as SsylInstallmentStatus[];
    },
    enabled: !!ssylId,
  });
}

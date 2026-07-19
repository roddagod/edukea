import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export type CockpitPaymentStatus = 'solde' | 'debute' | 'impaye';

export interface RecentPaymentRow {
  id: string;
  occurred_at: string;
  amount: number;
  source: string | null;
  student_name: string;
  matricule: string | null;
  class_name: string;
  status: CockpitPaymentStatus;
}

const THIRTY_SECONDS = 30 * 1000;

/**
 * Retourne les N dernières transactions "paiement" postées pour une école
 * ET une année scolaire, décorées avec nom élève / matricule / classe / statut R/J/V.
 *
 * Version optimisee : une seule SELECT sur la view v_recent_ledger_payments
 * (au lieu du waterfall de 6 requetes de la V1). Cache 30s.
 *
 * Si `schoolYearId` est absent, retourne les transactions toutes années
 * confondues (fallback pour compat V1).
 */
export function useRecentPayments(
  schoolId: string | undefined,
  limit = 10,
  schoolYearId?: string,
) {
  return useQuery<RecentPaymentRow[]>({
    queryKey: ['ledger', 'recent-payments', schoolId, schoolYearId, limit],
    enabled: !!schoolId,
    staleTime: THIRTY_SECONDS,
    gcTime: THIRTY_SECONDS * 4,
    queryFn: async () => {
      let query = supabase
        .from('v_recent_ledger_payments')
        .select('tx_id, occurred_at, amount, source, paiement_type, student_name, matricule, classroom_name, status')
        .eq('school_id', schoolId!);
      if (schoolYearId) query = query.eq('school_year_id', schoolYearId);
      const { data, error } = await query
        .order('occurred_at', { ascending: false })
        .limit(limit);
      if (error) throw error;

      type Row = {
        tx_id: string;
        occurred_at: string;
        amount: number;
        source: string | null;
        paiement_type: string | null;
        student_name: string | null;
        matricule: string | null;
        classroom_name: string | null;
        status: CockpitPaymentStatus;
      };

      return ((data as Row[] | null) ?? []).map((r) => ({
        id: r.tx_id,
        occurred_at: r.occurred_at,
        amount: Number(r.amount),
        source: r.paiement_type ?? r.source,
        student_name: r.student_name ?? 'Élève inconnu',
        matricule: r.matricule,
        class_name: r.classroom_name ?? '',
        status: r.status,
      }));
    },
  });
}

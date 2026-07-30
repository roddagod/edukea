import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { RecoveryStatus } from './useRecoveryStudents';

export interface StudentDetail {
  ssyl_id: string;
  school_id: string;
  school_year_id: string;
  student_id: string;
  student_firstname: string | null;
  student_lastname: string | null;
  student_name: string;
  matricule: string | null;
  classroom_id: string | null;
  classroom_name: string | null;
  level_name: string | null;
  cycle_name: string | null;
  billed_initial: number;
  collected: number;
  remaining: number;
  status: RecoveryStatus;
}

export interface StudentPaymentHistoryRow {
  tx_id: string;
  occurred_at: string;
  amount: number;
  source: string | null;
  memo: string | null;
}

/**
 * Détail complet d'un élève × année scolaire (identité + solde + statut).
 */
export function useStudentDetail(ssylId: string | undefined) {
  return useQuery<StudentDetail | null>({
    queryKey: ['student-detail', ssylId],
    enabled: !!ssylId,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_recovery_students')
        .select('*')
        .eq('ssyl_id', ssylId!)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const d = data as StudentDetail & { billed_initial: string | number; collected: string | number; remaining: string | number };
      return { ...d, billed_initial: Number(d.billed_initial), collected: Number(d.collected), remaining: Number(d.remaining) };
    },
  });
}

/**
 * Historique des versements ledger d'un élève (toutes les tx paiement postées).
 */
export function useStudentPaymentHistory(ssylId: string | undefined, limit = 50) {
  return useQuery<StudentPaymentHistoryRow[]>({
    queryKey: ['student-payment-history', ssylId, limit],
    enabled: !!ssylId,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    queryFn: async () => {
      // Recuperer le compte student_receivable de ce ssyl, puis les entries credit dessus
      const { data: acc, error: accErr } = await supabase
        .from('ledger_accounts')
        .select('id')
        .eq('kind', 'student_receivable')
        .eq('student_ssyl_id', ssylId!)
        .maybeSingle();
      if (accErr) throw accErr;
      if (!acc) return [];

      const { data, error } = await supabase
        .from('ledger_entries')
        .select('transaction_id, amount, occurred_at')
        .eq('account_id', (acc as { id: string }).id)
        .eq('direction', 'credit')
        .order('occurred_at', { ascending: false })
        .limit(limit);
      if (error) throw error;

      const rows = (data as Array<{ transaction_id: string; amount: number; occurred_at: string }> | null) ?? [];
      if (rows.length === 0) return [];

      const txIds = rows.map((r) => r.transaction_id);
      const { data: txs } = await supabase
        .from('ledger_transactions')
        .select('id, source, memo, ref_type')
        .in('id', txIds);
      const txById = new Map<string, { source: string | null; memo: string | null; ref_type: string | null }>();
      for (const t of (txs as Array<{ id: string; source: string | null; memo: string | null; ref_type: string | null }> | null) ?? []) {
        txById.set(t.id, { source: t.source, memo: t.memo, ref_type: t.ref_type });
      }

      // Filtrer les openings (ce sont des "billed", pas des paiements)
      return rows
        .filter((r) => txById.get(r.transaction_id)?.ref_type !== 'opening')
        .map((r) => ({
          tx_id: r.transaction_id,
          occurred_at: r.occurred_at,
          amount: Number(r.amount),
          source: txById.get(r.transaction_id)?.source ?? null,
          memo: txById.get(r.transaction_id)?.memo ?? null,
        }));
    },
  });
}

export interface RecordPaymentArgs {
  ssylId: string;
  amount: number;
  source: 'cash' | 'bank_transfer' | 'internal';
  memo?: string;
  occurredAt?: string;
}

/**
 * Mutation pour enregistrer un versement élève. Invalide les queries
 * de la fiche élève, de la liste recouvrement, et du cockpit (treasury/recovery).
 */
export function useRecordPayment() {
  const qc = useQueryClient();
  return useMutation<string, Error, RecordPaymentArgs>({
    mutationFn: async (args) => {
      const { data, error } = await supabase.rpc('record_student_payment', {
        p_ssyl_id: args.ssylId,
        p_amount: args.amount,
        p_source: args.source,
        p_memo: args.memo ?? null,
        p_occurred_at: args.occurredAt ?? null,
      });
      if (error) throw error;
      return data as string;
    },
    onSuccess: (_txId, args) => {
      qc.invalidateQueries({ queryKey: ['student-detail', args.ssylId] });
      qc.invalidateQueries({ queryKey: ['student-payment-history', args.ssylId] });
      qc.invalidateQueries({ queryKey: ['ssyl-installment-status', args.ssylId] });
      qc.invalidateQueries({ queryKey: ['recovery-students'] });
      qc.invalidateQueries({ queryKey: ['ledger'] });
      qc.invalidateQueries({ queryKey: ['ledger-tx'] });
      qc.invalidateQueries({ queryKey: ['ssyl-detail', args.ssylId] });
    },
  });
}

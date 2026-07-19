import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type {
  LedgerAccount,
  LedgerAccountBalance,
  LedgerTransaction,
  LedgerEntry,
  SchoolTreasury,
  SchoolTreasuryByYear,
  StudentReceivable,
  SchoolRecovery,
  PostLedgerTransactionArgs,
} from '../types/ledger';

/**
 * Trésorerie scopée à une année scolaire (montants encaissés dans le contexte
 * de la sélection année). Utilisé par le cockpit pour refléter l'année active.
 */
export function useSchoolTreasuryByYear(schoolId: string | undefined, schoolYearId: string | undefined) {
  return useQuery<SchoolTreasuryByYear | null>({
    queryKey: ['ledger', 'treasury-by-year', schoolId, schoolYearId],
    enabled: !!schoolId && !!schoolYearId,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_school_treasury_by_year')
        .select('*')
        .eq('school_id', schoolId!)
        .eq('school_year_id', schoolYearId!)
        .maybeSingle();
      if (error) throw error;
      return (data as SchoolTreasuryByYear | null) ?? null;
    },
  });
}

// Cache tuning : les données ledger changent quand un versement est fait.
// Le user a un bouton "Actualiser" pour forcer, sinon 30s de fraicheur suffisent.
const LEDGER_STALE = 30 * 1000;
const LEDGER_GC = 5 * 60 * 1000;

export function useSchoolRecovery(schoolId: string | undefined, schoolYearId: string | undefined) {
  return useQuery<SchoolRecovery | null>({
    queryKey: ['ledger', 'recovery', schoolId, schoolYearId],
    enabled: !!schoolId && !!schoolYearId,
    staleTime: LEDGER_STALE,
    gcTime: LEDGER_GC,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_school_recovery')
        .select('*')
        .eq('school_id', schoolId!)
        .eq('school_year_id', schoolYearId!)
        .maybeSingle();
      if (error) throw error;
      return (data as SchoolRecovery | null) ?? null;
    },
  });
}

export function useSchoolTreasury(schoolId: string | undefined) {
  return useQuery<SchoolTreasury | null>({
    queryKey: ['ledger', 'treasury', schoolId],
    enabled: !!schoolId,
    staleTime: LEDGER_STALE,
    gcTime: LEDGER_GC,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_school_treasury')
        .select('*')
        .eq('school_id', schoolId!)
        .maybeSingle();
      if (error) throw error;
      return (data as SchoolTreasury | null) ?? null;
    },
  });
}

export function useStudentReceivable(studentSsylId: string | undefined) {
  return useQuery<StudentReceivable | null>({
    queryKey: ['ledger', 'receivable', studentSsylId],
    enabled: !!studentSsylId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_student_receivable')
        .select('*')
        .eq('student_ssyl_id', studentSsylId!)
        .maybeSingle();
      if (error) throw error;
      return (data as StudentReceivable | null) ?? null;
    },
  });
}

export function useLedgerAccountBalance(accountId: string | undefined) {
  return useQuery<LedgerAccountBalance | null>({
    queryKey: ['ledger', 'account-balance', accountId],
    enabled: !!accountId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_ledger_account_balance')
        .select('*')
        .eq('account_id', accountId!)
        .maybeSingle();
      if (error) throw error;
      return (data as LedgerAccountBalance | null) ?? null;
    },
  });
}

export function useLedgerAccounts(schoolId: string | undefined) {
  return useQuery<LedgerAccount[]>({
    queryKey: ['ledger', 'accounts', schoolId],
    enabled: !!schoolId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ledger_accounts')
        .select('*')
        .eq('school_id', schoolId!)
        .eq('is_active', true)
        .order('kind');
      if (error) throw error;
      return (data as LedgerAccount[]) ?? [];
    },
  });
}

export function useLedgerTransactions(schoolId: string | undefined, limit = 50) {
  return useQuery<LedgerTransaction[]>({
    queryKey: ['ledger', 'transactions', schoolId, limit],
    enabled: !!schoolId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ledger_transactions')
        .select('*')
        .eq('school_id', schoolId!)
        .eq('status', 'posted')
        .order('occurred_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data as LedgerTransaction[]) ?? [];
    },
  });
}

export function useLedgerEntriesForTransaction(transactionId: string | undefined) {
  return useQuery<LedgerEntry[]>({
    queryKey: ['ledger', 'entries', transactionId],
    enabled: !!transactionId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ledger_entries')
        .select('*')
        .eq('transaction_id', transactionId!)
        .order('created_at');
      if (error) throw error;
      return (data as LedgerEntry[]) ?? [];
    },
  });
}

export function usePostLedgerTransaction() {
  const qc = useQueryClient();
  return useMutation<string, Error, PostLedgerTransactionArgs>({
    mutationFn: async (args) => {
      const { data, error } = await supabase.rpc('ledger_post_transaction', {
        p_school_id: args.school_id,
        p_school_year_id: args.school_year_id ?? null,
        p_source: args.source,
        p_ref_type: args.ref_type ?? null,
        p_ref_id: args.ref_id ?? null,
        p_external_ref: args.external_ref ?? null,
        p_memo: args.memo ?? null,
        p_occurred_at: args.occurred_at ?? null,
        p_entries: args.entries,
      });
      if (error) throw error;
      return data as string;
    },
    onSuccess: (_txId, args) => {
      qc.invalidateQueries({ queryKey: ['ledger', 'treasury', args.school_id] });
      qc.invalidateQueries({ queryKey: ['ledger', 'transactions', args.school_id] });
      qc.invalidateQueries({ queryKey: ['ledger', 'accounts', args.school_id] });
      qc.invalidateQueries({ queryKey: ['ledger'] });
    },
  });
}

export function useReverseLedgerTransaction() {
  const qc = useQueryClient();
  return useMutation<string, Error, { transactionId: string; memo?: string; schoolId?: string }>({
    mutationFn: async ({ transactionId, memo }) => {
      const { data, error } = await supabase.rpc('ledger_reverse_transaction', {
        p_tx_id: transactionId,
        p_memo: memo ?? null,
      });
      if (error) throw error;
      return data as string;
    },
    onSuccess: (_id, vars) => {
      qc.invalidateQueries({ queryKey: ['ledger'] });
      if (vars.schoolId) {
        qc.invalidateQueries({ queryKey: ['ledger', 'treasury', vars.schoolId] });
      }
    },
  });
}

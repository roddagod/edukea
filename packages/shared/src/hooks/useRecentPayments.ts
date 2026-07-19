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

/**
 * Retourne les N dernières transactions "paiement" postées pour une école,
 * décorées avec nom élève / matricule / classe / statut (soldé/débuté/impayé).
 *
 * Le statut est calculé sur le solde restant du student_receivable de l'élève :
 * - remaining <= 0 → solde
 * - 0 < remaining < billed_initial → debute
 * - remaining >= billed_initial → impaye
 */
export function useRecentPayments(schoolId: string | undefined, limit = 10) {
  return useQuery<RecentPaymentRow[]>({
    queryKey: ['ledger', 'recent-payments', schoolId, limit],
    enabled: !!schoolId,
    queryFn: async () => {
      // 1. Fetch dernières transactions paiement (via ledger_transactions)
      const { data: txs, error } = await supabase
        .from('ledger_transactions')
        .select('id, occurred_at, source, ref_id, school_year_id')
        .eq('school_id', schoolId!)
        .eq('ref_type', 'paiement')
        .eq('status', 'posted')
        .order('occurred_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      if (!txs || txs.length === 0) return [];

      // 2. Fetch amount de chaque tx (depuis ledger_entries, direction=debit)
      const txIds = txs.map((t) => t.id);
      const { data: entries } = await supabase
        .from('ledger_entries')
        .select('transaction_id, amount, direction')
        .in('transaction_id', txIds)
        .eq('direction', 'debit');
      const amountByTx = new Map<string, number>();
      for (const e of entries ?? []) amountByTx.set(e.transaction_id as string, Number(e.amount));

      // 3. Fetch les paiements réels (via ref_id) pour récup ssyl_id
      const paiementIds = txs.map((t) => t.ref_id).filter(Boolean) as string[];
      const { data: paiements } = await supabase
        .from('paiements')
        .select('id, student_school_year_logging_id')
        .in('id', paiementIds);
      const ssylByPaiement = new Map<string, string>();
      for (const p of paiements ?? []) ssylByPaiement.set(p.id as string, p.student_school_year_logging_id as string);

      // 4. Fetch les SSYL avec élève + classroom
      const ssylIds = Array.from(new Set(Array.from(ssylByPaiement.values())));
      const { data: ssylRows } = await supabase
        .from('student_school_year_loggings')
        .select('id, student_id, classroom_id, school_fees_total')
        .in('id', ssylIds);
      const ssylById = new Map<string, { student_id: string | null; classroom_id: string | null; billed: number }>();
      for (const s of ssylRows ?? []) {
        ssylById.set(s.id as string, {
          student_id: (s.student_id as string) ?? null,
          classroom_id: (s.classroom_id as string) ?? null,
          billed: Number(s.school_fees_total ?? 0),
        });
      }

      // 5. Fetch students (nom + matricule)
      const studentIds = Array.from(new Set(Array.from(ssylById.values()).map((v) => v.student_id).filter(Boolean))) as string[];
      const { data: studentsRows } = await supabase
        .from('students')
        .select('id, firstname, lastname, matricule')
        .in('id', studentIds);
      const studentById = new Map<string, { firstname: string | null; lastname: string | null; matricule: string | null }>();
      for (const s of studentsRows ?? []) {
        studentById.set(s.id as string, {
          firstname: (s.firstname as string) ?? null,
          lastname: (s.lastname as string) ?? null,
          matricule: (s.matricule as string) ?? null,
        });
      }

      // 6. Fetch classrooms (nom classe)
      const classroomIds = Array.from(new Set(Array.from(ssylById.values()).map((v) => v.classroom_id).filter(Boolean))) as string[];
      const { data: classroomsRows } = await supabase
        .from('classrooms')
        .select('id, name')
        .in('id', classroomIds);
      const classroomById = new Map<string, string>();
      for (const c of classroomsRows ?? []) classroomById.set(c.id as string, (c.name as string) ?? '');

      // 7. Fetch student_receivable balances pour classification
      const { data: receivables } = await supabase
        .from('v_student_receivable')
        .select('student_ssyl_id, receivable_balance')
        .in('student_ssyl_id', ssylIds);
      const remainingByS: Map<string, number> = new Map();
      for (const r of receivables ?? []) remainingByS.set(r.student_ssyl_id as string, Number(r.receivable_balance));

      const rows: RecentPaymentRow[] = txs.map((t) => {
        const ssylId = ssylByPaiement.get((t.ref_id as string) ?? '') ?? '';
        const ssyl = ssylById.get(ssylId);
        const student = ssyl?.student_id ? studentById.get(ssyl.student_id) : undefined;
        const classroomName = ssyl?.classroom_id ? classroomById.get(ssyl.classroom_id) ?? '' : '';
        const remaining = remainingByS.get(ssylId) ?? 0;
        const billed = ssyl?.billed ?? 0;
        let status: CockpitPaymentStatus = 'debute';
        if (remaining <= 0) status = 'solde';
        else if (billed > 0 && remaining >= billed) status = 'impaye';

        const name = [student?.lastname, student?.firstname].filter(Boolean).join(' ') || 'Élève inconnu';
        return {
          id: t.id as string,
          occurred_at: t.occurred_at as string,
          amount: amountByTx.get(t.id as string) ?? 0,
          source: (t.source as string) ?? null,
          student_name: name,
          matricule: student?.matricule ?? null,
          class_name: classroomName,
          status,
        };
      });
      return rows;
    },
  });
}

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface EnrollNewStudentPayload {
  school_id: string;
  school_year_id: string;
  classroom_id: string;
  school_fees_id?: string;
  type_student_id?: string;
  billed_total: number;
  student: {
    matricule: string;
    firstname: string;
    lastname: string;
    sex: 'M' | 'F';
    birthdate: string;
    birthplace?: string;
    nationality?: string;
    redoublant?: boolean;
  };
  father?: { id?: string; firstname?: string; lastname?: string; phone?: string; email?: string; job?: string; address?: string; residence?: string };
  mother?: { id?: string; firstname?: string; lastname?: string; phone?: string; email?: string; job?: string; address?: string; residence?: string };
  tutor?:  { id?: string; firstname?: string; lastname?: string; phone?: string; email?: string; job?: string; address?: string; residence?: string };
  discount?: { amount: number; reason: string; note?: string };
  first_payment?: { amount: number; source: 'cash' | 'bank_transfer' | 'internal'; memo?: string };
}

export interface EnrollNewStudentResult {
  student_id: string;
  ssyl_id: string;
  matricule: string;
  opening_tx_id: string | null;
  discount_tx_id: string | null;
  first_payment_tx_id: string | null;
}

export function useEnrollNewStudent() {
  const qc = useQueryClient();
  return useMutation<EnrollNewStudentResult, Error, EnrollNewStudentPayload>({
    mutationFn: async (payload) => {
      const { data, error } = await supabase.rpc('enroll_new_student', { payload });
      if (error) throw error;
      return data as EnrollNewStudentResult;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['enrollment-stats'] });
      qc.invalidateQueries({ queryKey: ['recovery-students'] });
      qc.invalidateQueries({ queryKey: ['ledger'] });
    },
  });
}

export interface ReenrollStudentPayload {
  existing_student_id: string;
  school_id: string;
  school_year_id: string;
  classroom_id: string;
  school_fees_id?: string;
  billed_total: number;
  previous_ssyl_id?: string;
  discount?: { amount: number; reason: string; note?: string };
  first_payment?: { amount: number; source: 'cash' | 'bank_transfer' | 'internal'; memo?: string };
}

export interface ReenrollStudentResult {
  ssyl_id: string;
  opening_tx_id: string | null;
  discount_tx_id: string | null;
  first_payment_tx_id: string | null;
}

export function useReenrollStudent() {
  const qc = useQueryClient();
  return useMutation<ReenrollStudentResult, Error, ReenrollStudentPayload>({
    mutationFn: async (payload) => {
      const { data, error } = await supabase.rpc('reenroll_student', { payload });
      if (error) throw error;
      return data as ReenrollStudentResult;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['enrollment-stats'] });
      qc.invalidateQueries({ queryKey: ['recovery-students'] });
      qc.invalidateQueries({ queryKey: ['ledger'] });
      qc.invalidateQueries({ queryKey: ['year-advancement-preview'] });
    },
  });
}

export type AdvanceDecision = 'advance' | 'repeat' | 'leave' | 'pending';

export interface BulkAdvancePlanEntry {
  ssyl_id: string;
  decision: AdvanceDecision;
  target_classroom_id?: string;
  target_fees_id?: string;
  billed_total?: number;
}

export interface BulkAdvancePayload {
  school_id: string;
  from_year_id: string;
  to_year_id: string;
  plan: BulkAdvancePlanEntry[];
}

export interface BulkAdvanceResult {
  advance: number;
  repeat: number;
  leave: number;
  pending: number;
}

export function useBulkAdvanceYear() {
  const qc = useQueryClient();
  return useMutation<BulkAdvanceResult, Error, BulkAdvancePayload>({
    mutationFn: async (payload) => {
      const { data, error } = await supabase.rpc('bulk_advance_year', { payload });
      if (error) throw error;
      return data as BulkAdvanceResult;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['enrollment-stats'] });
      qc.invalidateQueries({ queryKey: ['recovery-students'] });
      qc.invalidateQueries({ queryKey: ['ledger'] });
      qc.invalidateQueries({ queryKey: ['year-advancement-preview'] });
    },
  });
}

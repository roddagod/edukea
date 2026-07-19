export type LedgerAccountKind =
  | 'student_receivable'
  | 'school_cash'
  | 'school_bank'
  | 'momo_pending'
  | 'momo_settled'
  | 'revenue_registration'
  | 'revenue_school_fees'
  | 'revenue_annex'
  | 'discount'
  | 'commission_lambano'
  | 'commission_payable'
  | 'writeoff';

export type LedgerDirection = 'debit' | 'credit';

export type LedgerSource =
  | 'cash'
  | 'momo'
  | 'bank_transfer'
  | 'internal'
  | 'reversal'
  | 'opening_balance';

export type LedgerTxStatus = 'draft' | 'posted';

export interface LedgerAccount {
  id: string;
  kind: LedgerAccountKind;
  school_id: string | null;
  student_ssyl_id: string | null;
  school_year_id: string | null;
  currency: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export interface LedgerTransaction {
  id: string;
  school_id: string;
  school_year_id: string | null;
  source: LedgerSource;
  status: LedgerTxStatus;
  ref_type: string | null;
  ref_id: string | null;
  external_ref: string | null;
  memo: string | null;
  occurred_at: string;
  posted_at: string | null;
  reversed_by: string | null;
  reversal_of: string | null;
  created_by: string | null;
  created_at: string;
}

export interface LedgerEntry {
  id: string;
  transaction_id: string;
  account_id: string;
  direction: LedgerDirection;
  amount: number;
  currency: string;
  school_id: string;
  occurred_at: string;
  created_at: string;
}

export interface LedgerAccountBalance {
  account_id: string;
  kind: LedgerAccountKind;
  school_id: string | null;
  student_ssyl_id: string | null;
  school_year_id: string | null;
  currency: string;
  balance: number;
}

export interface SchoolTreasury {
  school_id: string;
  currency: string;
  cash_balance: number;
  bank_balance: number;
  momo_pending_balance: number;
  momo_settled_balance: number;
  total_treasury: number;
}

export interface StudentReceivable {
  school_id: string;
  student_ssyl_id: string;
  school_year_id: string | null;
  currency: string;
  receivable_balance: number;
}

export interface SchoolRecovery {
  school_id: string;
  school_year_id: string;
  billed_total: number;
  collected_total: number;
  remaining_total: number;
  recovery_pct: number;
  solde_count: number;
  debute_count: number;
  impaye_count: number;
}

export interface LedgerEntryInput {
  account_id: string;
  direction: LedgerDirection;
  amount: number;
  currency?: string;
}

export interface PostLedgerTransactionArgs {
  school_id: string;
  school_year_id?: string | null;
  source: LedgerSource;
  ref_type?: string | null;
  ref_id?: string | null;
  external_ref?: string | null;
  memo?: string | null;
  occurred_at?: string | null;
  entries: LedgerEntryInput[];
}

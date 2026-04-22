export type FeeStatus = 'Pending' | 'Partial' | 'Paid' | 'Overdue' | 'Waived' | string;

/** Invoice row from GET /api/Fees/invoices (field names may vary by DTO). */
export interface FeeRecord {
  id: number;
  studentId?: number;
  studentName?: string;
  className?: string;
  class?: string;
  section?: string;
  /** Legacy / generic */
  amount?: number;
  /** Common invoice total */
  totalAmount?: number;
  amountDue?: number;
  amountPaid?: number;
  dueDate?: string;
  paidDate?: string | null;
  status?: FeeStatus;
  description?: string;
  notes?: string;
}

export interface FeesPagedResponse {
  data: FeeRecord[];
  total: number;
  page?: number;
  pageSize?: number;
}

export interface FeeSummary {
  totalDue: number;
  totalCollected: number;
  outstanding: number;
  count?: number;
}

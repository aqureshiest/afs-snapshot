// TODO --> remove these damn monolith references

const hasActiveLegacyLoan = function (user: User): boolean {
  if (!user) return false;

  const activeLoans = user.applications.filter(
    (app) => !FINALIZED_APPLICATION_STATUSES.includes(app.loan.status),
  );

  return Boolean(activeLoans.length);
};

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  applications: Application[];
}

interface Application {
  id: number;
  user_id: number;
  loan_id: number;
  applicant_role: "primary" | "cosigner";
  relationship_to_primary: string | null;
  misc: Record<string, unknown>;
  is_active: boolean;
  updated_at: Date;
  created_at: Date;
  verification_type: string;
  relationship_to_student: string | null;
  quoted_quick_score_id: number;
  quote_id: number | null;
  additional_information_status: {
    rules_run: boolean;
    complete: boolean;
    request_stats: {
      beta: number;
      pending: number;
      skipped: number;
      verified: number;
      rejected: number;
      fulfilled: number;
    };
  };
  loan: Loan;
}

interface Loan {
  status: LOAN_STATUSES;
}

export default hasActiveLegacyLoan;

export enum LOAN_STATUSES {
  APPLY = "apply",
  PENDING = "pending",
  PENDING_DECLINE = "pending_decline",
  PENDING_COSIGNER = "pending_cosigner",
  PENDING_COSIGNER_SIGNATURE = "pending_cosigner_signature",
  PENDING_PRIMARY = "pending_primary",
  ACCEPT = "accept",
  AGREED = "agreed",
  ACTIVE = "active",
  REPAID = "repaid",
  VOID = "void",
  DECLINE = "decline",
  PRESCREEN_DECLINE = "prescreen_decline",
  APPROVAL_EXPIRED = "approval_expired",
  CONDITIONAL_ACCEPT = "conditional_accept",
  TIME_OUT = "time_out",
}

// Loan statuses that *do not* signify an application in progress.
export const FINALIZED_APPLICATION_STATUSES = [
  LOAN_STATUSES.AGREED,
  LOAN_STATUSES.ACTIVE,
  LOAN_STATUSES.REPAID,
  LOAN_STATUSES.VOID,
  LOAN_STATUSES.DECLINE,
  LOAN_STATUSES.PRESCREEN_DECLINE,
  LOAN_STATUSES.APPROVAL_EXPIRED,
  LOAN_STATUSES.TIME_OUT,
];

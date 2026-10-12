export type ReportTarget =
  { recordaId: string; type: "RECORDA" } | { type: "USER"; userId: string };

export type ReportCreatedResponse = {
  created_at: string;
  report_id: string;
  status: string;
};

export type ReportMutationInput = {
  description: string;
  target: ReportTarget;
};

/**
 * Contrato US 46 — Moderação de Usuários (Suspensão e Reativação)
 */
export type UserRole = "USER" | "ADMIN";
export type UserModerationStatus = "ACTIVE" | "SUSPENDED";

export type AdminUserReportGroup = {
  first_reported_at: string;
  last_reported_at: string;
  report_count: number;
  status: "OPEN" | "RESOLVED" | "DISMISSED";
  target_id: string;
  target_type: "USER" | "RECORDA";
};

export type AdminUserAction = {
  action_id: string;
  action_type: string;
  admin_id: string;
  admin_username: string;
  created_at: string;
  details?: Record<string, unknown> | null;
  reason: string;
  target_recorda_id?: string | null;
  target_user_id?: string | null;
};

export type AdminUserRow = {
  email: string;
  name: string;
  profile_picture_url: string | null;
  reports_count: number;
  role: UserRole;
  status: UserModerationStatus;
  user_id: string;
  username: string;
};

export type AdminUserDetail = AdminUserRow & {
  actions: AdminUserAction[];
  created_at: string;
  is_private: boolean;
  recordas_count: number;
  reports_received: AdminUserReportGroup[];
};

export type SuspendUserRequest = {
  reason: string;
  resolve_open_reports?: boolean;
};

export type ReactivateUserRequest = {
  reason: string;
};

export type AdminIdentity = {
  role: UserRole;
  user_id: string;
  username: string;
};

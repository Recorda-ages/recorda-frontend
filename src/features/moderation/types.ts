export type ModerationTargetType = "USER" | "RECORDA" | "COMMENT";

export type ReportStatus = "OPEN" | "RESOLVED" | "DISMISSED";

export type ReportCategory =
  "SPAM" | "INAPPROPRIATE_CONTENT" | "HARASSMENT" | "COPYRIGHT" | "OTHER";

export type ReportTarget =
  { recordaId: string; type: "RECORDA" } | { type: "USER"; userId: string };

export type CreateReportPayload = {
  category?: ReportCategory;
  description: string;
  details?: string;
  target: ReportTarget;
};

export type ReportMutationInput = {
  category?: ReportCategory;
  description?: string;
  details?: string;
  target: ReportTarget;
};

export type ReportResponse = {
  created_at?: string;
  id?: string;
  report_id: string;
  status: ReportStatus;
  target_id?: string;
  target_type?: ModerationTargetType;
};

export type ReportCreatedResponse = ReportResponse;

export type AdminUserRole = "ADMIN" | "USER";

export type AdminUserStatus = "ACTIVE" | "SUSPENDED";

export type AdminIdentity = {
  role: AdminUserRole;
  user_id: string;
  username: string;
};

export type AdminUserRow = {
  email: string;
  name: string;
  profile_picture_url: string | null;
  reports_count: number;
  role: AdminUserRole;
  status: AdminUserStatus;
  user_id: string;
  username: string;
};

export type ModerationReportItem = {
  created_at: string;
  id: string;
  reason: string;
  status: ReportStatus;
  target_id: string;
  target_type: ModerationTargetType;
};

export type UserModerationActionItem = {
  action_type: "SUSPEND" | "REACTIVATE";
  admin_id: string;
  admin_username: string;
  created_at: string;
  id: string;
  reason: string;
  resolved_reports_count: number;
};

export type AdminUserDetail = AdminUserRow & {
  actions: UserModerationActionItem[];
  created_at: string;
  reports_received: ModerationReportItem[];
};

export type SuspendUserRequest = {
  reason: string;
  resolve_open_reports?: boolean;
};

export type ReactivateUserRequest = {
  reason: string;
};

export type AdminModerationActionResult = {
  detail?: AdminUserDetail;
  user: AdminUserRow;
};

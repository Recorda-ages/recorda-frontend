export type AdminTargetType = "RECORDA" | "USER";

export type AdminReportStatus = "DISMISSED" | "OPEN" | "RESOLVED";

export type AdminUserStatus = "ACTIVE" | "SUSPENDED";

export type AdminStatus = AdminReportStatus | AdminUserStatus;

export type AdminActionReason = {
  reason: string;
};

export type AdminPage<TItem> = {
  items: TItem[];
  nextCursor: string | null;
};

export type AdminReportOrder = "asc" | "desc";

export type AdminReportGroup = {
  contentSummary: string;
  imageUrl: string | null;
  latestReportedAt: string;
  latestReporterUsername?: string;
  openReportCount: number;
  status: AdminReportStatus;
  targetId: string;
  targetLabel: string;
  targetType: AdminTargetType;
  targetUsername: string;
};

export type AdminReportFilters = {
  cursor?: string;
  limit?: number;
  order?: AdminReportOrder;
  query?: string;
  status?: AdminReportStatus;
  targetType?: AdminTargetType;
};

export type AdminReportPage = AdminPage<AdminReportGroup> & {
  total: number;
};

export type AdminUserSummary = {
  email: string;
  reportCount: number;
  status: AdminUserStatus;
  userId: string;
  username: string;
};

export type AdminUserFilters = {
  query?: string;
  status?: AdminUserStatus;
};

export type AdminSummary = { user_id: string; username: string };
export type AdminActionType =
  "REMOVE_RECORDA" | "CHANGE_REPORT_STATUS" | "SUSPEND_USER" | "REACTIVATE_USER";
export type AdminAuditEntry = {
  action_id: string;
  action_type: AdminActionType;
  admin: AdminSummary;
  target_user_id: string | null;
  target_recorda_id: string | null;
  target_label: string;
  reason: string;
  details: Record<string, unknown> | null;
  created_at: string;
};
export type AdminAuditFilters = {
  admin_id?: string;
  action_type?: AdminActionType;
  date_from?: string;
  date_to?: string;
  limit?: number;
  offset?: number;
};
export type AdminAuditPage = { items: AdminAuditEntry[]; total: number };
export type AdminReportPageResponse = {
  total: number;
  items: {
    target_type: AdminTargetType;
    target_id: string;
    status: AdminReportStatus;
    report_count: number;
    first_reported_at: string;
    last_reported_at: string;
    preview: { title: string; subtitle: string | null; image_url: string | null };
  }[];
};

// Only endpoints already published by the backend are exposed here.
export type AdminService = {
  listReportGroups: (
    filters?: AdminReportFilters,
    signal?: AbortSignal
  ) => Promise<AdminReportPage>;
  listAdmins: (signal?: AbortSignal) => Promise<AdminSummary[]>;
  listAuditLog: (filters?: AdminAuditFilters, signal?: AbortSignal) => Promise<AdminAuditPage>;
};

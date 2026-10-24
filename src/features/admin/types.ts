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

export type AdminMediaType = "PHOTO" | "VIDEO";

export type AdminReportAccount = {
  avatarUrl: string | null;
  deletedAt: string | null;
  status: AdminUserStatus;
  userId: string;
  username: string;
};

export type AdminReportedRecorda = {
  author: AdminReportAccount;
  createdAt: string;
  deletedAt: string | null;
  description: string | null;
  mediaType: AdminMediaType;
  mediaUrl: string;
  recordaId: string;
  songArtist: string;
  songCoverUrl: string;
  songTitle: string;
};

export type AdminReportedUser = AdminReportAccount & {
  createdAt: string;
  email: string;
  isPrivate: boolean;
  name: string;
};

export type AdminReportTarget =
  { recorda: AdminReportedRecorda; type: "RECORDA" } | { type: "USER"; user: AdminReportedUser };

export type AdminReportEntry = {
  createdAt: string;
  description: string | null;
  reportId: string;
  reporterUsername: string;
  resolvedAt: string | null;
  status: AdminReportStatus;
};

export type AdminReportHistoryEntry = {
  actionId: string;
  actionType: AdminActionType;
  adminUsername: string;
  createdAt: string;
  reason: string;
  toStatus: AdminReportStatus | null;
};

export type AdminReportDetail = {
  actions: AdminReportHistoryEntry[];
  reports: AdminReportEntry[];
  target: AdminReportTarget;
};

export type AdminReportStatusChange = {
  reason: string;
  status: AdminReportStatus;
};

export type AdminReportStatusChangeResult = {
  status: AdminReportStatus;
  updatedCount: number;
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

export type AdminReportAccountResponse = {
  deleted_at: string | null;
  profile_picture_url: string | null;
  status: AdminUserStatus;
  user_id: string;
  username: string;
};

export type AdminReportDetailResponse = {
  actions: AdminAuditEntry[];
  reports: {
    created_at: string;
    description: string | null;
    report_id: string;
    reporter: AdminSummary;
    resolved_at: string | null;
    status: AdminReportStatus;
  }[];
} & (
  | {
      target: {
        author: AdminReportAccountResponse;
        created_at: string;
        deleted_at: string | null;
        description: string | null;
        media_type: AdminMediaType;
        media_url: string;
        recorda_id: string;
        song_artist_name: string;
        song_cover_url: string;
        song_title: string;
      };
      target_type: "RECORDA";
    }
  | {
      target: AdminReportAccountResponse & {
        created_at: string;
        email: string;
        is_private: boolean;
        name: string;
      };
      target_type: "USER";
    }
);

export type AdminRecordaRemoval = {
  deletedAt: string;
  recordaId: string;
  resolvedReports: number;
};

export type AdminRecordaRemovalResponse = {
  deleted_at: string;
  recorda_id: string;
  resolved_reports: number;
};

export type AdminReportStatusChangeResponse = {
  status: AdminReportStatus;
  updated_count: number;
};

export type AdminService = {
  removeRecorda: (recordaId: string, payload: AdminActionReason) => Promise<AdminRecordaRemoval>;
  supportsReportSearch: boolean;
  listReportGroups: (
    filters?: AdminReportFilters,
    signal?: AbortSignal
  ) => Promise<AdminReportPage>;
  getReportDetail: (
    targetType: AdminTargetType,
    targetId: string,
    signal?: AbortSignal
  ) => Promise<AdminReportDetail>;
  updateReportStatus: (
    targetType: AdminTargetType,
    targetId: string,
    change: AdminReportStatusChange
  ) => Promise<AdminReportStatusChangeResult>;
  listAdmins: (signal?: AbortSignal) => Promise<AdminSummary[]>;
  listAuditLog: (filters?: AdminAuditFilters, signal?: AbortSignal) => Promise<AdminAuditPage>;
};

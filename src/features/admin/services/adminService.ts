import { authApiClient } from "@/services/api";

import type {
  AdminAuditPage,
  AdminReportAccount,
  AdminReportAccountResponse,
  AdminReportDetail,
  AdminReportDetailResponse,
  AdminReportPageResponse,
  AdminReportStatus,
  AdminReportStatusChangeResponse,
  AdminReportTarget,
  AdminService,
  AdminSummary
} from "../types";

export const adminService: AdminService = {
  supportsReportSearch: false,
  async listReportGroups(filters = {}, signal) {
    // The current API has neither free-text search nor an ALL status value.
    if (filters.query?.trim())
      throw new Error("Administrative report search is not supported by the API.");
    const offset = Number(filters.cursor ?? 0);
    const params = new URLSearchParams({
      status: filters.status ?? "OPEN",
      limit: String(filters.limit ?? 20),
      offset: String(offset)
    });
    if (filters.order) params.set("order", filters.order);
    if (filters.targetType) params.set("target_type", filters.targetType);
    const response = await authApiClient.get<AdminReportPageResponse>(`/admin/reports?${params}`, {
      signal
    });
    const nextOffset = offset + response.items.length;
    return {
      items: response.items.map((item) => ({
        contentSummary: item.preview.title,
        imageUrl: item.preview.image_url,
        latestReportedAt: item.last_reported_at,
        openReportCount: item.report_count,
        status: item.status,
        targetId: item.target_id,
        targetLabel: item.preview.title,
        targetType: item.target_type,
        targetUsername: item.preview.subtitle?.replace(/^@/, "") ?? ""
      })),
      nextCursor:
        response.items.length > 0 && nextOffset < response.total ? String(nextOffset) : null,
      total: response.total
    };
  },
  async getReportDetail(targetType, targetId, signal) {
    const response = await authApiClient.get<AdminReportDetailResponse>(
      `/admin/reports/${targetType}/${encodeURIComponent(targetId)}`,
      { signal }
    );
    return toReportDetail(response);
  },
  async updateReportStatus(targetType, targetId, change) {
    const response = await authApiClient.patch<AdminReportStatusChangeResponse>(
      `/admin/reports/${targetType}/${encodeURIComponent(targetId)}/status`,
      { reason: change.reason, status: change.status }
    );
    return { status: response.status, updatedCount: response.updated_count };
  },
  listAdmins: (signal) => authApiClient.get<AdminSummary[]>("/admin/admins", { signal }),
  listAuditLog(filters = {}, signal) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined) params.set(key, String(value));
    }
    const suffix = params.size ? `?${params}` : "";
    return authApiClient.get<AdminAuditPage>(`/admin/audit-log${suffix}`, { signal });
  }
};

function toReportDetail(response: AdminReportDetailResponse): AdminReportDetail {
  return {
    actions: response.actions.map((action) => ({
      actionId: action.action_id,
      actionType: action.action_type,
      adminUsername: action.admin.username,
      createdAt: action.created_at,
      reason: action.reason,
      toStatus: toReportStatus(action.details?.to)
    })),
    reports: response.reports.map((report) => ({
      createdAt: report.created_at,
      description: report.description,
      reportId: report.report_id,
      reporterUsername: report.reporter.username,
      resolvedAt: report.resolved_at,
      status: report.status
    })),
    target: toReportTarget(response)
  };
}

function toReportTarget(response: AdminReportDetailResponse): AdminReportTarget {
  if (response.target_type === "RECORDA") {
    const { target } = response;
    return {
      recorda: {
        author: toAccount(target.author),
        createdAt: target.created_at,
        deletedAt: target.deleted_at,
        description: target.description,
        mediaType: target.media_type,
        mediaUrl: target.media_url,
        recordaId: target.recorda_id,
        songArtist: target.song_artist_name,
        songCoverUrl: target.song_cover_url,
        songTitle: target.song_title
      },
      type: "RECORDA"
    };
  }

  const { target } = response;
  return {
    type: "USER",
    user: {
      ...toAccount(target),
      createdAt: target.created_at,
      email: target.email,
      isPrivate: target.is_private,
      name: target.name
    }
  };
}

function toReportStatus(value: unknown): AdminReportStatus | null {
  return value === "OPEN" || value === "RESOLVED" || value === "DISMISSED" ? value : null;
}

function toAccount(account: AdminReportAccountResponse): AdminReportAccount {
  return {
    avatarUrl: account.profile_picture_url,
    deletedAt: account.deleted_at,
    status: account.status,
    userId: account.user_id,
    username: account.username
  };
}

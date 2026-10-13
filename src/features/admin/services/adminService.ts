import { authApiClient } from "@/services/api";

import type { AdminAuditPage, AdminReportPageResponse, AdminService, AdminSummary } from "../types";

export const adminService: AdminService = {
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

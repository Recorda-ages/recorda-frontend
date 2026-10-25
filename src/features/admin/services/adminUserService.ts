import { authApiClient } from "@/services/api";
import type { AdminUserDetail, AdminUserRow, AdminUsersPage } from "@/features/admin/types";
import type { AdminModerationService, UserModerationStatus } from "@/features/moderation/types";

export type AdminUsersFilters = {
  q?: string;
  status?: UserModerationStatus;
  offset?: number;
  limit?: number;
};
export const ADMIN_USERS_QUERY_KEY = ["admin", "users"] as const;

export const adminUserService = {
  list(filters: AdminUsersFilters = {}, signal?: AbortSignal) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) params.set(key, String(value));
    });
    return authApiClient.get<AdminUsersPage>(`/admin/users?${params}`, { signal });
  },
  get: (userId: string, signal?: AbortSignal) =>
    authApiClient.get<AdminUserDetail>(`/admin/users/${encodeURIComponent(userId)}`, { signal })
};

type StatusResponse = { status_code: number; user_id: string; status: UserModerationStatus };
export const adminModerationService: AdminModerationService = {
  async suspendUser(userId, _admin, payload) {
    await authApiClient.post<StatusResponse>(
      `/admin/users/${encodeURIComponent(userId)}/suspend`,
      payload
    );
    const detail = await adminUserService.get(userId);
    return { user: detail, detail };
  },
  async reactivateUser(userId, _admin, payload) {
    await authApiClient.post<StatusResponse>(
      `/admin/users/${encodeURIComponent(userId)}/reactivate`,
      payload
    );
    const detail = await adminUserService.get(userId);
    return { user: detail, detail };
  }
};

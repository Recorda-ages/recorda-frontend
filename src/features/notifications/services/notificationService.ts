import { authApiClient } from "@/services/api";

import type { FollowRequestDecision, NotificationPage } from "../types";

export const notificationService = {
  list: (signal?: AbortSignal) => authApiClient.get<NotificationPage>("/notifications", { signal }),

  markAllAsRead: () => authApiClient.post<void>("/notifications/read-all"),

  respondToFollowRequest: (followId: string, decision: FollowRequestDecision) =>
    authApiClient.patch<void>(`/follow-requests/${followId}`, { action: decision })
};

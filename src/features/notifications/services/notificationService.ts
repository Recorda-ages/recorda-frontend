import { authApiClient } from "@/services/api";

import type { FollowRequestDecision, NotificationPage } from "../types";

export const notificationService = {
  list: (signal?: AbortSignal) => authApiClient.get<NotificationPage>("/notifications", { signal }),

  markAllAsRead: () => authApiClient.post<void>("/notifications/read-all"),

  respondToFollowRequest: (followerId: string, decision: FollowRequestDecision) => {
    const path = `/users/me/follow-requests/${followerId}`;

    return decision === "accept"
      ? authApiClient.post<void>(`${path}/accept`)
      : authApiClient.delete<void>(path);
  }
};

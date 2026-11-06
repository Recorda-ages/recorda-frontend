import { authApiClient } from "@/services/api";

import type { FollowMutationResult } from "../types";

export const followService = {
  follow: (userId: string, signal?: AbortSignal) =>
    authApiClient.post<FollowMutationResult>(
      `/users/${encodeURIComponent(userId)}/follow`,
      undefined,
      { signal }
    ),

  unfollow: (userId: string, signal?: AbortSignal) =>
    authApiClient.delete<FollowMutationResult>(`/users/${encodeURIComponent(userId)}/follow`, {
      signal
    })
};

import { isMockProfileId, rejectMockProfileAction } from "@/features/profile/mocks/profileMocks";
import { authApiClient } from "@/services/api";

import type { FollowMutationResult } from "../types";

export const followService = {
  follow: (userId: string, signal?: AbortSignal) =>
    // Development mock profiles (#255) must never reach the backend.
    isMockProfileId(userId)
      ? rejectMockProfileAction()
      : authApiClient.post<FollowMutationResult>(
          `/users/${encodeURIComponent(userId)}/follow`,
          undefined,
          { signal }
        ),

  unfollow: (userId: string, signal?: AbortSignal) =>
    isMockProfileId(userId)
      ? rejectMockProfileAction()
      : authApiClient.delete<FollowMutationResult>(`/users/${encodeURIComponent(userId)}/follow`, {
          signal
        })
};

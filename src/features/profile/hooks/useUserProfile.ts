import { useQuery } from "@tanstack/react-query";

import { ApiError } from "@/services/api";

import { profileQueryKey } from "../queryKeys";
import { profileService } from "../services/profileService";

// Retrying can't change these answers; a 404 should show "unavailable" right away.
const NO_RETRY_STATUSES = new Set([401, 403, 404]);

/**
 * Another user's profile. `enabled` lets the screen skip the request when the route points
 * at the signed-in user, who is sent to "Profile" instead.
 */
export function useUserProfile(userId: string, enabled = true) {
  return useQuery({
    enabled: enabled && userId.length > 0,
    queryFn: ({ signal }) => profileService.getUserProfile(userId, signal),
    queryKey: profileQueryKey(userId),
    retry: (count, error) =>
      !(error instanceof ApiError && NO_RETRY_STATUSES.has(error.status)) && count < 1
  });
}

import { useQuery } from "@tanstack/react-query";

import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { ApiError } from "@/services/api";

import { profileQueryKey } from "../queryKeys";
import { profileService } from "../services/profileService";

// Retrying can't change these answers; a 404 should show "unavailable" right away.
const NO_RETRY_STATUSES = new Set([401, 403, 404]);
// The own profile's 409 must reach the screen at once, so it can send the user to onboarding.
const OWN_NO_RETRY_STATUSES = new Set([...NO_RETRY_STATUSES, 409]);

/**
 * A profile by id, or the signed-in user's with `"me"`. Both are cached under
 * `["profile", userId]` with the real id (the own one from the `/auth/me` cache), never "me",
 * so opening oneself from anywhere hits the same entry. Waits (disabled) until the id is known.
 */
export function useProfile(userId: string | "me", enabled = true) {
  const myUserId = useCurrentUser()?.user_id;
  const isMe = userId === "me";
  const resolvedId = (isMe ? myUserId : userId) ?? "";
  const noRetryStatuses = isMe ? OWN_NO_RETRY_STATUSES : NO_RETRY_STATUSES;

  return useQuery({
    enabled: enabled && resolvedId.length > 0,
    queryFn: ({ signal }) =>
      isMe ? profileService.getMyProfile(signal) : profileService.getUserProfile(userId, signal),
    queryKey: profileQueryKey(resolvedId),
    retry: (count, error) =>
      !(error instanceof ApiError && noRetryStatuses.has(error.status)) && count < 1
  });
}

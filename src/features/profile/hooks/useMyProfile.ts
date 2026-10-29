import { useQuery } from "@tanstack/react-query";

import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { ApiError } from "@/services/api";

import { profileQueryKey } from "../queryKeys";
import { profileService } from "../services/profileService";

// Retrying can't change these answers. 409 in particular must reach the screen at once,
// so it can send the user to onboarding.
const NO_RETRY_STATUSES = new Set([401, 403, 404, 409]);

/** The 409 of `GET /users/me/profile`: the music onboarding is incomplete. */
export function isIncompleteProfileError(error: unknown) {
  return error instanceof ApiError && error.status === 409;
}

/**
 * The signed-in user's profile, cached under `["profile", myUserId]` with the real id from
 * the `/auth/me` cache, not "me". Waits (disabled) until that id is known.
 */
export function useMyProfile() {
  const myUserId = useCurrentUser()?.user_id;

  return useQuery({
    enabled: Boolean(myUserId),
    queryFn: ({ signal }) => profileService.getMyProfile(signal),
    queryKey: profileQueryKey(myUserId ?? ""),
    retry: (count, error) =>
      !(error instanceof ApiError && NO_RETRY_STATUSES.has(error.status)) && count < 1
  });
}

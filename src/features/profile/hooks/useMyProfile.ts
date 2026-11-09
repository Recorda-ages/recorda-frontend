import { ApiError } from "@/services/api";

import { useProfile } from "./useProfile";

/** The 409 of `GET /users/me/profile`: the music onboarding is incomplete. */
export function isIncompleteProfileError(error: unknown) {
  return error instanceof ApiError && error.status === 409;
}

/** The signed-in user's profile: `useProfile("me")`. */
export function useMyProfile() {
  return useProfile("me");
}

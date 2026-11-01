import { authApiClient } from "@/services/api";

import type { ProfileRead, RecordaGridPage } from "../types";

function buildRecordasPath(userId: string, cursor: string | null) {
  const path = `/users/${encodeURIComponent(userId)}/recordas`;
  // No `limit`: the backend default (24) is the page size of the grid.
  return cursor ? `${path}?cursor=${encodeURIComponent(cursor)}` : path;
}

export const profileService = {
  /**
   * `GET /users/me/profile`. Answers 409 while the music onboarding is incomplete, which
   * the screen turns into a redirect to onboarding (see `isIncompleteProfileError`).
   */
  getMyProfile: (signal?: AbortSignal) =>
    authApiClient.get<ProfileRead>("/users/me/profile", { signal }),

  /**
   * `GET /users/{id}/recordas`, newest first. 403 for a private account the viewer can't
   * see, 404 for a missing or suspended user, 400 for an invalid cursor.
   */
  getUserRecordas: (userId: string, cursor: string | null = null, signal?: AbortSignal) =>
    authApiClient.get<RecordaGridPage>(buildRecordasPath(userId, cursor), { signal })
};

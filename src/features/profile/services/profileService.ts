import { File } from "expo-file-system";

import { authApiClient } from "@/services/api";

import type { ProfileMusicTastes, ProfileRead, RecordaGridPage } from "../types";

function buildRecordasPath(userId: string, cursor: string | null) {
  const path = `/users/${encodeURIComponent(userId)}/recordas`;
  // No `limit`: the backend default (24) is the page size of the grid.
  return cursor ? `${path}?cursor=${encodeURIComponent(cursor)}` : path;
}

type UploadAvatarResponse = { profile_picture_url: string };

export const profileService = {
  /**
   * `GET /users/me/profile`. Answers 409 while the music onboarding is incomplete, which
   * the screen turns into a redirect to onboarding (see `isIncompleteProfileError`).
   */
  getMyProfile: (signal?: AbortSignal) =>
    authApiClient.get<ProfileRead>("/users/me/profile", { signal }),

  /**
   * `GET /users/{id}/profile` (#109). Merged into the backend `dev` with PR #152. 404 for a missing, suspended or not onboarded user.
   * No fallback to `GET /users/{id}`, which is an admin route.
   */
  getUserProfile: (userId: string, signal?: AbortSignal) =>
    authApiClient.get<ProfileRead>(`/users/${encodeURIComponent(userId)}/profile`, { signal }),

  /**
   * `GET /users/{id}/recordas`, newest first. 403 for a private account the viewer can't
   * see, 404 for a missing or suspended user, 400 for an invalid cursor.
   */
  getUserRecordas: (userId: string, cursor: string | null = null, signal?: AbortSignal) =>
    authApiClient.get<RecordaGridPage>(buildRecordasPath(userId, cursor), { signal }),

  /**
   * `GET /users/{id}/music-preferences`: favorite artists and genres of another user. 403 for
   * a private account the viewer can't see, 404 for a missing or suspended user.
   */
  getUserMusicTastes: (userId: string, signal?: AbortSignal) =>
    authApiClient.get<ProfileMusicTastes>(
      `/users/${encodeURIComponent(userId)}/music-preferences`,
      {
        signal
      }
    ),

  /** `PUT /users/me/avatar`: upload a JPEG and return the new `profile_picture_url`. */
  uploadAvatar: (uri: string) => {
    const formData = new FormData();
    formData.append("file", new File(uri) as unknown as Blob, "avatar.jpg");
    return authApiClient.put<UploadAvatarResponse>("/users/me/avatar", formData);
  },

  /** `DELETE /users/me/avatar`: remove the avatar and revert to the default icon. */
  deleteAvatar: () => authApiClient.delete<void>("/users/me/avatar")
};

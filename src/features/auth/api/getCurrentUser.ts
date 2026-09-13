import { apiClient } from "@/services/api/client";

import type { UserBasicResponse } from "./register";

export const AUTH_ME_QUERY_KEY = ["auth", "me"] as const;

export type CurrentUser = UserBasicResponse;

export function getCurrentUser(token: string, signal?: AbortSignal): Promise<CurrentUser> {
  return apiClient.get<CurrentUser>("/auth/me", {
    headers: { Authorization: `Bearer ${token}` },
    signal
  });
}

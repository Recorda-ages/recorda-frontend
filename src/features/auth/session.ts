import { queryClient } from "@/app/providers/queryClient";
import { AUTH_TOKEN_KEY } from "@/services/api/authClient";
import { secureStorage } from "@/services/storage";

import { AUTH_ME_QUERY_KEY } from "./api/getCurrentUser";
import type { AuthSessionResponse, UserBasicResponse } from "./api/types";

export const ROLE_KEY = "role";
export const LEGACY_ACCOUNT_TYPE_KEY = "account_type";
export const ADMIN_ROLE = "ADMIN";

export type PostAuthDestination = "Admin" | "Feed" | "OnboardingArtists";

export async function saveSession(response: AuthSessionResponse) {
  await secureStorage.setItem(AUTH_TOKEN_KEY, response.access_token);
  await secureStorage.setItem(ROLE_KEY, response.user.role);
  queryClient.setQueryData(AUTH_ME_QUERY_KEY, response.user);
}

export async function clearSession() {
  queryClient.removeQueries({ queryKey: AUTH_ME_QUERY_KEY });
  await Promise.allSettled([
    secureStorage.removeItem(AUTH_TOKEN_KEY),
    secureStorage.removeItem(ROLE_KEY),
    secureStorage.removeItem(LEGACY_ACCOUNT_TYPE_KEY)
  ]);
}

export function getPostAuthDestination(user: UserBasicResponse): PostAuthDestination {
  if (user.role === ADMIN_ROLE) {
    return "Admin";
  }

  return user.onboarding_completed ? "Feed" : "OnboardingArtists";
}

export function markOnboardingCompleted() {
  queryClient.setQueryData<UserBasicResponse>(AUTH_ME_QUERY_KEY, (user) =>
    user ? { ...user, onboarding_completed: true } : user
  );
}

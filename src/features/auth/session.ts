import { queryClient } from "@/app/providers/queryClient";
import { AUTH_TOKEN_KEY } from "@/services/api/authClient";
import { secureStorage } from "@/services/storage";

import { AUTH_ME_QUERY_KEY } from "./api/getCurrentUser";
import type { AuthSessionResponse, UserBasicResponse } from "./api/types";

export const ACCOUNT_TYPE_KEY = "account_type";
export const ADMIN_ACCOUNT_TYPE = "admin";

export type PostAuthDestination = "Admin" | "Feed" | "OnboardingArtists";

export async function saveSession(response: AuthSessionResponse) {
  await secureStorage.setItem(AUTH_TOKEN_KEY, response.access_token);
  await secureStorage.setItem(ACCOUNT_TYPE_KEY, response.user.account_type);
  queryClient.setQueryData(AUTH_ME_QUERY_KEY, response.user);
}

export async function clearSession() {
  queryClient.removeQueries({ queryKey: AUTH_ME_QUERY_KEY });
  await Promise.allSettled([
    secureStorage.removeItem(AUTH_TOKEN_KEY),
    secureStorage.removeItem(ACCOUNT_TYPE_KEY)
  ]);
}

export function getPostAuthDestination(user: UserBasicResponse): PostAuthDestination {
  if (user.account_type === ADMIN_ACCOUNT_TYPE) {
    return "Admin";
  }

  return user.onboarding_completed ? "Feed" : "OnboardingArtists";
}

export function markOnboardingCompleted() {
  queryClient.setQueryData<UserBasicResponse>(AUTH_ME_QUERY_KEY, (user) =>
    user ? { ...user, onboarding_completed: true } : user
  );
}

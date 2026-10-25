import { queryClient } from "@/app/providers/queryClient";
import { syncLanguageWithAccount } from "@/features/language/languagePreference";
import { AUTH_TOKEN_KEY } from "@/services/api/authClient";
import { AUTH_TOKEN_QUERY_KEY } from "@/services/api/useAuthImageSource";
import { resetPrivateState } from "@/services/api/sessionLifecycle";
import { i18n, resolveDeviceLanguage } from "@/i18n";
import { secureStorage } from "@/services/storage";

import { AUTH_ME_QUERY_KEY } from "./api/getCurrentUser";
import type { AuthSessionResponse, UserBasicResponse } from "./api/types";

export const ROLE_KEY = "role";
export const LEGACY_ACCOUNT_TYPE_KEY = "account_type";
export const ADMIN_ROLE = "ADMIN";

export type PostAuthDestination = "Admin" | "Feed" | "OnboardingArtists";

// The current user is only ever written with setQueryData and usually has no observer,
// so the default 5-minute garbage collection would drop it in the middle of a session.
queryClient.setQueryDefaults(AUTH_ME_QUERY_KEY, { gcTime: Infinity });

export async function saveSession(response: AuthSessionResponse) {
  resetPrivateState();
  await queryClient.cancelQueries();
  queryClient.clear();
  await secureStorage.setItem(AUTH_TOKEN_KEY, response.access_token);
  await secureStorage.setItem(ROLE_KEY, response.user.role);
  queryClient.setQueryData(AUTH_ME_QUERY_KEY, response.user);
  queryClient.setQueryData(AUTH_TOKEN_QUERY_KEY, response.access_token);
  await syncLanguageWithAccount(response.user);
}

export async function updateAccountSession(
  accessToken: string,
  account: Pick<UserBasicResponse, "name" | "username">
) {
  await secureStorage.setItem(AUTH_TOKEN_KEY, accessToken);
  queryClient.setQueryData(AUTH_TOKEN_QUERY_KEY, accessToken);
  queryClient.setQueryData<UserBasicResponse>(AUTH_ME_QUERY_KEY, (user) =>
    user ? { ...user, ...account } : user
  );
}

export async function clearSession() {
  resetPrivateState();
  await queryClient.cancelQueries();
  await Promise.allSettled([
    secureStorage.removeItem(AUTH_TOKEN_KEY),
    secureStorage.removeItem(ROLE_KEY),
    secureStorage.removeItem(LEGACY_ACCOUNT_TYPE_KEY)
  ]);
  queryClient.clear();
  await i18n.changeLanguage(resolveDeviceLanguage());
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

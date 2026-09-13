import { secureStorage } from "@/services/storage";

import { apiClient } from "./client";

// Single source of truth for the persisted access-token key. Feature code should
// no longer redeclare this string; import it from here.
export const AUTH_TOKEN_KEY = "auth_token";

type AuthedOptions = {
  headers?: Record<string, string>;
  signal?: AbortSignal;
  timeoutMs?: number;
};

type Body = Parameters<typeof apiClient.post>[1];

/**
 * Central authenticated HTTP client (T-E2.INT.00).
 *
 * Wraps `apiClient` and attaches the stored bearer token automatically, so
 * feature code stops reading the token from secure storage and hand-building the
 * Authorization header. When no token is stored the request is sent without the
 * header (the backend then answers 401) — matching the previous behaviour.
 */
export const authApiClient = {
  delete: <TResponse>(path: string, options?: AuthedOptions) =>
    withAuth(options).then((o) => apiClient.delete<TResponse>(path, o)),
  get: <TResponse>(path: string, options?: AuthedOptions) =>
    withAuth(options).then((o) => apiClient.get<TResponse>(path, o)),
  patch: <TResponse>(path: string, body?: Body, options?: AuthedOptions) =>
    withAuth(options).then((o) => apiClient.patch<TResponse>(path, body, o)),
  post: <TResponse>(path: string, body?: Body, options?: AuthedOptions) =>
    withAuth(options).then((o) => apiClient.post<TResponse>(path, body, o)),
  put: <TResponse>(path: string, body?: Body, options?: AuthedOptions) =>
    withAuth(options).then((o) => apiClient.put<TResponse>(path, body, o))
};

async function withAuth(options: AuthedOptions = {}): Promise<AuthedOptions> {
  const token = await secureStorage.getItem(AUTH_TOKEN_KEY);

  if (!token) {
    return options;
  }

  return {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`
    }
  };
}

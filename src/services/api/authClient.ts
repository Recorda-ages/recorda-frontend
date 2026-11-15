import { secureStorage } from "@/services/storage";

import { ApiError } from "./errors";
import { notifyInvalidSession, trackSessionRequest } from "./sessionLifecycle";
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

export const authApiClient = {
  delete: <T>(path: string, options?: AuthedOptions) =>
    authenticated<T>("delete", path, undefined, options),
  get: <T>(path: string, options?: AuthedOptions) =>
    authenticated<T>("get", path, undefined, options),
  patch: <T>(path: string, body?: Body, options?: AuthedOptions) =>
    authenticated<T>("patch", path, body, options),
  post: <T>(path: string, body?: Body, options?: AuthedOptions) =>
    authenticated<T>("post", path, body, options),
  put: <T>(path: string, body?: Body, options?: AuthedOptions) =>
    authenticated<T>("put", path, body, options)
};

async function authenticated<T>(
  method: "delete" | "get" | "patch" | "post" | "put",
  path: string,
  body?: Body,
  options: AuthedOptions = {}
): Promise<T> {
  const request = trackSessionRequest();
  let authorization: string | undefined;
  const abort = () => request.controller.abort();
  if (options.signal?.aborted) abort();
  else options.signal?.addEventListener("abort", abort);
  try {
    const authed = await withAuth(options);
    authorization = authed.headers?.Authorization;
    if (!request.isCurrent() || request.controller.signal.aborted)
      throw Object.assign(new Error("Session ended"), { name: "AbortError" });
    const requestOptions = { ...authed, signal: request.controller.signal };
    const response =
      method === "get" || method === "delete"
        ? await apiClient[method]<T>(path, requestOptions)
        : await apiClient[method]<T>(path, body, requestOptions);
    if (!request.isCurrent())
      throw Object.assign(new Error("Session ended"), { name: "AbortError" });
    return response;
  } catch (error) {
    if (request.isCurrent() && error instanceof ApiError && error.status === 401) {
      const currentToken = await secureStorage.getItem(AUTH_TOKEN_KEY);
      if (
        request.isCurrent() &&
        authorization === (currentToken ? `Bearer ${currentToken}` : undefined)
      ) {
        notifyInvalidSession();
      }
    }
    throw error;
  } finally {
    options.signal?.removeEventListener("abort", abort);
    request.release();
  }
}

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

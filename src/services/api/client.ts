// teste

import { env } from "@/app/config";

import { ApiError, createApiError } from "./errors";

const API_VERSION_PREFIX = "/api/v1";
const DEFAULT_TIMEOUT_MS = 15_000;

type HttpMethod = "DELETE" | "GET" | "PATCH" | "POST" | "PUT";

type ApiRequestOptions = {
  body?: FormData | Record<string, unknown> | string | unknown[] | null;
  headers?: Record<string, string>;
  method?: HttpMethod;
  signal?: AbortSignal;
  timeoutMs?: number;
};

type ApiClient = {
  delete: <TResponse>(
    path: string,
    options?: Omit<ApiRequestOptions, "body" | "method">
  ) => Promise<TResponse>;
  get: <TResponse>(
    path: string,
    options?: Omit<ApiRequestOptions, "body" | "method">
  ) => Promise<TResponse>;
  patch: <TResponse>(
    path: string,
    body?: ApiRequestOptions["body"],
    options?: Omit<ApiRequestOptions, "body" | "method">
  ) => Promise<TResponse>;
  post: <TResponse>(
    path: string,
    body?: ApiRequestOptions["body"],
    options?: Omit<ApiRequestOptions, "body" | "method">
  ) => Promise<TResponse>;
  put: <TResponse>(
    path: string,
    body?: ApiRequestOptions["body"],
    options?: Omit<ApiRequestOptions, "body" | "method">
  ) => Promise<TResponse>;
  request: <TResponse>(path: string, options?: ApiRequestOptions) => Promise<TResponse>;
};

export const apiClient: ApiClient = {
  delete: (path, options) => request(path, { ...options, method: "DELETE" }),
  get: (path, options) => request(path, { ...options, method: "GET" }),
  patch: (path, body, options) => request(path, { ...options, body, method: "PATCH" }),
  post: (path, body, options) => request(path, { ...options, body, method: "POST" }),
  put: (path, body, options) => request(path, { ...options, body, method: "PUT" }),
  request
};

export function buildApiUrl(path: string) {
  const baseUrl = env.apiUrl.replace(/\/+$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  if (normalizedPath.startsWith(API_VERSION_PREFIX)) {
    return `${baseUrl}${normalizedPath}`;
  }

  return `${baseUrl}${API_VERSION_PREFIX}${normalizedPath}`;
}

async function request<TResponse>(path: string, options: ApiRequestOptions = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  const signal = options.signal ?? controller.signal;

  try {
    const response = await fetch(buildApiUrl(path), {
      body: serializeBody(options.body),
      headers: buildHeaders(options.body, options.headers),
      method: options.method ?? "GET",
      signal
    });
    const payload = await parseResponse(response);

    if (!response.ok) {
      throw createApiError(response.status, payload);
    }

    return payload as TResponse;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof Error && error.name === "AbortError") {
      throw new ApiError("REQUEST_TIMEOUT", "The request timed out.", 408, null);
    }

    throw new ApiError("NETWORK_ERROR", "Unable to reach the API.", 0, error);
  } finally {
    clearTimeout(timeout);
  }
}

async function parseResponse(response: Response): Promise<unknown> {
  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return response.json() as Promise<unknown>;
  }

  return response.text();
}

function buildHeaders(
  body: ApiRequestOptions["body"],
  headers: Record<string, string> = {}
): Record<string, string> {
  if (body instanceof FormData) {
    return headers;
  }

  return {
    "Content-Type": "application/json",
    ...headers
  };
}

function serializeBody(body: ApiRequestOptions["body"]) {
  if (body === undefined || body === null) {
    return undefined;
  }

  if (typeof body === "string" || body instanceof FormData) {
    return body;
  }

  return JSON.stringify(body);
}

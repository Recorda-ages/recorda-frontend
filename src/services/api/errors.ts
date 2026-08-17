export type ApiErrorPayload = {
  error: {
    code: string;
    details: unknown | null;
    message: string;
  };
};

export class ApiError extends Error {
  code: string;
  details: unknown | null;
  status: number;

  constructor(code: string, message: string, status: number, details: unknown | null) {
    super(message);
    this.code = code;
    this.details = details;
    this.name = "ApiError";
    this.status = status;
  }
}

export function createApiError(status: number, payload: unknown) {
  if (isApiErrorPayload(payload)) {
    return new ApiError(payload.error.code, payload.error.message, status, payload.error.details);
  }

  return new ApiError("REQUEST_FAILED", "The API request failed.", status, payload);
}

export function isApiErrorPayload(payload: unknown): payload is ApiErrorPayload {
  if (!isRecord(payload) || !isRecord(payload.error)) {
    return false;
  }

  return typeof payload.error.code === "string" && typeof payload.error.message === "string";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

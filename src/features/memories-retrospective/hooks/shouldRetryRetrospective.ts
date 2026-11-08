import { ApiError } from "@/services/api";

const FINAL_STATUSES = new Set([401, 403, 404, 422]);

export function shouldRetryRetrospective(failureCount: number, error: Error) {
  if (error instanceof ApiError && FINAL_STATUSES.has(error.status)) return false;
  if (error instanceof RangeError) return false;
  return failureCount < 1;
}

import { type InfiniteData, useInfiniteQuery } from "@tanstack/react-query";

import { ApiError } from "@/services/api";

import { profileRecordasQueryKey } from "../queryKeys";
import { profileService } from "../services/profileService";
import type { RecordaGridPage } from "../types";

// Retrying can't change these answers (invalid cursor, auth, private or missing account).
const NO_RETRY_STATUSES = new Set([400, 401, 403, 404]);

/**
 * Recordas grid of a profile, newest first, paginated by cursor like the feeds. Pages keep
 * the backend order; nothing is re-sorted here.
 */
export function useProfileRecordas(userId: string | undefined, enabled = true) {
  return useInfiniteQuery<
    RecordaGridPage,
    Error,
    InfiniteData<RecordaGridPage, string | null>,
    ReturnType<typeof profileRecordasQueryKey>,
    string | null
  >({
    enabled: enabled && Boolean(userId),
    getNextPageParam: (lastPage) => lastPage.next_cursor ?? undefined,
    initialPageParam: null,
    queryFn: ({ pageParam, signal }) =>
      profileService.getUserRecordas(userId ?? "", pageParam, signal),
    queryKey: profileRecordasQueryKey(userId ?? ""),
    retry: (count, error) =>
      !(error instanceof ApiError && NO_RETRY_STATUSES.has(error.status)) && count < 1
  });
}

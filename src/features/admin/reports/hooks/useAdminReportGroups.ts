import { type InfiniteData, useInfiniteQuery } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";

import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { ADMIN_ROLE } from "@/features/auth/session";
import { ApiError } from "@/services/api";

import { useAdminApiErrorHandler } from "../../hooks/useAdminApiErrorHandler";
import { adminAdapter } from "../../services/adminAdapter";
import type { AdminReportFilters, AdminReportGroup, AdminReportPage } from "../../types";

export const ADMIN_REPORTS_QUERY_KEY = ["admin", "reports"] as const;

export function useAdminReportGroups(filters: AdminReportFilters) {
  const handleAdminApiError = useAdminApiErrorHandler();
  const user = useCurrentUser();
  const query = useInfiniteQuery<
    AdminReportPage,
    Error,
    InfiniteData<AdminReportPage>,
    readonly unknown[],
    string | undefined
  >({
    enabled: user?.role === ADMIN_ROLE,
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (page) => page.nextCursor ?? undefined,
    queryFn: ({ signal, pageParam }) =>
      adminAdapter.listReportGroups({ ...filters, cursor: pageParam }, signal),
    retry: (count, error) =>
      !(error instanceof ApiError && (error.status === 401 || error.status === 403)) && count < 1,
    queryKey: [...ADMIN_REPORTS_QUERY_KEY, user?.user_id, filters],
    staleTime: 0
  });

  useEffect(() => {
    if (query.error) {
      void handleAdminApiError(query.error);
    }
  }, [handleAdminApiError, query.error]);

  const items = useMemo(() => uniqueGroups(query.data?.pages ?? []), [query.data]);

  return {
    ...query,
    canSearch: adminAdapter.supportsReportSearch,
    items,
    total: query.data?.pages[0]?.total ?? 0
  };
}

export function reportGroupKey(item: AdminReportGroup) {
  return `${item.targetType}:${item.targetId}`;
}

function uniqueGroups(pages: readonly AdminReportPage[]) {
  const seen = new Set<string>();

  return pages
    .flatMap((page) => page.items)
    .filter((item) => {
      const key = reportGroupKey(item);
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
}

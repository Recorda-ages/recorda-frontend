import { type InfiniteData, useInfiniteQuery } from "@tanstack/react-query";
import { useEffect } from "react";

import { adminAdapter } from "../services/adminAdapter";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { ADMIN_ROLE } from "@/features/auth/session";
import { ApiError } from "@/services/api";
import type { AdminPage, AdminReportGroup, AdminReportFilters } from "../types";
import { useAdminApiErrorHandler } from "./useAdminApiErrorHandler";

export const ADMIN_REPORTS_QUERY_KEY = ["admin", "reports"] as const;

export function useAdminReports(filters: AdminReportFilters) {
  const handleAdminApiError = useAdminApiErrorHandler();
  const user = useCurrentUser();
  const query = useInfiniteQuery<
    AdminPage<AdminReportGroup>,
    Error,
    InfiniteData<AdminPage<AdminReportGroup>>,
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
    queryKey: [
      ...ADMIN_REPORTS_QUERY_KEY,
      user?.user_id,
      filters.query ?? "",
      filters.targetType ?? "ALL",
      filters.status ?? "ALL"
    ],
    staleTime: 0
  });

  useEffect(() => {
    if (query.error) {
      void handleAdminApiError(query.error);
    }
  }, [handleAdminApiError, query.error]);

  return { ...query, items: query.data?.pages.flatMap((page) => page.items) ?? [] };
}

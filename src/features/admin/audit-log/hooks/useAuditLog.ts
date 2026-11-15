import { type InfiniteData, useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";

import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { ADMIN_ROLE } from "@/features/auth/session";
import { ApiError } from "@/services/api";

import { useAdminApiErrorHandler } from "../../hooks/useAdminApiErrorHandler";
import { adminAdapter } from "../../services/adminAdapter";
import type {
  AdminActionType,
  AdminAuditEntry,
  AdminAuditFilters,
  AdminAuditPage,
  AdminSummary
} from "../../types";

export const ADMIN_AUDIT_LOG_QUERY_KEY = ["admin", "audit-log"] as const;
export const ADMIN_ADMINS_QUERY_KEY = ["admin", "admins"] as const;

const PAGE_SIZE = 20;

export type AuditLogFilters = {
  adminId?: string;
  actionType?: AdminActionType;
  dateFrom?: string;
  dateTo?: string;
  query?: string;
};

export function useAuditLog(filters: AuditLogFilters) {
  const handleAdminApiError = useAdminApiErrorHandler();
  const user = useCurrentUser();

  const apiFilters: AdminAuditFilters = {
    ...(filters.adminId ? { admin_id: filters.adminId } : {}),
    ...(filters.actionType ? { action_type: filters.actionType } : {}),
    ...(filters.dateFrom ? { date_from: filters.dateFrom } : {}),
    ...(filters.dateTo ? { date_to: filters.dateTo } : {}),
    ...(filters.query ? { q: filters.query } : {}),
    limit: PAGE_SIZE
  };

  const query = useInfiniteQuery<
    AdminAuditPage,
    Error,
    InfiniteData<AdminAuditPage>,
    readonly unknown[],
    number
  >({
    enabled: user?.role === ADMIN_ROLE,
    initialPageParam: 0,
    getNextPageParam: (page, pages) => {
      const loaded = pages.flatMap((p) => p.items).length;
      return loaded < page.total ? loaded : undefined;
    },
    queryFn: ({ signal, pageParam }) =>
      adminAdapter.listAuditLog({ ...apiFilters, offset: pageParam }, signal),
    retry: (count, error) =>
      !(error instanceof ApiError && (error.status === 401 || error.status === 403)) && count < 1,
    queryKey: [...ADMIN_AUDIT_LOG_QUERY_KEY, user?.user_id, filters],
    staleTime: 0
  });

  useEffect(() => {
    if (query.error) {
      void handleAdminApiError(query.error);
    }
  }, [handleAdminApiError, query.error]);

  const items = useMemo(() => uniqueEntries(query.data?.pages ?? []), [query.data]);

  return {
    ...query,
    items,
    total: query.data?.pages[0]?.total ?? 0
  };
}

export function useAdminList() {
  const user = useCurrentUser();

  return useQuery<AdminSummary[]>({
    enabled: user?.role === ADMIN_ROLE,
    queryKey: [...ADMIN_ADMINS_QUERY_KEY, user?.user_id],
    queryFn: ({ signal }) => adminAdapter.listAdmins(signal),
    staleTime: 5 * 60 * 1000
  });
}

function uniqueEntries(pages: readonly AdminAuditPage[]): AdminAuditEntry[] {
  const seen = new Set<string>();
  return pages
    .flatMap((p) => p.items)
    .filter((item) => {
      if (seen.has(item.action_id)) return false;
      seen.add(item.action_id);
      return true;
    });
}

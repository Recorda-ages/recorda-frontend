import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { ADMIN_ROLE } from "@/features/auth/session";
import { ApiError } from "@/services/api";

import { useAdminApiErrorHandler } from "../../hooks/useAdminApiErrorHandler";
import { adminAdapter } from "../../services/adminAdapter";
import type { AdminTargetType } from "../../types";
import { ADMIN_REPORTS_QUERY_KEY } from "./useAdminReportGroups";

const NO_RETRY_STATUSES = new Set([401, 403, 404]);

export function useAdminReportDetail(targetType: AdminTargetType, targetId: string) {
  const handleAdminApiError = useAdminApiErrorHandler();
  const user = useCurrentUser();
  const query = useQuery({
    enabled: user?.role === ADMIN_ROLE,
    queryFn: ({ signal }) => adminAdapter.getReportDetail(targetType, targetId, signal),
    queryKey: [...ADMIN_REPORTS_QUERY_KEY, "detail", user?.user_id, targetType, targetId],
    retry: (count, error) =>
      !(error instanceof ApiError && NO_RETRY_STATUSES.has(error.status)) && count < 1,
    staleTime: 0
  });

  useEffect(() => {
    if (query.error) {
      void handleAdminApiError(query.error);
    }
  }, [handleAdminApiError, query.error]);

  return query;
}

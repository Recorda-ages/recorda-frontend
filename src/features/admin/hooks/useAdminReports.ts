import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

import { adminServiceMock } from "../services/adminService.mock";
import type { AdminReportFilters } from "../types";
import { useAdminApiErrorHandler } from "./useAdminApiErrorHandler";

export const ADMIN_REPORTS_QUERY_KEY = ["admin", "reports"] as const;

export function useAdminReports(filters: AdminReportFilters) {
  const handleAdminApiError = useAdminApiErrorHandler();
  const query = useQuery({
    queryFn: ({ signal }) => adminServiceMock.listReportGroups(filters, signal),
    queryKey: [
      ...ADMIN_REPORTS_QUERY_KEY,
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

  return query;
}

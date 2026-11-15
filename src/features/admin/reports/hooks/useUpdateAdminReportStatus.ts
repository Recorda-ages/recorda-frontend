import { useMutation, useQueryClient } from "@tanstack/react-query";

import { ApiError } from "@/services/api";

import { adminAdapter } from "../../services/adminAdapter";
import type {
  AdminReportStatusChange,
  AdminReportStatusChangeResult,
  AdminTargetType
} from "../../types";
import { ADMIN_REPORTS_QUERY_KEY } from "./useAdminReportGroups";

export function useUpdateAdminReportStatus(targetType: AdminTargetType, targetId: string) {
  const client = useQueryClient();
  const refreshReports = () => client.invalidateQueries({ queryKey: ADMIN_REPORTS_QUERY_KEY });

  return useMutation<AdminReportStatusChangeResult, Error, AdminReportStatusChange>({
    mutationFn: (change) => adminAdapter.updateReportStatus(targetType, targetId, change),
    onError: (error) => {
      if (isConflict(error)) {
        return refreshReports();
      }
    },
    onSuccess: () => refreshReports()
  });
}

export function isConflict(error: unknown) {
  return error instanceof ApiError && error.status === 409;
}

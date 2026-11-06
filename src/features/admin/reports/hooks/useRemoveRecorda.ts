import { useMutation, useQueryClient } from "@tanstack/react-query";

import { adminAdapter } from "../../services/adminAdapter";
import type { AdminActionReason, AdminRecordaRemoval } from "../../types";
import { ADMIN_REPORTS_QUERY_KEY } from "./useAdminReportGroups";
import { isConflict } from "./useUpdateAdminReportStatus";

export function useRemoveRecorda(recordaId: string) {
  const client = useQueryClient();
  const refreshReports = () => client.invalidateQueries({ queryKey: ADMIN_REPORTS_QUERY_KEY });

  return useMutation<AdminRecordaRemoval, Error, AdminActionReason>({
    mutationFn: (payload) => adminAdapter.removeRecorda(recordaId, payload),
    onError: (error) => {
      if (isConflict(error)) {
        return refreshReports();
      }
    },
    onSuccess: () => refreshReports()
  });
}

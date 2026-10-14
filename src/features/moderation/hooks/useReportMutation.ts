import { useMutation } from "@tanstack/react-query";
import { reportService } from "../services/reportService";
import type { ReportCreatedResponse, ReportMutationInput } from "../types";

export const useReportMutation = () => {
  return useMutation<ReportCreatedResponse, Error, ReportMutationInput>({
    mutationFn: ({ description = "", target }) =>
      target.type === "RECORDA"
        ? reportService.reportRecorda(target.recordaId, description)
        : reportService.reportUser(target.userId, description)
  });
};

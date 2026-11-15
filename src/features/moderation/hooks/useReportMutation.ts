import { useMutation } from "@tanstack/react-query";

import { reportService } from "../services/reportService";
import type { ReportCreatedResponse, ReportMutationInput } from "../types";

/**
 * Denuncia uma Recorda ou um perfil. O `target.type` é o único que decide a
 * rota, então quem abre o modal não precisa saber qual endpoint foi chamado.
 *
 * Sem `onSuccess`/`onSettled`: uma denúncia não altera nada que esteja em
 * cache, logo não há query para invalidar. O resultado é tratado por chamada,
 * em `useReportDialog`.
 */
export function useReportMutation() {
  return useMutation<ReportCreatedResponse, Error, ReportMutationInput>({
    mutationFn: ({ description, target }) =>
      target.type === "RECORDA"
        ? reportService.reportRecorda(target.recordaId, description)
        : reportService.reportUser(target.userId, description)
  });
}

import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

import { ApiError } from "@/services/api";

import { ReportDialog } from "../components/ReportDialog";
import { ReportFeedback } from "../components/ReportFeedback";
import type { ReportTarget } from "../types";

import { useReportMutation } from "./useReportMutation";

/**
 * `duplicate` e `unavailable` fecham o modal e viram mensagem; `retryable`
 * mantém tudo aberto para um novo envio.
 */
type ReportOutcome = "duplicate" | "retryable" | "unavailable";

/**
 * API única que as telas precisam conhecer para oferecer denúncia:
 *
 * ```tsx
 * const { openReport, reportDialog } = useReportDialog();
 * openReport({ recordaId, type: "RECORDA" });
 * return <>{screen}{reportDialog}</>;
 * ```
 *
 * O hook é dono de todo o estado — alvo, texto, envio e resultado — porque a
 * mensagem de resultado tem de sobreviver ao fechamento do modal.
 */
export function useReportDialog() {
  const { t } = useTranslation();
  const { isPending, mutate } = useReportMutation();
  const [target, setTarget] = useState<ReportTarget | null>(null);
  const [visible, setVisible] = useState(false);
  const [description, setDescription] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);

  const openReport = useCallback((nextTarget: ReportTarget) => {
    setTarget(nextTarget);
    setVisible(true);
    setDescription("");
    setFeedback(null);
    setHasError(false);
  }, []);

  // O alvo continua montado depois de fechar para que a animação de saída não
  // pisque um cartão vazio; o texto, não — ele é descartado aqui.
  const dismiss = useCallback(() => {
    setVisible(false);
    setDescription("");
    setHasError(false);
  }, []);

  const submit = useCallback(() => {
    if (!target || isPending) {
      return;
    }

    setHasError(false);
    mutate(
      { description, target },
      {
        onError: (error) => {
          const outcome = classifyReportError(error);

          if (outcome === "retryable") {
            setHasError(true);
            return;
          }

          dismiss();
          setFeedback(
            t(
              outcome === "duplicate"
                ? "moderation.report.feedback.duplicate"
                : "moderation.report.feedback.unavailable"
            )
          );
        },
        onSuccess: () => {
          dismiss();
          setFeedback(t("moderation.report.feedback.success"));
        }
      }
    );
  }, [description, dismiss, isPending, mutate, t, target]);

  return {
    openReport,
    reportDialog: (
      <>
        {target ? (
          <ReportDialog
            description={description}
            hasError={hasError}
            onCancel={dismiss}
            onChangeDescription={setDescription}
            onSubmit={submit}
            pending={isPending}
            targetType={target.type}
            visible={visible}
          />
        ) : null}
        <ReportFeedback
          message={feedback ?? ""}
          onDismiss={() => setFeedback(null)}
          visible={feedback !== null}
        />
      </>
    )
  };
}

/**
 * 409 é informativo (já denunciado) e 403/404 significam alvo fora do ar: nos
 * dois casos não há o que tentar de novo. Todo o resto — rede, timeout, 5xx e
 * os códigos sem UX própria nesta task (400, 401, 422) — é recuperável, porque
 * manter o modal aberto é a única saída que não descarta o texto do usuário.
 */
function classifyReportError(error: unknown): ReportOutcome {
  if (!(error instanceof ApiError)) {
    return "retryable";
  }

  if (error.status === 409) {
    return "duplicate";
  }

  if (error.status === 403 || error.status === 404) {
    return "unavailable";
  }

  return "retryable";
}

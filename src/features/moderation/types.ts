/**
 * Alvo de uma denúncia (US 40 / US 41).
 *
 * Não existe alvo de comentário: `report.comment_id` é coluna reservada no
 * modelo e o MVP não tem rota para ela.
 */
export type ReportTarget =
  { recordaId: string; type: "RECORDA" } | { type: "USER"; userId: string };

/**
 * Corpo do `201` das rotas de denúncia, conforme as tasks de backend #80 e #81.
 * Os nomes vêm da API sem tradução, como no resto das features.
 */
export type ReportCreatedResponse = {
  created_at: string;
  report_id: string;
  status: string;
};

export type ReportMutationInput = {
  description: string;
  target: ReportTarget;
};

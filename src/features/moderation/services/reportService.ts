import { authApiClient } from "@/services/api";

import type { ReportCreatedResponse } from "../types";

/**
 * Contrato com as tasks de backend #80 (`POST /recordas/{id}/reports`) e #81
 * (`POST /users/{id}/reports`), que ainda não estão implementadas: quando as
 * rotas existirem, é por aqui que o modal fala com elas.
 *
 * A denúncia não tem motivo estruturado (D51), só a descrição opcional. Campo
 * vazio ou apenas com espaços vira `null`; texto de verdade segue exatamente
 * como foi digitado — normalizar o conteúdo da denúncia é papel do backend.
 */
export const reportService = {
  reportRecorda: (recordaId: string, description: string) =>
    authApiClient.post<ReportCreatedResponse>(
      `/recordas/${encodeURIComponent(recordaId)}/reports`,
      { description: toDescriptionPayload(description) }
    ),

  reportUser: (userId: string, description: string) =>
    authApiClient.post<ReportCreatedResponse>(`/users/${encodeURIComponent(userId)}/reports`, {
      description: toDescriptionPayload(description)
    })
};

function toDescriptionPayload(description: string) {
  return description.trim() === "" ? null : description;
}

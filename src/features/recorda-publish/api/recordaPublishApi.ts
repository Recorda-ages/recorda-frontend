import { apiClient } from "@/services/api";
import { secureStorage } from "@/services/storage";

import type {
  CreateRecordaPayload,
  CreateRecordaResult,
  RecordaMediaDraft,
  UploadRecordaMediaResult
} from "../types";

// Adaptação para o Schema legado da Recorda (midia/music/description) enquanto o
// Modelo v3 não é integrado ao backend — ver docs/adr/0001-integracao-publicacao-schema-legado.md.
// O snapshot musical completo (RecordaSongSnapshot) continua trafegando internamente
// em CreateRecordaPayload; só o título vai para a API nesta etapa. user_id (autor)
// não entra no payload: o backend o infere do Bearer token.

const AUTH_TOKEN_KEY = "auth_token";

type UploadRecordaMediaApiResponse = {
  media_url?: string;
  url?: string;
};

type CreateRecordaApiPayload = {
  description?: string;
  midia: string;
  music: string;
};

async function authHeaders(): Promise<Record<string, string> | undefined> {
  const token = await secureStorage.getItem(AUTH_TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : undefined;
}

export async function uploadRecordaMedia(
  media: RecordaMediaDraft
): Promise<UploadRecordaMediaResult> {
  const filePart: FormDataValue = {
    name: media.fileName,
    type: media.mimeType,
    uri: media.uri
  };

  const formData = new FormData();
  // lib.dom.d.ts (via "lib": ["DOM"]) types append as string | Blob; RN's FormData accepts { uri, name, type } at runtime.
  formData.append("file", filePart as unknown as Blob);

  const headers = await authHeaders();
  const response = await apiClient.post<UploadRecordaMediaApiResponse>(
    "/recordas/media",
    formData,
    headers && { headers }
  );

  const mediaUrl = response.url ?? response.media_url;

  if (!mediaUrl) {
    throw new Error("Resposta de upload de mídia inválida.");
  }

  return { mediaUrl };
}

export async function createRecorda(payload: CreateRecordaPayload): Promise<CreateRecordaResult> {
  const body: CreateRecordaApiPayload = {
    description: payload.description,
    midia: payload.mediaUrl,
    music: payload.song.title
  };

  const headers = await authHeaders();
  return apiClient.post<CreateRecordaResult>("/recordas", body, headers && { headers });
}

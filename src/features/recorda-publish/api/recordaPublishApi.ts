import { apiClient } from "@/services/api";

import type {
  CreateRecordaPayload,
  CreateRecordaResult,
  MediaType,
  RecordaMediaDraft,
  UploadRecordaMediaResult
} from "../types";

// Contrato ainda não publicado por BE.02/BE.01/BE.03; formatos concretos ficam
// isolados aqui para que uma mudança no backend afete só este arquivo.
// user_id (autor) não entra no payload: assume-se que o backend o infere da
// autenticação da requisição — pendência de integração futura, sem contrato confirmado.

type UploadRecordaMediaApiResponse = {
  media_url?: string;
  url?: string;
};

type CreateRecordaApiPayload = {
  deezer_track_id: string;
  description?: string;
  media_type: MediaType;
  media_url: string;
  song_artist_name: string;
  song_cover_url: string;
  song_preview_url?: string;
  song_title: string;
};

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

  const response = await apiClient.post<UploadRecordaMediaApiResponse>("/recordas/media", formData);

  const mediaUrl = response.url ?? response.media_url;

  if (!mediaUrl) {
    throw new Error("Resposta de upload de mídia inválida.");
  }

  return { mediaUrl };
}

export function createRecorda(payload: CreateRecordaPayload): Promise<CreateRecordaResult> {
  const body: CreateRecordaApiPayload = {
    deezer_track_id: payload.song.deezerTrackId,
    description: payload.description,
    media_type: payload.mediaType,
    media_url: payload.mediaUrl,
    song_artist_name: payload.song.artistName,
    song_cover_url: payload.song.coverUrl,
    song_preview_url: payload.song.previewUrl,
    song_title: payload.song.title
  };

  return apiClient.post<CreateRecordaResult>("/recordas", body);
}

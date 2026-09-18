import { File } from "expo-file-system";

import { authApiClient } from "@/services/api";

import type {
  CreateRecordaPayload,
  CreateRecordaResult,
  RecordaMediaDraft,
  UploadRecordaMediaResult
} from "../types";

export const MEDIA_UPLOAD_TIMEOUT_MS = 120_000;

type UploadRecordaMediaApiResponse = {
  media_url?: string;
  url?: string;
};

type CreateRecordaApiPayload = {
  deezer_track_id: string;
  description?: string;
  media_type: CreateRecordaPayload["mediaType"];
  media_url: string;
  song_artist_name: string;
  song_cover_url: string;
  song_preview_url: string | null;
  song_title: string;
};

export async function uploadRecordaMedia(
  media: RecordaMediaDraft
): Promise<UploadRecordaMediaResult> {
  const formData = new FormData();
  formData.append("file", new File(media.uri) as unknown as Blob, media.fileName);

  const response = await authApiClient.post<UploadRecordaMediaApiResponse>(
    "/recordas/media",
    formData,
    { timeoutMs: MEDIA_UPLOAD_TIMEOUT_MS }
  );

  const mediaUrl = response.url ?? response.media_url;

  if (!mediaUrl) {
    throw new Error("Resposta de upload de mídia inválida.");
  }

  return { mediaUrl };
}

export async function createRecorda(payload: CreateRecordaPayload): Promise<CreateRecordaResult> {
  const body: CreateRecordaApiPayload = {
    deezer_track_id: payload.song.deezerTrackId,
    description: payload.description,
    media_type: payload.mediaType,
    media_url: payload.mediaUrl,
    song_artist_name: payload.song.artistName,
    song_cover_url: payload.song.coverUrl,
    song_preview_url: payload.song.previewUrl ?? null,
    song_title: payload.song.title
  };

  return authApiClient.post<CreateRecordaResult>("/recordas", body);
}

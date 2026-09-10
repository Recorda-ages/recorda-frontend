export type MediaType = "PHOTO" | "VIDEO";

// Campos mínimos que o upload precisa; a forma final depende do que a US6 entregar.
export type RecordaMediaDraft = {
  fileName: string;
  mimeType: string;
  type: MediaType;
  uri: string;
};

export type RecordaSongSnapshot = {
  artistName: string;
  coverUrl: string;
  deezerTrackId: string;
  previewUrl?: string;
  title: string;
};

export type PublishRecordaDraft = {
  description?: string;
  media: RecordaMediaDraft;
  song: RecordaSongSnapshot;
};

export type UploadRecordaMediaResult = {
  mediaUrl: string;
};

export type CreateRecordaPayload = {
  description?: string;
  mediaType: MediaType;
  mediaUrl: string;
  song: RecordaSongSnapshot;
};

// Formato de BE.03 ainda indefinido; mantido opaco até o contrato existir.
export type CreateRecordaResult = unknown;

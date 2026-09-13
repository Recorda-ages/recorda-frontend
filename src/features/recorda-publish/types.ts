export type MediaType = "PHOTO" | "VIDEO";

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

export type CreateRecordaResult = {
  data: string | null;
  deezer_track_id: string | null;
  description: string | null;
  id: number;
  media_type: string | null;
  midia: string | null;
  music: string | null;
  song_artist_name: string | null;
  song_cover_url: string | null;
  user_id: number | null;
};

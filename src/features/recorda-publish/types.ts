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
  created_at: string;
  deezer_track_id: string;
  description: string | null;
  media_type: MediaType;
  media_url: string;
  recorda_id: string;
  song_artist_name: string;
  song_cover_url: string;
  song_preview_url: string | null;
  song_title: string;
  user_id: string;
};

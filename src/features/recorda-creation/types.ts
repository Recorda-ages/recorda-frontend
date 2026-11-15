export type RecordaDraftMedia = {
  type: "photo" | "video";
  uri: string;
};

export type RecordaDraftSong = {
  deezerTrackId: string;
  title: string;
  artistName: string;
  coverUrl: string;
  previewUrl: string | null;
};

export type RecordaDraft = {
  mentionedUserIds?: string[];
  media: RecordaDraftMedia | null;
  song: RecordaDraftSong | null;
  description: string;
};

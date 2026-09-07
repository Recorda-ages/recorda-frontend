export type MusicTrack = {
  id: string;
  title: string;
  artist: string;
  artworkUrl?: string;
};

// The host owns selections from all three steps and maps them to the backend contract.
export type MusicPreferences = {
  artistIds: number[];
  genreIds: number[];
  track: MusicTrack;
};

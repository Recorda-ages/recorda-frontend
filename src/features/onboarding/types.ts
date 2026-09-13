export type MusicTrack = {
  id: number;
  title: string;
  artist: string;
  artworkUrl?: string;
};

export type MusicSelection = {
  id: number;
  name: string;
  imageUrl?: string;
};

export type MusicPreferences = {
  genres: MusicSelection[];
  artists: MusicSelection[];
  track: MusicTrack;
};

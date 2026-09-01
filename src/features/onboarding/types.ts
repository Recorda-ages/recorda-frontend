export type MusicTrack = {
  id: number;
  title: string;
  artist: string;
  artworkUrl?: string;
};

// A genre or artist chosen in steps 1 and 2. `id` is the Deezer id the backend stores.
export type MusicSelection = {
  id: number;
  name: string;
};

export type MusicPreferences = {
  genres: MusicSelection[];
  artists: MusicSelection[];
  track: MusicTrack;
};

export type Genre = { id: number; imagem: string; nome: string };

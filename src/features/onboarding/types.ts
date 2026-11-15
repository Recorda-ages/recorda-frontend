export type MusicTrack = {
  id: number;
  title: string;
  artist: string;
  artworkUrl?: string;
  previewUrl?: string;
};

// A genre or artist chosen in steps 1 and 2. `id` is the Deezer id the backend stores.
export type MusicSelection = {
  id: number;
  name: string;
  pictureUrl?: string;
};

export type MusicPreferences = {
  genres: MusicSelection[];
  artists: MusicSelection[];
  track: MusicTrack;
};

export type MusicItemResponse = {
  deezer_id: number;
  name: string;
  picture_url: string | null;
};

export type MusicPreferencesResponse = {
  genres: MusicItemResponse[];
  artists: MusicItemResponse[];
  favorite_track: {
    deezer_id: number;
    title: string;
    artist_name: string;
    cover_url: string;
    preview_url: string | null;
  };
  onboarding_completed: boolean;
};

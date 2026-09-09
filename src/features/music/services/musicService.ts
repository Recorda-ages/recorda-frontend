import { apiClient } from "@/services/api";

export type Genre = {
  id: number;
  name: string;
  picture_url: string | null;
};

export type Artist = {
  id: number;
  name: string;
  picture_url: string | null;
};

export type Track = {
  id: number;
  title: string;
  artist: string;
  album: string;
  cover_url: string | null;
  preview_url: string | null;
  genre_id: number | null;
};

function buildMusicSearchPath(path: string, q: string) {
  return `${path}?q=${encodeURIComponent(q.trim())}`;
}

export const musicService = {
  getGenres: () => apiClient.get<Genre[]>("/music/genres"),

  searchArtists: (q: string) =>
    apiClient.get<Artist[]>(buildMusicSearchPath("/music/artists/search", q)),

  searchTracks: (q: string) =>
    apiClient.get<Track[]>(buildMusicSearchPath("/music/tracks/search", q))
};

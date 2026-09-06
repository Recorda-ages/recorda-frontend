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

export const musicService = {
  getGenres: () => apiClient.get<Genre[]>("/music/genres"),

  searchArtists: (q: string) =>
    apiClient.get<Artist[]>(`/music/artists/search?q=${encodeURIComponent(q)}`),

  searchTracks: (q: string) =>
    apiClient.get<Track[]>(`/music/tracks/search?q=${encodeURIComponent(q)}`)
};

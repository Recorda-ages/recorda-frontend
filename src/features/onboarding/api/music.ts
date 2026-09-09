import { apiClient } from "@/services/api";
import { secureStorage } from "@/services/storage";

import type { MusicPreferences, MusicSelection, MusicTrack } from "../types";

const AUTH_TOKEN_KEY = "auth_token";

type TrackResponse = {
  id: number;
  title: string;
  artist: string;
  album: string;
  cover_url: string | null;
  preview_url: string | null;
  genre_id: number | null;
};

export async function searchTracks(query: string, signal: AbortSignal): Promise<MusicTrack[]> {
  const tracks = await apiClient.get<TrackResponse[]>(
    `/music/tracks/search?q=${encodeURIComponent(query)}`,
    { signal }
  );

  return tracks.map((track) => ({
    id: track.id,
    title: track.title,
    artist: track.artist,
    artworkUrl: track.cover_url ?? undefined
  }));
}

export async function saveMusicPreferences(preferences: MusicPreferences): Promise<void> {
  const token = await secureStorage.getItem(AUTH_TOKEN_KEY);

  await apiClient.post(
    "/users/me/music-preferences",
    {
      genres: preferences.genres.map(toMusicItem),
      artists: preferences.artists.map(toMusicItem),
      favorite_track: { deezer_id: preferences.track.id, name: preferences.track.title }
    },
    token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
  );
}

function toMusicItem(selection: MusicSelection) {
  return { deezer_id: selection.id, name: selection.name };
}

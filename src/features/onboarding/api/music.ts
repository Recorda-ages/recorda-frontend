import { apiClient, authApiClient } from "@/services/api";

import type { MusicPreferences, MusicSelection, MusicTrack } from "../types";

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
  await authApiClient.post("/users/me/music-preferences", {
    genres: preferences.genres.map(toMusicItem),
    artists: preferences.artists.map(toMusicItem),
    favorite_track: { deezer_id: preferences.track.id, name: preferences.track.title }
  });
}

function toMusicItem(selection: MusicSelection) {
  return { deezer_id: selection.id, name: selection.name };
}

import { musicService } from "@/features/music/services/musicService";
import { authApiClient } from "@/services/api";

import type { MusicPreferences, MusicSelection, MusicTrack } from "../types";

export async function searchTracks(query: string, signal: AbortSignal): Promise<MusicTrack[]> {
  const tracks = await musicService.searchTracks(query, signal);

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

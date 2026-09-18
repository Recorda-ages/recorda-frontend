import { musicService } from "@/features/music/services/musicService";
import { authApiClient } from "@/services/api";

import type { MusicPreferences, MusicSelection, MusicTrack } from "../types";

export async function searchTracks(query: string, signal: AbortSignal): Promise<MusicTrack[]> {
  const tracks = await musicService.searchTracks(query, signal);

  return tracks.map((track) => ({
    id: track.id,
    title: track.title,
    artist: track.artist,
    artworkUrl: track.cover_url ?? undefined,
    previewUrl: track.preview_url ?? undefined
  }));
}

export async function saveMusicPreferences(preferences: MusicPreferences): Promise<void> {
  await authApiClient.post("/users/me/music-preferences", {
    genres: preferences.genres.map(toMusicItem),
    artists: preferences.artists.map(toMusicItem),
    favorite_track: toFavoriteTrack(preferences.track)
  });
}

function toMusicItem(selection: MusicSelection) {
  return {
    deezer_id: selection.id,
    name: selection.name,
    picture_url: selection.pictureUrl ?? null
  };
}

function toFavoriteTrack(track: MusicTrack) {
  return {
    deezer_id: track.id,
    title: track.title,
    artist_name: track.artist,
    cover_url: track.artworkUrl ?? "",
    preview_url: track.previewUrl ?? null
  };
}

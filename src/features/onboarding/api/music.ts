import { musicService } from "@/features/music/services/musicService";
import { authApiClient } from "@/services/api";

import type {
  MusicItemResponse,
  MusicPreferences,
  MusicPreferencesResponse,
  MusicSelection,
  MusicTrack
} from "../types";

export async function getMusicPreferences(signal?: AbortSignal): Promise<MusicPreferences> {
  const response = await authApiClient.get<MusicPreferencesResponse>(
    "/users/me/music-preferences",
    { signal }
  );

  return {
    genres: response.genres.map((item) => ({
      id: item.deezer_id,
      name: item.name,
      pictureUrl: item.picture_url ?? undefined
    })),
    artists: response.artists.map((item) => ({
      id: item.deezer_id,
      name: item.name,
      pictureUrl: item.picture_url ?? undefined
    })),
    track: {
      id: response.favorite_track.deezer_id,
      title: response.favorite_track.title,
      artist: response.favorite_track.artist_name,
      artworkUrl: response.favorite_track.cover_url || undefined,
      previewUrl: response.favorite_track.preview_url ?? undefined
    }
  };
}

export async function searchTracks(query: string, signal: AbortSignal): Promise<MusicTrack[]> {
  const tracks = await musicService.searchTracks(query, signal);

  return tracks.map(toMusicTrack);
}

export async function getPopularTracks(signal: AbortSignal): Promise<MusicTrack[]> {
  const tracks = await musicService.getPopularTracks(signal);

  return tracks.map(toMusicTrack);
}

function toMusicTrack(track: {
  id: number;
  title: string;
  artist: string;
  cover_url: string | null;
  preview_url: string | null;
}): MusicTrack {
  return {
    id: track.id,
    title: track.title,
    artist: track.artist,
    artworkUrl: track.cover_url ?? undefined,
    previewUrl: track.preview_url ?? undefined
  };
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

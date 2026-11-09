import { useQuery } from "@tanstack/react-query";

import { ApiError } from "@/services/api";

import { profileMusicTastesQueryKey } from "../queryKeys";
import { profileService } from "../services/profileService";
import type { ProfileMusicItem, ProfileMusicTastes } from "../types";

const NO_RETRY_STATUSES = new Set([401, 403, 404]);

export type ProfileMusicChip = { id: number; name: string; pictureUrl: string | null };

export type ProfileMusicChips = { artists: ProfileMusicChip[]; genres: ProfileMusicChip[] };

function toChip(item: ProfileMusicItem): ProfileMusicChip {
  return { id: item.deezer_id, name: item.name, pictureUrl: item.picture_url };
}

function toChips(tastes: ProfileMusicTastes): ProfileMusicChips {
  return { artists: tastes.artists.map(toChip), genres: tastes.genres.map(toChip) };
}

/**
 * Favorite artists and genres of another user, as header chips. A failure only hides the
 * chips, so the profile never waits for them.
 */
export function useProfileMusicTastes(userId: string | undefined, enabled = true) {
  return useQuery({
    enabled: enabled && Boolean(userId),
    queryFn: ({ signal }) => profileService.getUserMusicTastes(userId ?? "", signal),
    queryKey: profileMusicTastesQueryKey(userId ?? ""),
    retry: (count, error) =>
      !(error instanceof ApiError && NO_RETRY_STATUSES.has(error.status)) && count < 1,
    select: toChips
  });
}

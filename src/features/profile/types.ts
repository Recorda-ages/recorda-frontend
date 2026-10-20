import type { FollowStatus } from "@/features/follow";

/**
 * Espelha `ProfileRead` (contrato C-2) de `app/schemas/profile.py` no backend, na branch
 * `feat/113-calculo-streak-de-publicacoes`, ainda não mergeada. O perfil de terceiros é da
 * #109; até ela sair, este tipo segue aquele schema (ver IMPLEMENTATION_NOTES.md).
 */
export type ProfileRead = {
  can_view_content: boolean;
  /** `null` quando o backend não expõe os contadores (perfil privado, segundo a #109). */
  counts: ProfileCounts | null;
  favorite_song: ProfileFavoriteSong;
  is_private: boolean;
  name: string;
  profile_picture_url: string | null;
  relationship: ProfileRelationship;
  /** Faz parte do contrato, mas a badge é da US35: esta task não a exibe. */
  streak: ProfileStreak | null;
  user_id: string;
  username: string;
};

export type ProfileCounts = {
  followers: number;
  following: number;
  recordas: number;
};

export type ProfileFavoriteSong = {
  artist_name: string;
  /** Pode vir `""` quando o Deezer não tem capa (ADR 0001 do backend). */
  cover_url: string;
  deezer_track_id: string;
  preview_url: string | null;
  title: string;
};

export type ProfileRelationship = {
  follow_id: string | null;
  follow_status: FollowStatus;
  is_self: boolean;
};

export type ProfileStreak = {
  current_days: number;
  published_today: boolean;
};

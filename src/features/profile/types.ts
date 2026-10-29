import type { FeedItem } from "@/features/feed/types";
import type { FollowStatus } from "@/features/follow";

/**
 * Espelha `ProfileRead` (contrato C-2) de `app/schemas/profile.py` no backend. Já é a
 * resposta de `GET /users/me/profile` na `dev` do backend. O perfil de terceiros (#109)
 * usará o mesmo contrato quando existir (ver IMPLEMENTATION_NOTES.md).
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
  /** Faz parte do contrato, mas a badge é da US35 (#260): estas telas não a exibem. */
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

/**
 * Espelha `RecordaGridItem` de `app/schemas/recorda.py`: só o necessário para a miniatura,
 * sem curtidas nem descrição. Resposta de `GET /users/{user_id}/recordas`.
 */
export type RecordaGridItem = {
  /** ISO 8601. A grade vem da mais recente para a mais antiga. */
  created_at: string;
  media_type: FeedItem["media_type"];
  media_url: string;
  recorda_id: string;
  song_artist_name: string;
  song_cover_url: string;
  song_title: string;
};

/** Espelha `RecordaGridPage`: página paginada por cursor; `null` no fim da lista. */
export type RecordaGridPage = {
  items: RecordaGridItem[];
  next_cursor: string | null;
};

import type { FollowStatus } from "@/features/follow";

/** Espelha `UserSearchResult` de `app/schemas/user.py` no backend. */
export type UserSearchResultItem = {
  avatar_url: string | null;
  follow_status: FollowStatus;
  user_id: string;
  username: string;
};

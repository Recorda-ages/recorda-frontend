import type { FollowStatus } from "@/features/follow";

/** Espelha `SuggestedUser` de `app/schemas/user.py`: sem `follow_status`, nunca é seguido. */
export type SuggestedUserItem = {
  affinity: number;
  avatar_url: string | null;
  user_id: string;
  username: string;
};

/** Espelha `UserSearchResult` de `app/schemas/user.py` no backend. */
export type UserSearchResultItem = {
  avatar_url: string | null;
  follow_status: FollowStatus;
  user_id: string;
  username: string;
};

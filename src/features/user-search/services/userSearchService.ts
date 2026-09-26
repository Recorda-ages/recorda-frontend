import { authApiClient } from "@/services/api";

import type { UserSearchResultItem } from "../types";

export const userSearchService = {
  searchUsers: (q: string, signal?: AbortSignal) =>
    authApiClient.get<UserSearchResultItem[]>(`/users/search?q=${encodeURIComponent(q.trim())}`, {
      signal
    })
};

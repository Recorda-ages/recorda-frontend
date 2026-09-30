import { authApiClient } from "@/services/api";

import type { SuggestedUserItem, UserSearchResultItem } from "../types";

export const userSearchService = {
  getSuggestions: (signal?: AbortSignal) =>
    authApiClient.get<SuggestedUserItem[]>("/users/suggestions", { signal }),

  searchUsers: (q: string, signal?: AbortSignal) =>
    authApiClient.get<UserSearchResultItem[]>(`/users/search?q=${encodeURIComponent(q.trim())}`, {
      signal
    })
};

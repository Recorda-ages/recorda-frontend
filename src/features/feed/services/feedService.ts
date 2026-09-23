import { authApiClient } from "@/services/api";

import type { FeedPage } from "../types";

export const feedService = {
  getFollowingFeed: (cursor: string | null = null, signal?: AbortSignal) => {
    const path = cursor
      ? `/feed/following?cursor=${encodeURIComponent(cursor)}`
      : "/feed/following";

    return authApiClient.get<FeedPage>(path, { signal });
  }
};

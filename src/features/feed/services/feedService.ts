import { authApiClient } from "@/services/api";

import type { FeedPage } from "../types";

export const feedService = {
  getFollowingFeed: (signal?: AbortSignal) =>
    authApiClient.get<FeedPage>("/feed/following", { signal })
};

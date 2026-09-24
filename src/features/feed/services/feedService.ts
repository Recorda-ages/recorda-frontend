import { authApiClient } from "@/services/api";

import type { FeedPage } from "../types";
import { getMockGeneralFeedPage } from "./generalFeedMock";

export const feedService = {
  getFollowingFeed: (cursor: string | null = null, signal?: AbortSignal) => {
    const path = cursor
      ? `/feed/following?cursor=${encodeURIComponent(cursor)}`
      : "/feed/following";

    return authApiClient.get<FeedPage>(path, { signal });
  },

  // TEMP (pending backend issue #39): GET /feed/general is not available yet, so this
  // resolves mock pages from ./generalFeedMock. Remove the mock once #39 is available:
  // replace this body with the real authenticated call, after validating the real contract
  // (especially the pagination/cursor shape; the signature assumes /feed/following's style).
  // The response is already mixed server-side: never mix Following + Discovery on the client.
  getGeneralFeed: async (cursor: string | null = null, signal?: AbortSignal) => {
    void signal;

    return getMockGeneralFeedPage(cursor);
  }
};

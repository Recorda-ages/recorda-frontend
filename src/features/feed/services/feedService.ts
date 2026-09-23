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

  // TEMP: GET /feed/general is not available yet, so this resolves mock pages from
  // ./generalFeedMock. Replace the body with the real authenticated call (and delete the
  // mock file) once the endpoint is merged. The signature is already the final one.
  getGeneralFeed: async (cursor: string | null = null, signal?: AbortSignal) => {
    void signal;

    return getMockGeneralFeedPage(cursor);
  }
};

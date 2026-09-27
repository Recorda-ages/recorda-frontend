import { authApiClient } from "@/services/api";

import type { FeedPage, RecordaCommentResponse, RecordaDetailResponse } from "../types";

function buildFeedPath(feed: "following" | "general", cursor: string | null) {
  return cursor ? `/feed/${feed}?cursor=${encodeURIComponent(cursor)}` : `/feed/${feed}`;
}

export const feedService = {
  getRecordaById: (recordaId: string, signal?: AbortSignal) =>
    authApiClient.get<RecordaDetailResponse>(`/recordas/${encodeURIComponent(recordaId)}`, {
      signal
    }),

  getComments: (recordaId: string, signal?: AbortSignal) =>
    authApiClient.get<RecordaCommentResponse[]>(
      `/recordas/${encodeURIComponent(recordaId)}/comments`,
      { signal }
    ),

  createComment: (recordaId: string, content: string) =>
    authApiClient.post<RecordaCommentResponse>(
      `/recordas/${encodeURIComponent(recordaId)}/comments`,
      { content }
    ),

  getFollowingFeed: (cursor: string | null = null, signal?: AbortSignal) => {
    return authApiClient.get<FeedPage>(buildFeedPath("following", cursor), { signal });
  },

  getGeneralFeed: (cursor: string | null = null, signal?: AbortSignal) =>
    authApiClient.get<FeedPage>(buildFeedPath("general", cursor), { signal })
};

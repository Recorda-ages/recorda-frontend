import { authApiClient } from "@/services/api";

import type {
  FeedPage,
  RecordaCommentResponse,
  RecordaDetailResponse,
  RecordaLikeState
} from "../types";

function buildFeedPath(feed: "following" | "general", cursor: string | null) {
  return cursor ? `/feed/${feed}?cursor=${encodeURIComponent(cursor)}` : `/feed/${feed}`;
}

export const feedService = {
  deleteRecorda: (recordaId: string) =>
    authApiClient.delete<void>(`/recordas/${encodeURIComponent(recordaId)}`),

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

  likeRecorda: (recordaId: string) =>
    authApiClient.post<RecordaLikeState>(`/recordas/${encodeURIComponent(recordaId)}/likes`),

  unlikeRecorda: (recordaId: string) =>
    authApiClient.delete<RecordaLikeState>(`/recordas/${encodeURIComponent(recordaId)}/likes`),

  setRecordaLike: (recordaId: string, liked: boolean) =>
    liked ? feedService.likeRecorda(recordaId) : feedService.unlikeRecorda(recordaId),

  getFollowingFeed: (cursor: string | null = null, signal?: AbortSignal) => {
    return authApiClient.get<FeedPage>(buildFeedPath("following", cursor), { signal });
  },

  getGeneralFeed: (cursor: string | null = null, signal?: AbortSignal) =>
    authApiClient.get<FeedPage>(buildFeedPath("general", cursor), { signal })
};

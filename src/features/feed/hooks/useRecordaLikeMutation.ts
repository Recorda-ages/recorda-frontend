import { type InfiniteData, useMutation, useQueryClient } from "@tanstack/react-query";

import { NOTIFICATIONS_QUERY_KEY } from "@/features/notifications/queryKeys";

import { feedService } from "../services/feedService";
import { recordaDetailsQueryKey } from "../queryKeys";
import type { FeedPage, RecordaDetailResponse, RecordaLikeState } from "../types";

const FEED_QUERY_PREFIX = ["feed"] as const;

type ToggleLikeInput = {
  isLiked: boolean;
  recordaId: string;
};

type FeedCache = InfiniteData<FeedPage, string | null>;

export function useRecordaLikeMutation() {
  const queryClient = useQueryClient();

  return useMutation<RecordaLikeState, Error, ToggleLikeInput>({
    mutationFn: ({ isLiked, recordaId }) => feedService.setRecordaLike(recordaId, isLiked),
    onSuccess: (state, { isLiked, recordaId }) => {
      queryClient.setQueriesData<FeedCache>({ queryKey: FEED_QUERY_PREFIX }, (data) => {
        if (!data) return data;

        return {
          ...data,
          pages: data.pages.map((page) => ({
            ...page,
            items: page.items.map((item) =>
              item.recorda_id === recordaId ? { ...item, ...state } : item
            )
          }))
        };
      });

      queryClient.setQueryData<RecordaDetailResponse>(
        recordaDetailsQueryKey(recordaId),
        (detail) => (detail ? { ...detail, ...state } : detail)
      );

      if (isLiked) {
        void queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
      }
    }
  });
}

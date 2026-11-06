import { getSessionGeneration } from "@/services/api/sessionLifecycle";
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

  return useMutation({
    onMutate: async ({ isLiked, recordaId }: ToggleLikeInput) => {
      const generation = getSessionGeneration();
      await Promise.all([
        queryClient.cancelQueries({ queryKey: FEED_QUERY_PREFIX }),
        queryClient.cancelQueries({ queryKey: recordaDetailsQueryKey(recordaId) })
      ]);
      if (generation !== getSessionGeneration()) throw new Error("Session ended");
      const feeds = queryClient.getQueriesData<FeedCache>({ queryKey: FEED_QUERY_PREFIX });
      const detail = queryClient.getQueryData<RecordaDetailResponse>(
        recordaDetailsQueryKey(recordaId)
      );
      const optimistic = <T extends RecordaLikeState>(item: T): T => ({
        ...item,
        is_liked: isLiked,
        likes_count: Math.max(
          0,
          item.likes_count + (item.is_liked === isLiked ? 0 : isLiked ? 1 : -1)
        )
      });
      queryClient.setQueriesData<FeedCache>({ queryKey: FEED_QUERY_PREFIX }, (data) =>
        data
          ? {
              ...data,
              pages: data.pages.map((page) => ({
                ...page,
                items: page.items.map((item) =>
                  item.recorda_id === recordaId ? optimistic(item) : item
                )
              }))
            }
          : data
      );
      queryClient.setQueryData<RecordaDetailResponse>(recordaDetailsQueryKey(recordaId), (item) =>
        item ? optimistic(item) : item
      );
      return { feeds, detail, generation };
    },
    onError: (_error, { recordaId }, context) => {
      if (!context || context.generation !== getSessionGeneration()) return;
      context.feeds.forEach(([key, previous]) => {
        const old = previous?.pages
          .flatMap((page) => page.items)
          .find((item) => item.recorda_id === recordaId);
        if (!old) return;
        queryClient.setQueryData<FeedCache>(key, (data) =>
          data
            ? {
                ...data,
                pages: data.pages.map((page) => ({
                  ...page,
                  items: page.items.map((item) =>
                    item.recorda_id === recordaId
                      ? { ...item, is_liked: old.is_liked, likes_count: old.likes_count }
                      : item
                  )
                }))
              }
            : data
        );
      });
      if (context.detail)
        queryClient.setQueryData(recordaDetailsQueryKey(recordaId), context.detail);
    },
    mutationFn: ({ isLiked, recordaId }) => feedService.setRecordaLike(recordaId, isLiked),
    onSettled: (_state, _error, { recordaId }, context) => {
      if (context?.generation === getSessionGeneration())
        void queryClient.invalidateQueries({ queryKey: recordaDetailsQueryKey(recordaId) });
    },
    onSuccess: (state, { isLiked, recordaId }, context) => {
      if (context?.generation !== getSessionGeneration()) return;
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

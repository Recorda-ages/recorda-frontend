import {
  type InfiniteData,
  useInfiniteQuery,
  useMutation,
  useQueryClient
} from "@tanstack/react-query";

import { notificationService } from "../services/notificationService";
import type { FollowRequestDecision, NotificationItem, NotificationPage } from "../types";

export const NOTIFICATIONS_QUERY_KEY = ["notifications"] as const;
export const NOTIFICATIONS_PAGE_SIZE = 20;

type NotificationsData = InfiniteData<NotificationPage, number>;

export function useNotifications() {
  return useInfiniteQuery<
    NotificationPage,
    Error,
    NotificationsData,
    typeof NOTIFICATIONS_QUERY_KEY,
    number
  >({
    getNextPageParam: (lastPage, pages) =>
      lastPage.items.length === NOTIFICATIONS_PAGE_SIZE
        ? pages.reduce((count, page) => count + page.items.length, 0)
        : undefined,
    initialPageParam: 0,
    queryFn: ({ pageParam, signal }) =>
      notificationService.list(NOTIFICATIONS_PAGE_SIZE, pageParam, signal),
    queryKey: NOTIFICATIONS_QUERY_KEY
  });
}

export function useMarkAllNotificationsAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: notificationService.markAllAsRead,
    onError: (_error, _variables, previous) => {
      if (previous) {
        queryClient.setQueryData(NOTIFICATIONS_QUERY_KEY, previous);
      }
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
      const previous = queryClient.getQueryData<NotificationsData>(NOTIFICATIONS_QUERY_KEY);

      queryClient.setQueryData<NotificationsData>(NOTIFICATIONS_QUERY_KEY, (data) =>
        data
          ? {
              ...data,
              pages: data.pages.map((page) => ({ ...page, unread_count: 0 }))
            }
          : data
      );

      return previous;
    }
  });
}

type RespondVariables = {
  decision: FollowRequestDecision;
  notification: NotificationItem;
};

export function useRespondFollowRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ decision, notification }: RespondVariables) => {
      if (!notification.follow_id) {
        throw new Error("Follow request notification is missing follow_id");
      }

      return notificationService.respondToFollowRequest(notification.follow_id, decision);
    },
    onError: (_error, _variables, previous) => {
      if (previous) {
        queryClient.setQueryData(NOTIFICATIONS_QUERY_KEY, previous);
      }
    },
    onMutate: async ({ decision, notification }: RespondVariables) => {
      await queryClient.cancelQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
      const previous = queryClient.getQueryData<NotificationsData>(NOTIFICATIONS_QUERY_KEY);

      queryClient.setQueryData<NotificationsData>(NOTIFICATIONS_QUERY_KEY, (data) => {
        if (!data) {
          return data;
        }

        return {
          ...data,
          pages: data.pages.map((page) => ({
            ...page,
            items:
              decision === "decline"
                ? page.items.filter((item) => item.notification_id !== notification.notification_id)
                : page.items.map((item) =>
                    item.notification_id === notification.notification_id
                      ? { ...item, type: "NEW_FOLLOWER" as const }
                      : item
                  )
          }))
        };
      });

      return previous;
    }
  });
}

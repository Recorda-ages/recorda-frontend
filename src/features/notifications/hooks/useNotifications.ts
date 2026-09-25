import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { notificationService } from "../services/notificationService";
import type { FollowRequestDecision, NotificationItem, NotificationPage } from "../types";

export const NOTIFICATIONS_QUERY_KEY = ["notifications"] as const;

export function useNotifications() {
  return useQuery({
    queryFn: ({ signal }) => notificationService.list(signal),
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
      const previous = queryClient.getQueryData<NotificationPage>(NOTIFICATIONS_QUERY_KEY);

      queryClient.setQueryData<NotificationPage>(NOTIFICATIONS_QUERY_KEY, (page) =>
        page ? { ...page, unread_count: 0 } : page
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
    mutationFn: ({ decision, notification }: RespondVariables) =>
      notificationService.respondToFollowRequest(notification.sender?.user_id ?? "", decision),
    onError: (_error, _variables, previous) => {
      if (previous) {
        queryClient.setQueryData(NOTIFICATIONS_QUERY_KEY, previous);
      }
    },
    onMutate: async ({ decision, notification }: RespondVariables) => {
      await queryClient.cancelQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
      const previous = queryClient.getQueryData<NotificationPage>(NOTIFICATIONS_QUERY_KEY);

      queryClient.setQueryData<NotificationPage>(NOTIFICATIONS_QUERY_KEY, (page) => {
        if (!page) {
          return page;
        }

        const items =
          decision === "decline"
            ? page.items.filter((item) => item.notification_id !== notification.notification_id)
            : page.items.map((item) =>
                item.notification_id === notification.notification_id
                  ? { ...item, type: "NEW_FOLLOWER" as const }
                  : item
              );

        return { ...page, items };
      });

      return previous;
    }
  });
}

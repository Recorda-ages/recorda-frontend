import {
  type InfiniteData,
  type QueryClient,
  useInfiniteQuery,
  useMutation,
  useQueryClient
} from "@tanstack/react-query";

import { AUTH_ME_QUERY_KEY } from "@/features/auth/api/getCurrentUser";
import type { UserBasicResponse } from "@/features/auth/api/types";

import { notificationService } from "../services/notificationService";
import type { FollowRequestDecision, NotificationItem, NotificationPage } from "../types";
import { NOTIFICATIONS_QUERY_KEY } from "../queryKeys";

export { NOTIFICATIONS_QUERY_KEY } from "../queryKeys";
export const NOTIFICATIONS_PAGE_SIZE = 20;
const SESSION_CHANGED_ERROR = "Notification action cancelled because the session changed";

type PaginatedNotificationPage = NotificationPage & {
  _wasFull: boolean;
};

type NotificationsData = InfiniteData<PaginatedNotificationPage, number>;

function getAuthSession(queryClient: QueryClient) {
  return {
    query: queryClient.getQueryCache().find({ exact: true, queryKey: AUTH_ME_QUERY_KEY }),
    userId: queryClient.getQueryData<UserBasicResponse>(AUTH_ME_QUERY_KEY)?.user_id
  };
}

type NotificationMutationContext = {
  previous: NotificationsData | undefined;
  session: ReturnType<typeof getAuthSession>;
};

function isCurrentAuthSession(
  queryClient: QueryClient,
  session: NotificationMutationContext["session"]
) {
  const current = getAuthSession(queryClient);
  return current.query === session.query && current.userId === session.userId;
}

export function useNotifications() {
  return useInfiniteQuery<
    PaginatedNotificationPage,
    Error,
    NotificationsData,
    typeof NOTIFICATIONS_QUERY_KEY,
    number
  >({
    getNextPageParam: (lastPage: PaginatedNotificationPage, pages) =>
      lastPage._wasFull ? pages.reduce((count, page) => count + page.items.length, 0) : undefined,
    initialPageParam: 0,
    queryFn: async ({ pageParam, signal }) => {
      const page = await notificationService.list(NOTIFICATIONS_PAGE_SIZE, pageParam, signal);

      return {
        ...page,
        _wasFull: page.items.length === NOTIFICATIONS_PAGE_SIZE
      };
    },
    queryKey: NOTIFICATIONS_QUERY_KEY,
    refetchOnMount: "always"
  });
}

export function useMarkAllNotificationsAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: notificationService.markAllAsRead,
    onError: (_error, _variables, context) => {
      if (context?.previous && isCurrentAuthSession(queryClient, context.session)) {
        queryClient.setQueryData(NOTIFICATIONS_QUERY_KEY, context.previous);
      }
    },
    onMutate: async () => {
      const session = getAuthSession(queryClient);
      await queryClient.cancelQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });

      if (!isCurrentAuthSession(queryClient, session)) {
        throw new Error(SESSION_CHANGED_ERROR);
      }

      const previous = queryClient.getQueryData<NotificationsData>(NOTIFICATIONS_QUERY_KEY);

      queryClient.setQueryData<NotificationsData>(NOTIFICATIONS_QUERY_KEY, (data) =>
        data
          ? {
              ...data,
              pages: data.pages.map((page) => ({
                ...page,
                unread_count: 0,
                items: page.items.map((item) => ({ ...item, is_read: true }))
              }))
            }
          : data
      );

      return { previous, session } satisfies NotificationMutationContext;
    },
    onSettled: (_data, _error, _variables, context) =>
      context && isCurrentAuthSession(queryClient, context.session)
        ? queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY })
        : undefined
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
    onError: (_error, _variables, context) => {
      if (context?.previous && isCurrentAuthSession(queryClient, context.session)) {
        queryClient.setQueryData(NOTIFICATIONS_QUERY_KEY, context.previous);
      }
    },
    onMutate: async ({ decision, notification }: RespondVariables) => {
      const session = getAuthSession(queryClient);
      await queryClient.cancelQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });

      if (!isCurrentAuthSession(queryClient, session)) {
        throw new Error(SESSION_CHANGED_ERROR);
      }

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

      return { previous, session } satisfies NotificationMutationContext;
    },
    onSettled: (_data, error, _variables, context) => {
      if (!context || !isCurrentAuthSession(queryClient, context.session)) return;
      void queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
      if (!error) {
        void queryClient.invalidateQueries({ queryKey: ["feed"] });
        void queryClient.invalidateQueries({ queryKey: ["users"] });
      }
    }
  });
}

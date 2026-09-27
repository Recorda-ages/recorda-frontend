import { notifyManager, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import React from "react";

import { AUTH_ME_QUERY_KEY } from "@/features/auth/api/getCurrentUser";
import type { UserBasicResponse } from "@/features/auth/api/types";
import {
  NOTIFICATIONS_PAGE_SIZE,
  NOTIFICATIONS_QUERY_KEY,
  useMarkAllNotificationsAsRead,
  useNotifications,
  useRespondFollowRequest
} from "@/features/notifications/hooks/useNotifications";
import { notificationService } from "@/features/notifications/services/notificationService";
import type { NotificationItem, NotificationPage } from "@/features/notifications/types";

notifyManager.setScheduler((callback) => callback());

jest.mock("@/features/notifications/services/notificationService", () => ({
  notificationService: {
    list: jest.fn(),
    markAllAsRead: jest.fn(),
    respondToFollowRequest: jest.fn()
  }
}));

const mockList = notificationService.list as jest.Mock;
const mockMarkAllAsRead = notificationService.markAllAsRead as jest.Mock;
const mockRespondToFollowRequest = notificationService.respondToFollowRequest as jest.Mock;
let queryClient: QueryClient;

function user(userId: string): UserBasicResponse {
  return {
    name: userId,
    onboarding_completed: true,
    role: "USER",
    user_id: userId,
    username: userId
  };
}

function notification(index: number, type: NotificationItem["type"] = "LIKE"): NotificationItem {
  return {
    comment_id: null,
    created_at: "2026-09-26T12:00:00.000Z",
    follow_id: type === "FOLLOW_REQUEST" ? `follow-${index}` : null,
    is_read: false,
    notification_id: `notification-${index}`,
    recorda_id: null,
    sender: null,
    type
  };
}

function createWrapper() {
  queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { gcTime: Infinity, retry: false } }
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

function notificationsCache(items: NotificationItem[], unreadCount = items.length) {
  return {
    pageParams: [0],
    pages: [{ _wasFull: false, items, unread_count: unreadCount }]
  };
}

beforeEach(() => {
  mockList.mockReset();
  mockMarkAllAsRead.mockReset();
  mockRespondToFollowRequest.mockReset();
});

afterEach(() => {
  queryClient.clear();
  jest.restoreAllMocks();
});

describe("useNotifications", () => {
  it("preserves the server offset after declining a notification optimistically", async () => {
    const request = notification(0, "FOLLOW_REQUEST");
    const firstPage: NotificationPage = {
      items: [
        request,
        ...Array.from({ length: NOTIFICATIONS_PAGE_SIZE - 1 }, (_, index) =>
          notification(index + 1)
        )
      ],
      unread_count: NOTIFICATIONS_PAGE_SIZE
    };
    const secondPage: NotificationPage = {
      items: [notification(NOTIFICATIONS_PAGE_SIZE)],
      unread_count: NOTIFICATIONS_PAGE_SIZE
    };

    mockList.mockImplementation((_limit: number, offset: number) =>
      Promise.resolve(offset === 0 ? firstPage : secondPage)
    );
    mockRespondToFollowRequest.mockResolvedValue(undefined);

    const wrapper = createWrapper();
    jest.spyOn(queryClient, "invalidateQueries").mockResolvedValue();
    const { result } = renderHook(
      () => ({ notifications: useNotifications(), respond: useRespondFollowRequest() }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.notifications.hasNextPage).toBe(true);
      expect(result.current.notifications.isFetching).toBe(false);
    });

    await act(async () => {
      await result.current.respond.mutateAsync({ decision: "decline", notification: request });
    });

    await waitFor(() => {
      expect(result.current.notifications.data?.pages[0].items).toHaveLength(
        NOTIFICATIONS_PAGE_SIZE - 1
      );
      expect(result.current.notifications.hasNextPage).toBe(true);
    });

    await act(async () => {
      await result.current.notifications.fetchNextPage();
    });

    await waitFor(() => {
      expect(mockList).toHaveBeenNthCalledWith(
        2,
        NOTIFICATIONS_PAGE_SIZE,
        NOTIFICATIONS_PAGE_SIZE - 1,
        expect.anything()
      );
      expect(result.current.notifications.data?.pages).toHaveLength(2);
    });
  });

  it("invalidates notifications only after mark-all settles", async () => {
    let finishMarkAll!: () => void;
    mockMarkAllAsRead.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          finishMarkAll = resolve;
        })
    );
    const wrapper = createWrapper();
    const invalidate = jest.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useMarkAllNotificationsAsRead(), { wrapper });
    let mutation!: Promise<void>;

    act(() => {
      mutation = result.current.mutateAsync();
    });

    await waitFor(() => expect(mockMarkAllAsRead).toHaveBeenCalledTimes(1));
    expect(invalidate).not.toHaveBeenCalled();

    await act(async () => {
      finishMarkAll();
      await mutation;
    });

    expect(invalidate).toHaveBeenCalledTimes(1);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: NOTIFICATIONS_QUERY_KEY });
  });

  it("invalidates notifications only after a follow response settles", async () => {
    let finishResponse!: () => void;
    const request = notification(42, "FOLLOW_REQUEST");
    mockRespondToFollowRequest.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          finishResponse = resolve;
        })
    );
    const wrapper = createWrapper();
    const invalidate = jest.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useRespondFollowRequest(), { wrapper });
    let mutation!: Promise<void>;

    act(() => {
      mutation = result.current.mutateAsync({ decision: "accept", notification: request });
    });

    await waitFor(() =>
      expect(mockRespondToFollowRequest).toHaveBeenCalledWith(request.follow_id, "accept")
    );
    expect(invalidate).not.toHaveBeenCalled();

    await act(async () => {
      finishResponse();
      await mutation;
    });

    expect(invalidate).toHaveBeenCalledTimes(1);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: NOTIFICATIONS_QUERY_KEY });
  });

  it("does not restore or invalidate mark-all data after the authenticated session changes", async () => {
    let rejectMarkAll!: (error: Error) => void;
    mockMarkAllAsRead.mockImplementation(
      () =>
        new Promise<void>((_resolve, reject) => {
          rejectMarkAll = reject;
        })
    );
    const wrapper = createWrapper();
    const sessionA = notificationsCache([notification(1)]);
    const sessionB = notificationsCache([notification(2)]);
    queryClient.setQueryData(AUTH_ME_QUERY_KEY, user("user-a"));
    queryClient.setQueryData(NOTIFICATIONS_QUERY_KEY, sessionA);
    const invalidate = jest.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useMarkAllNotificationsAsRead(), { wrapper });
    let mutation!: Promise<void>;

    act(() => {
      mutation = result.current.mutateAsync();
    });
    const rejected = expect(mutation).rejects.toThrow("late mark-all failure");
    await waitFor(() => expect(mockMarkAllAsRead).toHaveBeenCalledTimes(1));

    act(() => {
      queryClient.removeQueries({ queryKey: AUTH_ME_QUERY_KEY });
      queryClient.removeQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
      queryClient.setQueryData(AUTH_ME_QUERY_KEY, user("user-b"));
      queryClient.setQueryData(NOTIFICATIONS_QUERY_KEY, sessionB);
    });
    await act(async () => {
      rejectMarkAll(new Error("late mark-all failure"));
      await rejected;
    });

    expect(queryClient.getQueryData(NOTIFICATIONS_QUERY_KEY)).toEqual(sessionB);
    expect(invalidate).not.toHaveBeenCalled();
  });

  it("does not optimistically update a new session while query cancellation is pending", async () => {
    let finishCancellation!: () => void;
    mockMarkAllAsRead.mockResolvedValue(undefined);
    const wrapper = createWrapper();
    const sessionA = notificationsCache([notification(5)]);
    const sessionB = notificationsCache([notification(6)]);
    queryClient.setQueryData(AUTH_ME_QUERY_KEY, user("user-a"));
    queryClient.setQueryData(NOTIFICATIONS_QUERY_KEY, sessionA);
    jest.spyOn(queryClient, "cancelQueries").mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          finishCancellation = resolve;
        })
    );
    const invalidate = jest.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useMarkAllNotificationsAsRead(), { wrapper });
    let mutation!: Promise<void>;

    act(() => {
      mutation = result.current.mutateAsync();
    });
    const rejected = expect(mutation).rejects.toThrow(
      "Notification action cancelled because the session changed"
    );
    await waitFor(() => expect(queryClient.cancelQueries).toHaveBeenCalledTimes(1));

    act(() => {
      queryClient.removeQueries({ queryKey: AUTH_ME_QUERY_KEY });
      queryClient.removeQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
      queryClient.setQueryData(AUTH_ME_QUERY_KEY, user("user-b"));
      queryClient.setQueryData(NOTIFICATIONS_QUERY_KEY, sessionB);
    });
    await act(async () => {
      finishCancellation();
      await rejected;
    });

    expect(mockMarkAllAsRead).not.toHaveBeenCalled();
    expect(queryClient.getQueryData(NOTIFICATIONS_QUERY_KEY)).toEqual(sessionB);
    expect(invalidate).not.toHaveBeenCalled();
  });

  it("does not restore or invalidate a follow response after the session changes", async () => {
    let rejectResponse!: (error: Error) => void;
    const request = notification(3, "FOLLOW_REQUEST");
    mockRespondToFollowRequest.mockImplementation(
      () =>
        new Promise<void>((_resolve, reject) => {
          rejectResponse = reject;
        })
    );
    const wrapper = createWrapper();
    const sessionA = notificationsCache([request]);
    const sessionB = notificationsCache([notification(4)]);
    queryClient.setQueryData(AUTH_ME_QUERY_KEY, user("user-a"));
    queryClient.setQueryData(NOTIFICATIONS_QUERY_KEY, sessionA);
    const invalidate = jest.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useRespondFollowRequest(), { wrapper });
    let mutation!: Promise<void>;

    act(() => {
      mutation = result.current.mutateAsync({ decision: "decline", notification: request });
    });
    const rejected = expect(mutation).rejects.toThrow("late response failure");
    await waitFor(() =>
      expect(mockRespondToFollowRequest).toHaveBeenCalledWith(request.follow_id, "decline")
    );

    act(() => {
      queryClient.removeQueries({ queryKey: AUTH_ME_QUERY_KEY });
      queryClient.removeQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
      queryClient.setQueryData(AUTH_ME_QUERY_KEY, user("user-b"));
      queryClient.setQueryData(NOTIFICATIONS_QUERY_KEY, sessionB);
    });
    await act(async () => {
      rejectResponse(new Error("late response failure"));
      await rejected;
    });

    expect(queryClient.getQueryData(NOTIFICATIONS_QUERY_KEY)).toEqual(sessionB);
    expect(invalidate).not.toHaveBeenCalled();
  });
});

import {
  type InfiniteData,
  notifyManager,
  QueryClient,
  QueryClientProvider
} from "@tanstack/react-query";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { I18nextProvider } from "react-i18next";

import { NotificationsScreen } from "@/features/notifications";
import { NOTIFICATIONS_QUERY_KEY } from "@/features/notifications/hooks/useNotifications";
import { notificationService } from "@/features/notifications/services/notificationService";
import type { NotificationPage } from "@/features/notifications/types";
import { i18n } from "@/i18n";

notifyManager.setScheduler((callback) => callback());

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ goBack: mockGoBack, navigate: mockNavigate })
}));

const SENDER = { profile_picture_url: null, user_id: "user-9", username: "lucas_almeida" };

function notification(overrides: Partial<NotificationPage["items"][number]>) {
  return {
    comment_id: null,
    created_at: new Date().toISOString(),
    follow_id: null,
    is_read: false,
    notification_id: "n-1",
    recorda_id: null,
    sender: SENDER,
    type: "LIKE" as const,
    ...overrides
  };
}

const PAGE: NotificationPage = {
  items: [
    notification({ follow_id: "follow-1", notification_id: "n-request", type: "FOLLOW_REQUEST" }),
    notification({ notification_id: "n-like", recorda_id: "recorda-1", type: "LIKE" }),
    notification({ is_read: true, notification_id: "n-follower", type: "NEW_FOLLOWER" })
  ],
  unread_count: 2
};

let queryClient: QueryClient;
let serverPage: NotificationPage;

function renderScreen(cachedPage?: NotificationPage) {
  queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { gcTime: Infinity, retry: false } }
  });
  if (cachedPage) {
    queryClient.setQueryData(NOTIFICATIONS_QUERY_KEY, {
      pageParams: [0],
      pages: [{ ...cachedPage, _wasFull: cachedPage.items.length === 20 }]
    });
  }

  return render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <NotificationsScreen />
      </QueryClientProvider>
    </I18nextProvider>
  );
}

describe("NotificationsScreen", () => {
  let list: jest.SpyInstance;
  let markAllAsRead: jest.SpyInstance;
  let respond: jest.SpyInstance;

  beforeEach(() => {
    mockNavigate.mockClear();
    mockGoBack.mockClear();
    serverPage = structuredClone(PAGE);
    list = jest
      .spyOn(notificationService, "list")
      .mockImplementation(() => Promise.resolve(structuredClone(serverPage)));
    markAllAsRead = jest.spyOn(notificationService, "markAllAsRead").mockImplementation(() => {
      serverPage = {
        ...serverPage,
        items: serverPage.items.map((item) => ({ ...item, is_read: true })),
        unread_count: 0
      };
      return Promise.resolve();
    });
    respond = jest
      .spyOn(notificationService, "respondToFollowRequest")
      .mockImplementation((followId: string, decision: "accept" | "decline") => {
        serverPage = {
          ...serverPage,
          items:
            decision === "decline"
              ? serverPage.items.filter((item) => item.follow_id !== followId)
              : serverPage.items.map((item) =>
                  item.follow_id === followId ? { ...item, type: "NEW_FOLLOWER" } : item
                )
        };
        return Promise.resolve();
      });
  });

  afterEach(() => {
    cleanup();
    queryClient.clear();
    jest.restoreAllMocks();
  });

  it("lists the notifications in the order the API returns", async () => {
    renderScreen();

    await waitFor(() => expect(screen.getByTestId("notification-n-request")).toBeTruthy());

    expect(
      screen.getAllByTestId(/^notification-n-/).map((node) => node.props.testID as string)
    ).toEqual(["notification-n-request", "notification-n-like", "notification-n-follower"]);
    expect(screen.getByText("curtiu sua publicação", { exact: false })).toBeTruthy();
  });

  it("refetches the notification list when opening with fresh cached data", async () => {
    renderScreen({ items: [], unread_count: 0 });

    await waitFor(() => expect(list).toHaveBeenCalledWith(20, 0, expect.any(AbortSignal)));
    expect(await screen.findByTestId("notification-n-like")).toBeTruthy();
  });

  it("does not load the next page while the cached first page is refetching", async () => {
    let finishRefetch!: () => void;
    const cachedPage: NotificationPage = {
      items: Array.from({ length: 20 }, (_, index) =>
        notification({ notification_id: `cached-${index}` })
      ),
      unread_count: 0
    };
    list.mockImplementation(
      () =>
        new Promise<NotificationPage>((resolve) => {
          finishRefetch = () => resolve(cachedPage);
        })
    );

    renderScreen(cachedPage);

    await waitFor(() => expect(list).toHaveBeenCalledTimes(1));
    fireEvent(screen.getByTestId("notifications-list"), "endReached");

    expect(list).toHaveBeenCalledTimes(1);
    expect(list).toHaveBeenLastCalledWith(20, 0, expect.any(AbortSignal));

    await act(async () => finishRefetch());
  });

  it("waits for the opening refetch before marking cached notifications as read", async () => {
    let finishRefetch!: (page: NotificationPage) => void;
    const cachedNotification = notification({ notification_id: "cached-notification" });
    const freshNotification = notification({ notification_id: "fresh-notification" });
    const freshPage = { items: [freshNotification, cachedNotification], unread_count: 2 };
    list.mockImplementationOnce(
      () =>
        new Promise<NotificationPage>((resolve) => {
          finishRefetch = resolve;
        })
    );
    list.mockResolvedValue({ ...freshPage, unread_count: 0 });

    renderScreen({ items: [cachedNotification], unread_count: 1 });

    expect(screen.getByTestId("notification-cached-notification")).toBeTruthy();
    await waitFor(() => expect(list).toHaveBeenCalledWith(20, 0, expect.any(AbortSignal)));
    expect(markAllAsRead).not.toHaveBeenCalled();

    await act(async () => {
      finishRefetch(freshPage);
    });

    expect(await screen.findByTestId("notification-fresh-notification")).toBeTruthy();
    await waitFor(() => expect(markAllAsRead).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(list).toHaveBeenCalledTimes(2));
  });

  it("marks everything as read on open and zeroes the counter", async () => {
    renderScreen();

    await waitFor(() => expect(markAllAsRead).toHaveBeenCalledTimes(1));

    expect(
      queryClient.getQueryData<InfiniteData<NotificationPage, number>>(["notifications"])?.pages[0]
        .unread_count
    ).toBe(0);
  });

  it("does not call read-all when nothing is unread", async () => {
    list.mockResolvedValue({ items: [], unread_count: 0 });
    renderScreen();

    await waitFor(() => expect(screen.getByTestId("notifications-empty")).toBeTruthy());

    expect(markAllAsRead).not.toHaveBeenCalled();
  });

  it("accepts a follow request inline", async () => {
    renderScreen();

    await waitFor(() => expect(screen.getByTestId("notification-accept-n-request")).toBeTruthy());

    await act(async () => {
      fireEvent.press(screen.getByTestId("notification-accept-n-request"));
    });

    expect(respond).toHaveBeenCalledWith("follow-1", "accept");
    await waitFor(() => expect(screen.queryByTestId("notification-accept-n-request")).toBeNull());
    expect(screen.getAllByText("começou a seguir você", { exact: false })).toHaveLength(2);
  });

  it("declines a follow request inline and removes it", async () => {
    renderScreen();

    await waitFor(() => expect(screen.getByTestId("notification-decline-n-request")).toBeTruthy());

    await act(async () => {
      fireEvent.press(screen.getByTestId("notification-decline-n-request"));
    });

    expect(respond).toHaveBeenCalledWith("follow-1", "decline");
    await waitFor(() => expect(screen.queryByTestId("notification-n-request")).toBeNull());
  });

  it("does not load another page before a decline reaches the backend", async () => {
    let finishDecline!: () => void;
    const firstPage: NotificationPage = {
      items: [
        notification({
          follow_id: "follow-pending",
          notification_id: "pending-request",
          type: "FOLLOW_REQUEST"
        }),
        ...Array.from({ length: 19 }, (_, index) =>
          notification({ notification_id: `pending-page-${index}` })
        )
      ],
      unread_count: 20
    };
    list.mockResolvedValue(firstPage);
    respond.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          finishDecline = resolve;
        })
    );
    renderScreen();

    const declineButton = await screen.findByTestId("notification-decline-pending-request");
    await waitFor(() => expect(declineButton).not.toBeDisabled());
    fireEvent.press(screen.getByTestId("notification-decline-pending-request"));
    await waitFor(() => expect(respond).toHaveBeenCalledWith("follow-pending", "decline"));
    await waitFor(() => expect(screen.queryByTestId("notification-pending-request")).toBeNull());

    const callsBeforeEndReached = list.mock.calls.length;
    fireEvent(screen.getByTestId("notifications-list"), "endReached");
    expect(list).toHaveBeenCalledTimes(callsBeforeEndReached);

    await act(async () => finishDecline());
  });

  it("restores the request if the API rejects the answer", async () => {
    respond.mockRejectedValue(new Error("boom"));
    renderScreen();

    await waitFor(() => expect(screen.getByTestId("notification-decline-n-request")).toBeTruthy());

    await act(async () => {
      fireEvent.press(screen.getByTestId("notification-decline-n-request"));
    });

    await waitFor(() => expect(screen.getByTestId("notification-n-request")).toBeTruthy());
    expect(
      screen.getByText("Não foi possível responder à solicitação. Tente novamente.")
    ).toBeTruthy();
  });

  it("opens the Recorda from a like and the sender profile from a new follower", async () => {
    renderScreen();

    await waitFor(() => expect(screen.getByTestId("notification-n-like")).toBeTruthy());

    fireEvent.press(screen.getByTestId("notification-n-like"));
    fireEvent.press(screen.getByTestId("notification-n-follower"));

    expect(mockNavigate).toHaveBeenNthCalledWith(1, "PublishedRecorda", {
      postId: "recorda-1"
    });
    expect(mockNavigate).toHaveBeenNthCalledWith(2, "UserProfile", { userId: "user-9" });
  });

  it("loads the next notification page at the end of the list", async () => {
    const firstPage: NotificationPage = {
      items: Array.from({ length: 20 }, (_, index) =>
        notification({ notification_id: `first-${index}` })
      ),
      unread_count: 20
    };
    const secondPage: NotificationPage = {
      items: [notification({ notification_id: "second-page" })],
      unread_count: 20
    };
    list.mockImplementation((_limit: number, offset: number) =>
      Promise.resolve(offset === 0 ? firstPage : secondPage)
    );
    renderScreen();

    await waitFor(() => expect(screen.getByTestId("notification-first-0")).toBeTruthy());
    fireEvent(screen.getByTestId("notifications-list"), "endReached");

    await waitFor(() => expect(list).toHaveBeenCalledWith(20, 20, expect.any(AbortSignal)));
    expect(
      queryClient
        .getQueryData<InfiniteData<NotificationPage, number>>(["notifications"])
        ?.pages.flatMap((page) => page.items)
        .some((item) => item.notification_id === "second-page")
    ).toBe(true);
  });

  it("offers a retry when marking notifications as read fails", async () => {
    markAllAsRead.mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce(undefined);
    renderScreen();

    await waitFor(() => expect(markAllAsRead).toHaveBeenCalledTimes(1));
    fireEvent.press(screen.getByRole("button", { name: "Tentar novamente" }));

    await waitFor(() => expect(markAllAsRead).toHaveBeenCalledTimes(2));
  });

  it("blocks the read-all retry while a follow response is pending", async () => {
    let finishResponse!: () => void;
    markAllAsRead.mockRejectedValueOnce(new Error("offline"));
    respond.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          finishResponse = resolve;
        })
    );
    renderScreen();

    const retry = await screen.findByRole("button", { name: "Tentar novamente" });
    const accept = await screen.findByTestId("notification-accept-n-request");
    await waitFor(() => expect(accept).not.toBeDisabled());
    fireEvent.press(accept);

    await waitFor(() => expect(respond).toHaveBeenCalledWith("follow-1", "accept"));
    expect(retry).toBeDisabled();

    await act(async () => finishResponse());
  });

  it("shows an error with retry when the list fails", async () => {
    list.mockRejectedValue(new Error("offline"));
    renderScreen();

    await waitFor(() =>
      expect(screen.getByText("Não foi possível carregar suas notificações.")).toBeTruthy()
    );

    list.mockResolvedValue(structuredClone(PAGE));
    fireEvent.press(screen.getByRole("button", { name: "Tentar novamente" }));

    await waitFor(() => expect(screen.getByTestId("notification-n-like")).toBeTruthy());
  });

  it("goes back from the header", async () => {
    renderScreen();

    await waitFor(() => expect(screen.getByTestId("notification-n-like")).toBeTruthy());

    fireEvent.press(screen.getByTestId("notifications-back"));

    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });
});

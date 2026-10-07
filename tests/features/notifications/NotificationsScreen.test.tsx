import {
  type InfiniteData,
  notifyManager,
  QueryClient,
  QueryClientProvider
} from "@tanstack/react-query";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within
} from "@testing-library/react-native";
import { Image } from "expo-image";
import { I18nextProvider } from "react-i18next";
import { Icon } from "react-native-paper";

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

const REMOVED_NOTIFICATION = notification({
  notification_id: "n-removed",
  recorda_id: "removed-recorda",
  recorda_song_title: "Pais e Filhos",
  removal_reason: "Violação das diretrizes da comunidade",
  sender: null,
  type: "CONTENT_REMOVED"
});

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

  afterEach(async () => {
    cleanup();
    queryClient.clear();
    jest.restoreAllMocks();
    await i18n.changeLanguage("pt-BR");
  });

  it.each([
    [
      "pt-BR",
      'Sua Recorda "Pais e Filhos" foi removida pela moderação. Motivo: Violação das diretrizes da comunidade'
    ],
    [
      "en",
      'Your Recorda "Pais e Filhos" was removed by moderation. Reason: Violação das diretrizes da comunidade'
    ],
    [
      "es",
      'Tu Recorda "Pais e Filhos" fue eliminada por la moderación. Motivo: Violação das diretrizes da comunidade'
    ]
  ])("renders the full removal message with a system icon in %s", async (language, message) => {
    await i18n.changeLanguage(language);
    serverPage = { items: [REMOVED_NOTIFICATION], unread_count: 1 };
    renderScreen();

    const row = within(await screen.findByTestId("notification-n-removed"));
    expect(row.getByText(message).props.numberOfLines).toBeUndefined();
    expect(row.UNSAFE_getByType(Icon).props.source).toBe("shield-alert-outline");
    expect(row.UNSAFE_queryByType(Image)).toBeNull();
    expect(row.queryByTestId("notification-accept-n-removed")).toBeNull();
    expect(row.queryByTestId("notification-decline-n-removed")).toBeNull();
  });

  it("never displays the sender avatar or username for a removal notification", async () => {
    serverPage = {
      items: [
        {
          ...REMOVED_NOTIFICATION,
          sender: { ...SENDER, profile_picture_url: "https://example.com/avatar.jpg" }
        }
      ],
      unread_count: 1
    };
    renderScreen();

    const row = within(await screen.findByTestId("notification-n-removed"));
    expect(row.UNSAFE_queryByType(Image)).toBeNull();
    expect(row.queryByText(SENDER.username, { exact: false })).toBeNull();
    expect(row.getByTestId("notification-system-icon-n-removed")).toBeTruthy();
  });

  it.each([
    [5 * 60_000, "5 min"],
    [2 * 60 * 60_000, "2 h"],
    [3 * 24 * 60 * 60_000, "3 d"]
  ])("shows the elapsed time for an older removal notification (%s ms)", async (age, label) => {
    const now = Date.parse("2026-10-05T18:00:00Z");
    jest.spyOn(Date, "now").mockReturnValue(now);
    serverPage = {
      items: [{ ...REMOVED_NOTIFICATION, created_at: new Date(now - age).toISOString() }],
      unread_count: 1
    };
    renderScreen();

    const row = within(await screen.findByTestId("notification-n-removed"));
    expect(row.getByText(label)).toBeTruthy();
    expect(
      row.getByText(
        'Sua Recorda "Pais e Filhos" foi removida pela moderação. Motivo: Violação das diretrizes da comunidade'
      )
    ).toBeTruthy();
  });

  it.each([
    [null, null],
    [undefined, undefined],
    ["", ""],
    ["   ", "\t"]
  ])("uses localized fallbacks for missing song %s and reason %s", async (song, reason) => {
    serverPage = {
      items: [{ ...REMOVED_NOTIFICATION, recorda_song_title: song, removal_reason: reason }],
      unread_count: 1
    };
    renderScreen();

    expect(
      await screen.findByText(
        'Sua Recorda "Música não informada" foi removida pela moderação. Motivo: Não informado'
      )
    ).toBeTruthy();
  });

  it("marks removal notifications as read and never navigates to the removed Recorda", async () => {
    serverPage = { items: [REMOVED_NOTIFICATION], unread_count: 1 };
    renderScreen();

    await waitFor(() => expect(markAllAsRead).toHaveBeenCalledTimes(1));
    await waitFor(() => {
      const page =
        queryClient.getQueryData<InfiniteData<NotificationPage, number>>(NOTIFICATIONS_QUERY_KEY)
          ?.pages[0];
      expect(page?.unread_count).toBe(0);
      expect(page?.items[0].is_read).toBe(true);
    });

    expect(screen.getByTestId("notification-n-removed").props.accessibilityRole).toBeUndefined();
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(markAllAsRead).toHaveBeenCalledTimes(1);
    expect(respond).not.toHaveBeenCalled();
  });

  it("does not expose an already-read removal notification as an actionable button", async () => {
    serverPage = {
      items: [{ ...REMOVED_NOTIFICATION, is_read: true }],
      unread_count: 0
    };
    renderScreen();

    const row = await screen.findByTestId("notification-n-removed");
    expect(row.props.accessibilityRole).toBeUndefined();
    expect(markAllAsRead).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("retries marking an unread removal notification when tapped after a read failure", async () => {
    serverPage = { items: [REMOVED_NOTIFICATION], unread_count: 1 };
    markAllAsRead.mockRejectedValueOnce(new Error("offline"));
    renderScreen();

    await screen.findByRole("button", { name: "Tentar novamente" });
    fireEvent.press(screen.getByTestId("notification-n-removed"));

    await waitFor(() => expect(markAllAsRead).toHaveBeenCalledTimes(2));
    await waitFor(() => {
      const page =
        queryClient.getQueryData<InfiniteData<NotificationPage, number>>(NOTIFICATIONS_QUERY_KEY)
          ?.pages[0];
      expect(page?.unread_count).toBe(0);
      expect(page?.items[0].is_read).toBe(true);
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("does not repeat a pending read mutation when a removal notification is tapped", async () => {
    let finishRead!: () => void;
    serverPage = { items: [REMOVED_NOTIFICATION], unread_count: 1 };
    markAllAsRead.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          finishRead = resolve;
        })
    );
    renderScreen();

    await waitFor(() => expect(markAllAsRead).toHaveBeenCalledTimes(1));
    expect(screen.getByTestId("notification-n-removed").props.accessibilityRole).toBeUndefined();
    expect(markAllAsRead).toHaveBeenCalledTimes(1);
    expect(mockNavigate).not.toHaveBeenCalled();

    await act(async () => finishRead());
  });

  it("does not mark removals as read while a follow response is pending", async () => {
    let finishResponse!: () => void;
    serverPage = { items: [REMOVED_NOTIFICATION, PAGE.items[0]], unread_count: 2 };
    markAllAsRead.mockRejectedValueOnce(new Error("offline"));
    respond.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          finishResponse = resolve;
        })
    );
    renderScreen();

    await screen.findByRole("button", { name: "Tentar novamente" });
    const accept = await screen.findByTestId("notification-accept-n-request");
    await waitFor(() => expect(accept).not.toBeDisabled());
    fireEvent.press(accept);
    await waitFor(() => expect(respond).toHaveBeenCalledTimes(1));

    expect(screen.getByTestId("notification-n-removed").props.accessibilityRole).toBeUndefined();
    expect(markAllAsRead).toHaveBeenCalledTimes(1);
    expect(mockNavigate).not.toHaveBeenCalled();
    await act(async () => finishResponse());
  });

  it.each([
    ["COMMENT", "comentou em sua publicação"],
    ["FOLLOW_ACCEPTED", "aceitou seu pedido para seguir"],
    ["FOLLOW_REQUEST", "quer seguir você"],
    ["LIKE", "curtiu sua publicação"],
    ["MENTION", "marcou você em uma publicação"],
    ["NEW_FOLLOWER", "começou a seguir você"]
  ] as const)("preserves the sender and message for %s", async (type, message) => {
    serverPage = {
      items: [
        notification({
          type,
          sender: { ...SENDER, profile_picture_url: "https://example.com/avatar.jpg" }
        })
      ],
      unread_count: 1
    };
    renderScreen();

    const row = within(await screen.findByTestId("notification-n-1"));
    expect(row.getByText(`${SENDER.username} ${message}`)).toBeTruthy();
    expect(row.UNSAFE_getByType(Image).props.source).toBe("https://example.com/avatar.jpg");
    expect(row.queryByTestId("notification-system-icon-n-1")).toBeNull();
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

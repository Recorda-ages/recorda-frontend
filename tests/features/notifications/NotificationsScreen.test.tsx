import { notifyManager, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { I18nextProvider } from "react-i18next";

import { NotificationsScreen } from "@/features/notifications";
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

function renderScreen() {
  queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { gcTime: Infinity, retry: false } }
  });

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
    list = jest.spyOn(notificationService, "list").mockResolvedValue(structuredClone(PAGE));
    markAllAsRead = jest.spyOn(notificationService, "markAllAsRead").mockResolvedValue();
    respond = jest.spyOn(notificationService, "respondToFollowRequest").mockResolvedValue();
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

  it("marks everything as read on open and zeroes the counter", async () => {
    renderScreen();

    await waitFor(() => expect(markAllAsRead).toHaveBeenCalledTimes(1));

    expect(queryClient.getQueryData<NotificationPage>(["notifications"])?.unread_count).toBe(0);
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

    expect(respond).toHaveBeenCalledWith("user-9", "accept");
    await waitFor(() => expect(screen.queryByTestId("notification-accept-n-request")).toBeNull());
    expect(screen.getAllByText("começou a seguir você", { exact: false })).toHaveLength(2);
  });

  it("declines a follow request inline and removes it", async () => {
    renderScreen();

    await waitFor(() => expect(screen.getByTestId("notification-decline-n-request")).toBeTruthy());

    await act(async () => {
      fireEvent.press(screen.getByTestId("notification-decline-n-request"));
    });

    expect(respond).toHaveBeenCalledWith("user-9", "decline");
    await waitFor(() => expect(screen.queryByTestId("notification-n-request")).toBeNull());
  });

  it("restores the request if the API rejects the answer", async () => {
    respond.mockRejectedValue(new Error("boom"));
    renderScreen();

    await waitFor(() => expect(screen.getByTestId("notification-decline-n-request")).toBeTruthy());

    await act(async () => {
      fireEvent.press(screen.getByTestId("notification-decline-n-request"));
    });

    await waitFor(() => expect(screen.getByTestId("notification-n-request")).toBeTruthy());
  });

  it("opens the Recorda from a like and the profile from a new follower", async () => {
    renderScreen();

    await waitFor(() => expect(screen.getByTestId("notification-n-like")).toBeTruthy());

    fireEvent.press(screen.getByTestId("notification-n-like"));
    fireEvent.press(screen.getByTestId("notification-n-follower"));

    expect(mockNavigate).toHaveBeenNthCalledWith(1, "RecordaView", { recordaId: "recorda-1" });
    expect(mockNavigate).toHaveBeenNthCalledWith(2, "Profile");
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

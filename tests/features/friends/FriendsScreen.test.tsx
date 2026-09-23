import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import React from "react";

import { AUTH_ME_QUERY_KEY } from "@/features/auth/api/getCurrentUser";
import { FriendsScreen } from "@/features/friends/screens/FriendsScreen";
import * as friendsApi from "@/features/friends/api/friendsApi";
import { mockFollowers, mockFollowing } from "@/features/friends/mocks/friendsMocks";

jest.mock("@/features/friends/api/friendsApi", () => ({
  listFollowers: jest.fn(),
  listFollowing: jest.fn(),
  removeFollower: jest.fn()
}));

const mockGoBack = jest.fn();
const mockNavigate = jest.fn();

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ goBack: mockGoBack, navigate: mockNavigate })
}));

const mockListFollowers = friendsApi.listFollowers as jest.Mock;
const mockListFollowing = friendsApi.listFollowing as jest.Mock;
const mockRemoveFollower = friendsApi.removeFollower as jest.Mock;

const currentUserData = {
  user_id: "user-1",
  username: "testuser",
  name: "Test User",
  role: "USER",
  onboarding_completed: true
};

function renderScreen(userId = "user-1") {
  const client = new QueryClient({
    defaultOptions: {
      mutations: { gcTime: Infinity, retry: false },
      queries: { gcTime: Infinity, retry: false, queryFn: () => currentUserData }
    }
  });

  if (userId) {
    client.setQueryData(AUTH_ME_QUERY_KEY, {
      ...currentUserData,
      user_id: userId
    });
  }

  return render(
    <QueryClientProvider client={client}>
      <FriendsScreen />
    </QueryClientProvider>
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  mockListFollowers.mockResolvedValue(mockFollowers);
  mockListFollowing.mockResolvedValue(mockFollowing);
  mockRemoveFollower.mockResolvedValue(undefined);
});

describe("FriendsScreen", () => {
  it("renders the screen title 'Amigos'", async () => {
    renderScreen();
    expect(screen.getByText("Amigos")).toBeTruthy();
  });

  it("renders both tab bar tabs", async () => {
    renderScreen();
    expect(screen.getByText("Seguidores")).toBeTruthy();
    expect(screen.getByText("Seguindo")).toBeTruthy();
  });

  it("renders followers by default", async () => {
    renderScreen();

    await waitFor(() => {
      expect(screen.getByText("Jane Doe")).toBeTruthy();
    });
  });

  it("shows the remove button on followers tab", async () => {
    renderScreen();

    await waitFor(() => {
      expect(screen.getAllByText("Remover").length).toBeGreaterThan(0);
    });
  });

  it("switches to following tab and hides the remove button", async () => {
    renderScreen();

    await waitFor(() => expect(screen.getByText("Jane Doe")).toBeTruthy());

    fireEvent.press(screen.getByText("Seguindo"));

    await waitFor(() => {
      expect(screen.queryByText("Remover")).toBeNull();
    });
  });

  it("shows following list on the Seguindo tab", async () => {
    renderScreen();

    fireEvent.press(screen.getByText("Seguindo"));

    await waitFor(() => {
      expect(screen.getByText("Jane Doe")).toBeTruthy();
    });
  });

  it("navigates back when the back button is pressed", async () => {
    renderScreen();
    await waitFor(() => expect(screen.getByText("Amigos")).toBeTruthy());
    const backButtons = screen.UNSAFE_getAllByProps({ hitSlop: 8 });
    fireEvent.press(backButtons[0]);
    expect(mockGoBack).toHaveBeenCalled();
  });

  it("shows loading indicator while fetching", async () => {
    let resolve: (v: typeof mockFollowers) => void;
    mockListFollowers.mockReturnValueOnce(new Promise((r) => (resolve = r)));

    renderScreen();

    expect(screen.queryByText("Jane Doe")).toBeNull();

    resolve!(mockFollowers);
    await waitFor(() => expect(screen.getByText("Jane Doe")).toBeTruthy());
  });

  it("opens the remove confirmation modal when remove button is tapped", async () => {
    renderScreen();

    await waitFor(() => expect(screen.getAllByText("Remover").length).toBeGreaterThan(0));

    fireEvent(screen.getAllByText("Remover")[0], "press", { stopPropagation: jest.fn() });

    await waitFor(() => {
      expect(screen.getByText("Remover seguidor")).toBeTruthy();
    });
  });
});

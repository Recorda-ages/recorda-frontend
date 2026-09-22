import { fireEvent, render, screen, waitFor, within } from "@testing-library/react-native";
import { I18nextProvider } from "react-i18next";

import { FeedScreen } from "@/features/feed";
import { useFollowingFeed } from "@/features/feed/hooks/useFollowingFeed";
import type { FeedPage } from "@/features/feed/types";
import { i18n } from "@/i18n";

const mockNavigate = jest.fn();

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ navigate: mockNavigate })
}));

jest.mock("@/features/feed/hooks/useFollowingFeed", () => ({
  useFollowingFeed: jest.fn()
}));

const mockedUseFollowingFeed = jest.mocked(useFollowingFeed);

const FEED_PAGE: FeedPage = {
  items: [
    {
      author: { profile_picture_url: null, user_id: "user-1", username: "lucas_almeida" },
      created_at: "2026-01-01T12:00:00Z",
      description: "Show I-N-C-R-I-V-E-L!",
      is_liked: false,
      likes_count: 12,
      media_type: "PHOTO",
      media_url: "https://cdn.example.com/media-1.jpg",
      recorda_id: "recorda-1",
      song_artist_name: "The American Dawn",
      song_cover_url: "https://cdn.example.com/cover-1.jpg",
      song_preview_url: null,
      song_title: "The Edge"
    }
  ],
  next_cursor: null
};

function pendingResult() {
  return { data: undefined, isError: false, isPending: true, isSuccess: false };
}

function successResult(data: FeedPage) {
  return { data, isError: false, isPending: false, isSuccess: true };
}

function errorResult() {
  return { data: undefined, isError: true, isPending: false, isSuccess: false };
}

function renderScreen() {
  return render(
    <I18nextProvider i18n={i18n}>
      <FeedScreen />
    </I18nextProvider>
  );
}

describe("FeedScreen", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockedUseFollowingFeed.mockReset();
    mockedUseFollowingFeed.mockReturnValue(pendingResult() as ReturnType<typeof useFollowingFeed>);
  });

  it("selects Para Você by default and does not fetch the following feed", () => {
    renderScreen();

    expect(screen.getByTestId("feed-screen")).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Para Você" })).toBeSelected();
    expect(mockedUseFollowingFeed).toHaveBeenCalledWith(false);
    expect(screen.queryByTestId(/feed-post-/)).toBeNull();
  });

  it("shows a loading state while the following feed is pending", () => {
    renderScreen();

    fireEvent.press(screen.getByRole("tab", { name: "Seguindo" }));

    expect(screen.getByRole("tab", { name: "Seguindo" })).toBeSelected();
    expect(mockedUseFollowingFeed).toHaveBeenLastCalledWith(true);
    expect(screen.getByText("Carregando feed...")).toBeTruthy();
  });

  it("renders the fetched Recorda cards for the Seguindo tab", () => {
    mockedUseFollowingFeed.mockReturnValue(
      successResult(FEED_PAGE) as ReturnType<typeof useFollowingFeed>
    );
    renderScreen();

    fireEvent.press(screen.getByRole("tab", { name: "Seguindo" }));

    const post = within(screen.getByTestId("feed-post-recorda-1"));
    expect(post.getAllByText("lucas_almeida")).toHaveLength(2);
    expect(post.getByText("The Edge")).toBeTruthy();
  });

  it("shows the empty state when the following feed has no items", () => {
    mockedUseFollowingFeed.mockReturnValue(
      successResult({ items: [], next_cursor: null }) as ReturnType<typeof useFollowingFeed>
    );
    renderScreen();

    fireEvent.press(screen.getByRole("tab", { name: "Seguindo" }));

    expect(screen.getByTestId("feed-empty-state")).toBeTruthy();
  });

  it("shows an error state when the following feed request fails", () => {
    mockedUseFollowingFeed.mockReturnValue(errorResult() as ReturnType<typeof useFollowingFeed>);
    renderScreen();

    fireEvent.press(screen.getByRole("tab", { name: "Seguindo" }));

    expect(screen.getByText("Não foi possível carregar o feed. Tente novamente.")).toBeTruthy();
  });

  it("navigates to the Recorda viewer when a card is tapped", async () => {
    mockedUseFollowingFeed.mockReturnValue(
      successResult(FEED_PAGE) as ReturnType<typeof useFollowingFeed>
    );
    renderScreen();

    fireEvent.press(screen.getByRole("tab", { name: "Seguindo" }));
    fireEvent.press(screen.getByTestId("feed-post-recorda-1"));

    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith("RecordaView", { recordaId: "recorda-1" })
    );
  });

  it("opens the camera and the profile from the tab bar", () => {
    renderScreen();

    fireEvent.press(screen.getByTestId("tab-bar-camera"));
    fireEvent.press(screen.getByTestId("tab-bar-profile"));
    fireEvent.press(screen.getByTestId("tab-bar-feed"));

    expect(mockNavigate).toHaveBeenNthCalledWith(1, "Camera");
    expect(mockNavigate).toHaveBeenNthCalledWith(2, "Profile");
    expect(mockNavigate).toHaveBeenCalledTimes(2);
  });
});

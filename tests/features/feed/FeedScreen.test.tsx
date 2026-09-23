import { fireEvent, render, screen, waitFor, within } from "@testing-library/react-native";
import { I18nextProvider } from "react-i18next";

import { FeedScreen } from "@/features/feed";
import { useFollowingFeed } from "@/features/feed/hooks/useFollowingFeed";
import { useGeneralFeed } from "@/features/feed/hooks/useGeneralFeed";
import type { FeedItem, FeedPage } from "@/features/feed/types";
import { i18n } from "@/i18n";

const mockNavigate = jest.fn();

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ navigate: mockNavigate })
}));

jest.mock("@/features/feed/hooks/useFollowingFeed", () => ({
  useFollowingFeed: jest.fn()
}));

jest.mock("@/features/feed/hooks/useGeneralFeed", () => ({
  useGeneralFeed: jest.fn()
}));

const mockedUseFollowingFeed = jest.mocked(useFollowingFeed);
const mockedUseGeneralFeed = jest.mocked(useGeneralFeed);
const mockFetchNextPage = jest.fn();
const mockRefetch = jest.fn();
const mockGeneralFetchNextPage = jest.fn();
const mockGeneralRefetch = jest.fn();

const followingHandlers = { fetchNextPage: mockFetchNextPage, refetch: mockRefetch };
const generalHandlers = { fetchNextPage: mockGeneralFetchNextPage, refetch: mockGeneralRefetch };

type QueryHandlers = typeof followingHandlers;

function buildItem(overrides: Partial<FeedItem> & Pick<FeedItem, "recorda_id">): FeedItem {
  return {
    author: { profile_picture_url: null, user_id: "user-1", username: "lucas_almeida" },
    created_at: "2026-01-01T12:00:00Z",
    description: "Show I-N-C-R-I-V-E-L!",
    is_liked: false,
    likes_count: 12,
    media_type: "PHOTO",
    media_url: "https://cdn.example.com/media-1.jpg",
    song_artist_name: "The American Dawn",
    song_cover_url: "https://cdn.example.com/cover-1.jpg",
    song_preview_url: null,
    song_title: "The Edge",
    ...overrides
  };
}

const FEED_PAGE: FeedPage = {
  items: [buildItem({ recorda_id: "recorda-1" })],
  next_cursor: null
};

// One item from an author the viewer might follow and one from a discovery author. The
// payload deliberately carries no source field: the server already mixed them.
const GENERAL_PAGE: FeedPage = {
  items: [
    buildItem({
      author: { profile_picture_url: null, user_id: "user-a", username: "maria.silva" },
      description: "Sunset session",
      recorda_id: "general-1",
      song_title: "Ocean"
    }),
    buildItem({
      author: { profile_picture_url: null, user_id: "user-b", username: "pedro.lima" },
      description: "Road trip",
      recorda_id: "general-2",
      song_title: "Highway"
    })
  ],
  next_cursor: null
};

function pendingResult(handlers: QueryHandlers = followingHandlers) {
  return {
    data: undefined,
    fetchNextPage: handlers.fetchNextPage,
    hasNextPage: false,
    isError: false,
    isFetchingNextPage: false,
    isFetchNextPageError: false,
    isPending: true,
    isSuccess: false,
    refetch: handlers.refetch
  };
}

function successResult(
  data: FeedPage,
  hasNextPage = false,
  handlers: QueryHandlers = followingHandlers
) {
  return {
    data: { pageParams: [null], pages: [data] },
    fetchNextPage: handlers.fetchNextPage,
    hasNextPage,
    isError: false,
    isFetchingNextPage: false,
    isFetchNextPageError: false,
    isPending: false,
    isSuccess: true,
    refetch: handlers.refetch
  };
}

function errorResult(handlers: QueryHandlers = followingHandlers) {
  return {
    data: undefined,
    fetchNextPage: handlers.fetchNextPage,
    hasNextPage: false,
    isError: true,
    isFetchingNextPage: false,
    isFetchNextPageError: false,
    isPending: false,
    isSuccess: false,
    refetch: handlers.refetch
  };
}

type MockQueryResult =
  | ReturnType<typeof pendingResult>
  | ReturnType<typeof successResult>
  | ReturnType<typeof errorResult>;

function mockFollowing(result: MockQueryResult) {
  mockedUseFollowingFeed.mockReturnValue(result as unknown as ReturnType<typeof useFollowingFeed>);
}

function mockGeneral(result: MockQueryResult) {
  mockedUseGeneralFeed.mockReturnValue(result as unknown as ReturnType<typeof useGeneralFeed>);
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
    mockFetchNextPage.mockReset();
    mockRefetch.mockReset();
    mockGeneralFetchNextPage.mockReset();
    mockGeneralRefetch.mockReset();
    mockedUseFollowingFeed.mockReset();
    mockedUseGeneralFeed.mockReset();
    mockFollowing(pendingResult(followingHandlers));
    mockGeneral(pendingResult(generalHandlers));
  });

  describe("Para Você tab (general feed)", () => {
    it("is the first tab, selected by default, and enables only the general query", () => {
      renderScreen();

      const [first, second] = screen.getAllByRole("tab");

      expect(screen.getByTestId("feed-screen")).toBeTruthy();
      expect(first).toBeSelected();
      expect(within(first).getByText("Para Você")).toBeTruthy();
      expect(within(second).getByText("Seguindo")).toBeTruthy();
      expect(mockedUseGeneralFeed).toHaveBeenLastCalledWith(true);
      expect(mockedUseFollowingFeed).toHaveBeenLastCalledWith(false);
    });

    it("shows a loading state while the general feed is pending", () => {
      renderScreen();

      expect(screen.getByText("Carregando feed...")).toBeTruthy();
      expect(screen.queryByTestId(/feed-post-/)).toBeNull();
    });

    it("renders the general Recorda cards", () => {
      mockGeneral(successResult(GENERAL_PAGE, false, generalHandlers));
      renderScreen();

      expect(screen.getByTestId("general-feed-list")).toBeTruthy();
      expect(within(screen.getByTestId("feed-post-general-1")).getByText("Ocean")).toBeTruthy();
      expect(within(screen.getByTestId("feed-post-general-2")).getByText("Highway")).toBeTruthy();
    });

    it("renders followed and discovery authors through the same card with no distinction", () => {
      mockGeneral(successResult(GENERAL_PAGE, false, generalHandlers));
      renderScreen();

      const cards = screen.getAllByTestId(/^feed-post-/);

      expect(cards).toHaveLength(2);
      for (const card of cards) {
        expect(card.props.accessibilityRole).toBe("button");
        expect(
          within(card).queryByText(/descobr|discover|sugerid|suggest|seguindo|following/i)
        ).toBeNull();
      }
    });

    it("shows the general empty state when the general feed has no items", () => {
      mockGeneral(successResult({ items: [], next_cursor: null }, false, generalHandlers));
      renderScreen();

      expect(screen.getByTestId("feed-general-empty-state")).toBeTruthy();
      expect(screen.queryByTestId("feed-following-empty-state")).toBeNull();
    });

    it("shows an error state and retries the general feed", () => {
      mockGeneral(errorResult(generalHandlers));
      renderScreen();

      expect(screen.getByText("Não foi possível carregar o feed. Tente novamente.")).toBeTruthy();
      fireEvent.press(screen.getByRole("button", { name: "Tentar novamente" }));

      expect(mockGeneralRefetch).toHaveBeenCalledTimes(1);
      expect(mockRefetch).not.toHaveBeenCalled();
    });

    it("loads the next general page when the list reaches the end", () => {
      mockGeneral(
        successResult({ ...GENERAL_PAGE, next_cursor: "next-page" }, true, generalHandlers)
      );
      renderScreen();

      fireEvent(screen.getByTestId("general-feed-list"), "endReached");

      expect(mockGeneralFetchNextPage).toHaveBeenCalledTimes(1);
      expect(mockFetchNextPage).not.toHaveBeenCalled();
    });

    it("navigates to the Recorda viewer when a general card is tapped", async () => {
      mockGeneral(successResult(GENERAL_PAGE, false, generalHandlers));
      renderScreen();

      fireEvent.press(screen.getByTestId("feed-post-general-2"));

      await waitFor(() =>
        expect(mockNavigate).toHaveBeenCalledWith("RecordaView", { recordaId: "general-2" })
      );
    });
  });

  describe("tab switching", () => {
    it("enables only the query of the active tab", () => {
      renderScreen();

      fireEvent.press(screen.getByRole("tab", { name: "Seguindo" }));

      expect(screen.getByRole("tab", { name: "Seguindo" })).toBeSelected();
      expect(mockedUseGeneralFeed).toHaveBeenLastCalledWith(false);
      expect(mockedUseFollowingFeed).toHaveBeenLastCalledWith(true);

      fireEvent.press(screen.getByRole("tab", { name: "Para Você" }));

      expect(screen.getByRole("tab", { name: "Para Você" })).toBeSelected();
      expect(mockedUseGeneralFeed).toHaveBeenLastCalledWith(true);
      expect(mockedUseFollowingFeed).toHaveBeenLastCalledWith(false);
    });

    it("shows each tab's own list", () => {
      mockGeneral(successResult(GENERAL_PAGE, false, generalHandlers));
      mockFollowing(successResult(FEED_PAGE));
      renderScreen();

      expect(screen.getByTestId("feed-post-general-1")).toBeTruthy();
      expect(screen.queryByTestId("feed-post-recorda-1")).toBeNull();

      fireEvent.press(screen.getByRole("tab", { name: "Seguindo" }));

      expect(screen.getByTestId("feed-post-recorda-1")).toBeTruthy();
      expect(screen.queryByTestId("feed-post-general-1")).toBeNull();
    });
  });

  describe("Seguindo tab (following feed)", () => {
    it("shows a loading state while the following feed is pending", () => {
      renderScreen();

      fireEvent.press(screen.getByRole("tab", { name: "Seguindo" }));

      expect(screen.getByRole("tab", { name: "Seguindo" })).toBeSelected();
      expect(mockedUseFollowingFeed).toHaveBeenLastCalledWith(true);
      expect(screen.getByText("Carregando feed...")).toBeTruthy();
    });

    it("renders the fetched Recorda cards for the Seguindo tab", () => {
      mockFollowing(successResult(FEED_PAGE));
      renderScreen();

      fireEvent.press(screen.getByRole("tab", { name: "Seguindo" }));

      const post = within(screen.getByTestId("feed-post-recorda-1"));
      expect(post.getAllByText("lucas_almeida")).toHaveLength(2);
      expect(post.getByText("The Edge")).toBeTruthy();
    });

    it("shows the empty state when the following feed has no items", () => {
      mockFollowing(successResult({ items: [], next_cursor: null }));
      renderScreen();

      fireEvent.press(screen.getByRole("tab", { name: "Seguindo" }));

      expect(screen.getByTestId("feed-following-empty-state")).toBeTruthy();
    });

    it("shows an error state and retries when the following feed request fails", () => {
      mockFollowing(errorResult());
      renderScreen();

      fireEvent.press(screen.getByRole("tab", { name: "Seguindo" }));

      expect(screen.getByText("Não foi possível carregar o feed. Tente novamente.")).toBeTruthy();
      fireEvent.press(screen.getByRole("button", { name: "Tentar novamente" }));
      expect(mockRefetch).toHaveBeenCalledTimes(1);
      expect(mockGeneralRefetch).not.toHaveBeenCalled();
    });

    it("loads the next page when the list reaches the end", () => {
      mockFollowing(successResult({ ...FEED_PAGE, next_cursor: "next-page" }, true));
      renderScreen();

      fireEvent.press(screen.getByRole("tab", { name: "Seguindo" }));
      fireEvent(screen.getByTestId("following-feed-list"), "endReached");

      expect(mockFetchNextPage).toHaveBeenCalledTimes(1);
      expect(mockGeneralFetchNextPage).not.toHaveBeenCalled();
    });

    it("navigates to the Recorda viewer when a card is tapped", async () => {
      mockFollowing(successResult(FEED_PAGE));
      renderScreen();

      fireEvent.press(screen.getByRole("tab", { name: "Seguindo" }));
      fireEvent.press(screen.getByTestId("feed-post-recorda-1"));

      await waitFor(() =>
        expect(mockNavigate).toHaveBeenCalledWith("RecordaView", { recordaId: "recorda-1" })
      );
    });
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

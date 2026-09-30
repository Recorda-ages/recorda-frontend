import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react-native";
import { I18nextProvider } from "react-i18next";
import { Dimensions } from "react-native";

import { FeedProvider, FeedScreen } from "@/features/feed";
import { FeedAudioProvider } from "@/features/feed/state/FeedAudioContext";
import { useFollowingFeed } from "@/features/feed/hooks/useFollowingFeed";
import { useGeneralFeed } from "@/features/feed/hooks/useGeneralFeed";
import { feedService } from "@/features/feed/services/feedService";
import type { FeedItem, FeedPage } from "@/features/feed/types";
import { i18n } from "@/i18n";

import { mockAudioPlayer, resetAudioMock } from "../../mocks/expoAudio";

const mockNavigate = jest.fn();
const queryClients: QueryClient[] = [];

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ navigate: mockNavigate })
}));

jest.mock("@/features/notifications", () => ({
  useNotifications: () => ({ data: { pageParams: [0], pages: [{ items: [], unread_count: 3 }] } })
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
    isFetching: false,
    isFetchingNextPage: false,
    isFetchNextPageError: false,
    isRefetching: false,
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
    isFetching: false,
    isFetchingNextPage: false,
    isFetchNextPageError: false,
    isRefetching: false,
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
    isFetching: false,
    isFetchingNextPage: false,
    isFetchNextPageError: false,
    isRefetching: false,
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

const TAB_PAGES = { "Para Você": 0, Seguindo: 1 } as const;

/**
 * Taps a feed tab and reports the pager settling on its page, as iOS does when the
 * programmatic scroll ends. The screen only switches tabs at that point.
 */
function switchTab(name: keyof typeof TAB_PAGES) {
  fireEvent.press(screen.getByRole("tab", { name }));
  fireEvent(screen.getByTestId("feed-pager"), "momentumScrollEnd", {
    nativeEvent: { contentOffset: { x: TAB_PAGES[name] * Dimensions.get("window").width } }
  });
}

function renderScreen() {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { gcTime: 0, retry: false } }
  });
  queryClients.push(queryClient);

  return render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <FeedProvider>
          <FeedAudioProvider>
            <FeedScreen />
          </FeedAudioProvider>
        </FeedProvider>
      </QueryClientProvider>
    </I18nextProvider>
  );
}

describe("FeedScreen", () => {
  afterEach(() => {
    jest.restoreAllMocks();
    queryClients.forEach((queryClient) => queryClient.clear());
    queryClients.length = 0;
  });

  beforeEach(() => {
    resetAudioMock();
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

    it("sends a like from the general feed to the API", async () => {
      const recordaId = "11111111-1111-4111-8111-111111111111";
      const setRecordaLike = jest
        .spyOn(feedService, "setRecordaLike")
        .mockResolvedValue({ is_liked: true, likes_count: 1 });
      mockGeneral(
        successResult(
          { items: [buildItem({ likes_count: 0, recorda_id: recordaId })], next_cursor: null },
          false,
          generalHandlers
        )
      );
      renderScreen();

      fireEvent.press(screen.getByTestId(`like-button-${recordaId}`));

      await waitFor(() => expect(setRecordaLike).toHaveBeenCalledWith(recordaId, true));
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

    it("offers retry when refresh fails while existing Recordas remain visible", () => {
      mockGeneral({
        ...successResult(GENERAL_PAGE, false, generalHandlers),
        isError: true,
        isSuccess: false
      });
      renderScreen();

      expect(screen.getByTestId("feed-post-general-1")).toBeTruthy();
      expect(screen.getByText("Não foi possível carregar o feed. Tente novamente.")).toBeTruthy();
      fireEvent.press(screen.getByRole("button", { name: "Tentar novamente" }));

      expect(mockGeneralRefetch).toHaveBeenCalledTimes(1);
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

    it("does not load another page while refreshing", () => {
      mockGeneral({
        ...successResult({ ...GENERAL_PAGE, next_cursor: "next-page" }, true, generalHandlers),
        isFetching: true,
        isRefetching: true
      });
      renderScreen();

      fireEvent(screen.getByTestId("general-feed-list"), "endReached");

      expect(mockGeneralFetchNextPage).not.toHaveBeenCalled();
    });

    it("keeps the pull-to-refresh spinner hidden during background refetches", () => {
      mockGeneral({
        ...successResult(GENERAL_PAGE, false, generalHandlers),
        isFetching: true,
        isRefetching: true
      });
      renderScreen();

      expect(screen.getByTestId("general-feed-list").props.refreshing).toBe(false);
    });

    it("shows the spinner only while a pull refresh is in flight", async () => {
      let finishRefetch!: () => void;
      mockGeneralRefetch.mockReturnValueOnce(
        new Promise<void>((resolve) => {
          finishRefetch = resolve;
        })
      );
      mockGeneral(successResult(GENERAL_PAGE, false, generalHandlers));
      renderScreen();

      fireEvent(screen.getByTestId("general-feed-list"), "refresh");
      expect(screen.getByTestId("general-feed-list").props.refreshing).toBe(true);

      await act(async () => finishRefetch());
      expect(screen.getByTestId("general-feed-list").props.refreshing).toBe(false);
    });

    it("refreshes the general feed with a pull gesture, including when empty", () => {
      mockGeneral(successResult({ items: [], next_cursor: null }, false, generalHandlers));
      renderScreen();

      fireEvent(screen.getByTestId("general-feed-list"), "refresh");

      expect(mockGeneralRefetch).toHaveBeenCalledTimes(1);
    });

    it("opens published Recorda details when a general card is tapped", async () => {
      mockGeneral(successResult(GENERAL_PAGE, false, generalHandlers));
      renderScreen();

      fireEvent.press(screen.getByTestId("feed-post-general-2"));

      await waitFor(() =>
        expect(mockNavigate).toHaveBeenCalledWith("PublishedRecorda", { postId: "general-2" })
      );
    });
  });

  describe("tab switching", () => {
    it("keeps both lists mounted and retains their scroll and media instances", () => {
      const generalItem = buildItem({ media_type: "VIDEO", recorda_id: "general-video" });
      const followingItem = buildItem({ media_type: "VIDEO", recorda_id: "following-video" });
      mockGeneral(successResult({ ...GENERAL_PAGE, items: [generalItem] }, false, generalHandlers));
      mockFollowing(successResult({ ...FEED_PAGE, items: [followingItem] }));
      renderScreen();

      // A video's player only mounts once its card has been focused.
      const focus = (listId: string, item: FeedItem) =>
        fireEvent(screen.getByTestId(listId), "viewableItemsChanged", {
          changed: [],
          viewableItems: [{ index: 0, isViewable: true, item, key: item.recorda_id }]
        });

      const generalList = screen.getByTestId("general-feed-list");
      focus("general-feed-list", generalItem);
      const generalVideo = within(screen.getByTestId("feed-post-general-video")).getByTestId(
        "mock-video-view"
      );
      const { width } = Dimensions.get("window");
      fireEvent.press(screen.getByRole("tab", { name: "Seguindo" }));
      fireEvent(screen.getByTestId("feed-pager"), "momentumScrollEnd", {
        nativeEvent: { contentOffset: { x: width } }
      });
      const followingList = screen.getByTestId("following-feed-list");
      focus("following-feed-list", followingItem);
      const followingVideo = within(screen.getByTestId("feed-post-following-video")).getByTestId(
        "mock-video-view"
      );
      fireEvent.press(screen.getByRole("tab", { name: "Para Você" }));
      fireEvent(screen.getByTestId("feed-pager"), "momentumScrollEnd", {
        nativeEvent: { contentOffset: { x: 0 } }
      });

      expect(screen.getByTestId("general-feed-list")).toBe(generalList);
      expect(
        within(screen.getByTestId("feed-post-general-video")).getByTestId("mock-video-view")
      ).toBe(generalVideo);
      expect(screen.getByTestId("following-feed-list", { includeHiddenElements: true })).toBe(
        followingList
      );
      expect(
        within(
          screen.getByTestId("feed-post-following-video", { includeHiddenElements: true })
        ).getByTestId("mock-video-view", { includeHiddenElements: true })
      ).toBe(followingVideo);
    });

    it("focuses the copy of a Recorda in the tab brought to the front", () => {
      const video = buildItem({ media_type: "VIDEO", recorda_id: "shared-video" });
      mockGeneral(successResult({ ...GENERAL_PAGE, items: [video] }, false, generalHandlers));
      mockFollowing(successResult({ ...FEED_PAGE, items: [video] }));
      renderScreen();
      const focus = (listId: string) =>
        fireEvent(
          screen.getByTestId(listId, { includeHiddenElements: true }),
          "viewableItemsChanged",
          {
            changed: [],
            viewableItems: [{ index: 0, isViewable: true, item: video, key: video.recorda_id }]
          }
        );
      const videoIn = (panelId: string) =>
        within(screen.getByTestId(panelId, { includeHiddenElements: true })).queryAllByTestId(
          "mock-video-view",
          { includeHiddenElements: true }
        );

      focus("general-feed-list");
      focus("following-feed-list");
      expect(videoIn("general-feed-panel")).toHaveLength(1);
      expect(videoIn("following-feed-panel")).toHaveLength(0);

      const { width } = Dimensions.get("window");
      fireEvent.press(screen.getByRole("tab", { name: "Seguindo" }));
      fireEvent(screen.getByTestId("feed-pager"), "momentumScrollEnd", {
        nativeEvent: { contentOffset: { x: width } }
      });

      expect(videoIn("following-feed-panel")).toHaveLength(1);
    });

    it("enables only the query of the active tab", () => {
      renderScreen();

      switchTab("Seguindo");

      expect(screen.getByRole("tab", { name: "Seguindo" })).toBeSelected();
      expect(mockedUseGeneralFeed).toHaveBeenLastCalledWith(false);
      expect(mockedUseFollowingFeed).toHaveBeenLastCalledWith(true);

      switchTab("Para Você");

      expect(screen.getByRole("tab", { name: "Para Você" })).toBeSelected();
      expect(mockedUseGeneralFeed).toHaveBeenLastCalledWith(true);
      expect(mockedUseFollowingFeed).toHaveBeenLastCalledWith(false);
    });

    it("highlights a tapped tab at once but switches feeds only when the pager settles", () => {
      renderScreen();

      fireEvent.press(screen.getByRole("tab", { name: "Seguindo" }));
      expect(screen.getByRole("tab", { name: "Seguindo" })).toBeSelected();
      // Nothing else re-renders while the pager is scrolling.
      expect(mockedUseFollowingFeed).toHaveBeenLastCalledWith(false);

      fireEvent(screen.getByTestId("feed-pager"), "momentumScrollEnd", {
        nativeEvent: { contentOffset: { x: Dimensions.get("window").width } }
      });
      expect(mockedUseFollowingFeed).toHaveBeenLastCalledWith(true);
      expect(mockedUseGeneralFeed).toHaveBeenLastCalledWith(false);
    });

    it("switches tabs by swiping the pager sideways", () => {
      renderScreen();
      const pager = screen.getByTestId("feed-pager");
      const { width } = Dimensions.get("window");

      fireEvent(pager, "scrollBeginDrag");
      expect(mockedUseGeneralFeed).toHaveBeenLastCalledWith(true);
      expect(mockedUseFollowingFeed).toHaveBeenLastCalledWith(true);

      fireEvent(pager, "momentumScrollEnd", { nativeEvent: { contentOffset: { x: width } } });
      expect(screen.getByRole("tab", { name: "Seguindo" })).toBeSelected();
      expect(mockedUseGeneralFeed).toHaveBeenLastCalledWith(false);
      expect(mockedUseFollowingFeed).toHaveBeenLastCalledWith(true);

      fireEvent(pager, "scrollBeginDrag");
      fireEvent(pager, "momentumScrollEnd", { nativeEvent: { contentOffset: { x: 0 } } });
      expect(screen.getByRole("tab", { name: "Para Você" })).toBeSelected();
    });

    it("shows each tab's own list", () => {
      mockGeneral(successResult(GENERAL_PAGE, false, generalHandlers));
      mockFollowing(successResult(FEED_PAGE));
      renderScreen();

      expect(screen.getByTestId("feed-post-general-1")).toBeTruthy();
      expect(screen.queryByTestId("feed-post-recorda-1")).toBeNull();

      switchTab("Seguindo");

      expect(screen.getByTestId("feed-post-recorda-1")).toBeTruthy();
      expect(screen.queryByTestId("feed-post-general-1")).toBeNull();
    });
  });

  describe("Seguindo tab (following feed)", () => {
    it("shows a loading state while the following feed is pending", () => {
      renderScreen();

      switchTab("Seguindo");

      expect(screen.getByRole("tab", { name: "Seguindo" })).toBeSelected();
      expect(mockedUseFollowingFeed).toHaveBeenLastCalledWith(true);
      expect(screen.getByText("Carregando feed...")).toBeTruthy();
    });

    it("renders the fetched Recorda cards for the Seguindo tab", () => {
      mockFollowing(successResult(FEED_PAGE));
      renderScreen();

      switchTab("Seguindo");

      const post = within(screen.getByTestId("feed-post-recorda-1"));
      expect(post.getAllByText("lucas_almeida")).toHaveLength(2);
      expect(post.getByText("The Edge")).toBeTruthy();
    });

    it("shows the empty state when the following feed has no items", () => {
      mockFollowing(successResult({ items: [], next_cursor: null }));
      renderScreen();

      switchTab("Seguindo");

      expect(screen.getByTestId("feed-following-empty-state")).toBeTruthy();
    });

    it("shows an error state and retries when the following feed request fails", () => {
      mockFollowing(errorResult());
      renderScreen();

      switchTab("Seguindo");

      expect(screen.getByText("Não foi possível carregar o feed. Tente novamente.")).toBeTruthy();
      fireEvent.press(screen.getByRole("button", { name: "Tentar novamente" }));
      expect(mockRefetch).toHaveBeenCalledTimes(1);
      expect(mockGeneralRefetch).not.toHaveBeenCalled();
    });

    it("loads the next page when the list reaches the end", () => {
      mockFollowing(successResult({ ...FEED_PAGE, next_cursor: "next-page" }, true));
      renderScreen();

      switchTab("Seguindo");
      fireEvent(screen.getByTestId("following-feed-list"), "endReached");

      expect(mockFetchNextPage).toHaveBeenCalledTimes(1);
      expect(mockGeneralFetchNextPage).not.toHaveBeenCalled();
    });

    it("refreshes the following feed with a pull gesture", () => {
      mockFollowing(successResult(FEED_PAGE));
      renderScreen();

      switchTab("Seguindo");
      fireEvent(screen.getByTestId("following-feed-list"), "refresh");

      expect(mockRefetch).toHaveBeenCalledTimes(1);
    });

    it("opens published Recorda details when a following card is tapped", async () => {
      mockFollowing(successResult(FEED_PAGE));
      renderScreen();

      switchTab("Seguindo");
      fireEvent.press(screen.getByTestId("feed-post-recorda-1"));

      await waitFor(() =>
        expect(mockNavigate).toHaveBeenCalledWith("PublishedRecorda", { postId: "recorda-1" })
      );
    });
  });

  it("opens the user search from the header", () => {
    renderScreen();

    fireEvent.press(screen.getByTestId("feed-search-button"));

    expect(mockNavigate).toHaveBeenCalledWith("UserSearch");
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

  it("shows the unread badge on the bell and opens the notifications screen", () => {
    renderScreen();

    expect(screen.getByTestId("feed-notifications-badge")).toHaveTextContent("3");

    fireEvent.press(screen.getByTestId("feed-notifications-button"));

    expect(mockNavigate).toHaveBeenCalledWith("Notifications");
  });

  it("navigates to ShareCard when the share button on a general card is pressed", async () => {
    mockGeneral(successResult(GENERAL_PAGE, false, generalHandlers));
    renderScreen();

    fireEvent.press(
      within(screen.getByTestId("feed-post-general-1")).getByLabelText("Compartilhar")
    );

    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith("ShareCard", {
        artistName: "The American Dawn",
        coverUrl: "https://cdn.example.com/cover-1.jpg",
        mediaUri: expect.stringContaining("media-1.jpg"),
        mediaType: "photo",
        songTitle: "Ocean"
      })
    );
  });

  it("shows the pagination error footer and retries when the next-page fetch fails", () => {
    mockGeneral({
      ...successResult({ ...GENERAL_PAGE, next_cursor: "next" }, true, generalHandlers),
      isError: true,
      isFetchNextPageError: true,
      isFetchingNextPage: false,
      isSuccess: false
    } as ReturnType<typeof successResult>);
    renderScreen();

    expect(screen.getByText("Não foi possível carregar mais Recordas.")).toBeTruthy();
    expect(screen.queryByText("Não foi possível carregar o feed. Tente novamente.")).toBeNull();
    fireEvent.press(screen.getByRole("button", { name: "Tentar novamente" }));

    expect(mockGeneralFetchNextPage).toHaveBeenCalledTimes(1);
  });

  // US16: o card em foco durante o scroll assume o áudio.
  describe("preview autoplay", () => {
    const withPreview = [
      buildItem({ recorda_id: "recorda-1", song_preview_url: "https://cdn.example.com/a.mp3" }),
      buildItem({ recorda_id: "recorda-2", song_preview_url: "https://cdn.example.com/b.mp3" })
    ];

    function scrollEvent() {
      return {
        nativeEvent: {
          contentInset: { bottom: 0, left: 0, right: 0, top: 0 },
          contentOffset: { x: 0, y: 0 },
          contentSize: { height: 2000, width: 400 },
          layoutMeasurement: { height: 800, width: 400 },
          velocity: { x: 0, y: 0 },
          zoomScale: 1
        }
      };
    }

    function viewable(item: FeedItem, index: number) {
      return {
        changed: [],
        viewableItems: [{ index, isViewable: true, item, key: item.recorda_id }]
      };
    }

    it("plays the preview of the card that comes into view", () => {
      mockGeneral(successResult({ items: withPreview, next_cursor: null }, false, generalHandlers));
      renderScreen();

      fireEvent(
        screen.getByTestId("general-feed-list"),
        "viewableItemsChanged",
        viewable(withPreview[0], 0)
      );

      expect(mockAudioPlayer.replace).toHaveBeenCalledWith("https://cdn.example.com/a.mp3");
      expect(mockAudioPlayer.play).toHaveBeenCalled();
    });

    it("hands the audio over when the next card takes focus", () => {
      mockGeneral(successResult({ items: withPreview, next_cursor: null }, false, generalHandlers));
      renderScreen();
      const list = screen.getByTestId("general-feed-list");

      fireEvent(list, "viewableItemsChanged", viewable(withPreview[0], 0));
      fireEvent(list, "viewableItemsChanged", viewable(withPreview[1], 1));

      expect(mockAudioPlayer.replace).toHaveBeenLastCalledWith("https://cdn.example.com/b.mp3");
    });

    it("waits for the scroll to settle before handing the audio over", () => {
      mockGeneral(successResult({ items: withPreview, next_cursor: null }, false, generalHandlers));
      renderScreen();
      const list = screen.getByTestId("general-feed-list");

      fireEvent(list, "viewableItemsChanged", viewable(withPreview[0], 0));
      mockAudioPlayer.replace.mockClear();

      fireEvent(list, "scrollBeginDrag", scrollEvent());
      fireEvent(list, "viewableItemsChanged", viewable(withPreview[1], 1));
      expect(mockAudioPlayer.replace).not.toHaveBeenCalled();

      fireEvent(list, "scrollEndDrag", scrollEvent());
      fireEvent(list, "momentumScrollBegin", scrollEvent());
      fireEvent(list, "momentumScrollEnd", scrollEvent());
      expect(mockAudioPlayer.replace).toHaveBeenLastCalledWith("https://cdn.example.com/b.mp3");
    });

    it("settles a scroll released without momentum", () => {
      jest.useFakeTimers();
      try {
        mockGeneral(
          successResult({ items: withPreview, next_cursor: null }, false, generalHandlers)
        );
        renderScreen();
        const list = screen.getByTestId("general-feed-list");

        fireEvent(list, "scrollBeginDrag", scrollEvent());
        fireEvent(list, "viewableItemsChanged", viewable(withPreview[1], 1));
        fireEvent(list, "scrollEndDrag", scrollEvent());
        expect(mockAudioPlayer.replace).not.toHaveBeenCalled();

        act(() => {
          jest.advanceTimersByTime(100);
        });
        expect(mockAudioPlayer.replace).toHaveBeenLastCalledWith("https://cdn.example.com/b.mp3");
      } finally {
        jest.useRealTimers();
      }
    });

    it("settles a fling stopped by a tap, which sends no end event", () => {
      jest.useFakeTimers();
      try {
        mockGeneral(
          successResult({ items: withPreview, next_cursor: null }, false, generalHandlers)
        );
        renderScreen();
        const list = screen.getByTestId("general-feed-list");

        fireEvent(list, "scrollBeginDrag", scrollEvent());
        fireEvent(list, "scrollEndDrag", scrollEvent());
        fireEvent(list, "momentumScrollBegin", scrollEvent());
        fireEvent(list, "scroll", scrollEvent());
        fireEvent(list, "viewableItemsChanged", viewable(withPreview[1], 1));
        // A tap stops the fling here: no momentumScrollEnd ever arrives.
        expect(mockAudioPlayer.replace).not.toHaveBeenCalled();

        act(() => {
          jest.advanceTimersByTime(300);
        });
        expect(mockAudioPlayer.replace).toHaveBeenLastCalledWith("https://cdn.example.com/b.mp3");
      } finally {
        jest.useRealTimers();
      }
    });

    it("doesn't treat a finger resting mid-drag as a settled list", () => {
      jest.useFakeTimers();
      try {
        mockGeneral(
          successResult({ items: withPreview, next_cursor: null }, false, generalHandlers)
        );
        renderScreen();
        const list = screen.getByTestId("general-feed-list");

        fireEvent(list, "scrollBeginDrag", scrollEvent());
        fireEvent(list, "scroll", scrollEvent());
        fireEvent(list, "viewableItemsChanged", viewable(withPreview[1], 1));
        act(() => {
          jest.advanceTimersByTime(1000);
        });

        expect(mockAudioPlayer.replace).not.toHaveBeenCalled();
      } finally {
        jest.useRealTimers();
      }
    });

    it("stays silent when the focused card has no preview", () => {
      const silent = buildItem({ recorda_id: "recorda-9" });
      mockGeneral(successResult({ items: [silent], next_cursor: null }, false, generalHandlers));
      renderScreen();

      fireEvent(
        screen.getByTestId("general-feed-list"),
        "viewableItemsChanged",
        viewable(silent, 0)
      );

      expect(mockAudioPlayer.replace).not.toHaveBeenCalled();
    });

    // O painel inativo segue montado (opacity 0), então sua lista também dispara
    // viewability: ela não pode roubar o áudio da aba que está na frente.
    it("ignores the hidden tab list", () => {
      mockGeneral(successResult({ items: withPreview, next_cursor: null }, false, generalHandlers));
      mockFollowing(successResult({ items: withPreview, next_cursor: null }));
      renderScreen();

      // Monta o painel de Seguindo e volta para Para Você: os dois ficam
      // montados, mas só o da frente pode assumir o áudio.
      switchTab("Seguindo");
      switchTab("Para Você");
      mockAudioPlayer.replace.mockClear();

      fireEvent(
        screen.getByTestId("following-feed-list", { includeHiddenElements: true }),
        "viewableItemsChanged",
        viewable(withPreview[1], 1)
      );

      expect(mockAudioPlayer.replace).not.toHaveBeenCalled();
    });

    it("synchronizes audio preview once a tapped tab switch settles", () => {
      mockGeneral(successResult({ items: withPreview, next_cursor: null }, false, generalHandlers));
      mockFollowing(successResult({ items: withPreview, next_cursor: null }));
      renderScreen();
      const { width } = Dimensions.get("window");
      // What iOS reports when the programmatic pager scroll finishes.
      const settlePager = (page: number) =>
        fireEvent(screen.getByTestId("feed-pager"), "momentumScrollEnd", {
          nativeEvent: { contentOffset: { x: page * width } }
        });

      // Card 0 on general feed takes focus:
      fireEvent(
        screen.getByTestId("general-feed-list"),
        "viewableItemsChanged",
        viewable(withPreview[0], 0)
      );
      expect(mockAudioPlayer.replace).toHaveBeenLastCalledWith("https://cdn.example.com/a.mp3");

      // Switch to Following tab before it has any focused card: nothing changes while
      // the pager is still scrolling, the handover happens when it settles.
      mockAudioPlayer.pause.mockClear();
      fireEvent.press(screen.getByRole("tab", { name: "Seguindo" }));
      expect(screen.getByRole("tab", { name: "Seguindo" })).toBeSelected();
      expect(mockAudioPlayer.pause).not.toHaveBeenCalled();
      settlePager(1);
      expect(mockAudioPlayer.pause).toHaveBeenCalled();

      // Card 1 on following feed takes focus:
      fireEvent(
        screen.getByTestId("following-feed-list"),
        "viewableItemsChanged",
        viewable(withPreview[1], 1)
      );
      expect(mockAudioPlayer.replace).toHaveBeenLastCalledWith("https://cdn.example.com/b.mp3");

      // Switch back to Para Você: card 0 resumes as soon as the pager settles
      fireEvent.press(screen.getByRole("tab", { name: "Para Você" }));
      expect(mockAudioPlayer.replace).toHaveBeenLastCalledWith("https://cdn.example.com/b.mp3");
      settlePager(0);
      expect(mockAudioPlayer.replace).toHaveBeenLastCalledWith("https://cdn.example.com/a.mp3");
    });

    it("still hands the audio over if the tapped tab's scroll never reports settling", () => {
      jest.useFakeTimers();
      try {
        mockGeneral(
          successResult({ items: withPreview, next_cursor: null }, false, generalHandlers)
        );
        mockFollowing(successResult({ items: withPreview, next_cursor: null }));
        renderScreen();

        fireEvent.press(screen.getByRole("tab", { name: "Seguindo" }));
        // Still hidden from accessibility until the pager settles on it.
        fireEvent(
          screen.getByTestId("following-feed-list", { includeHiddenElements: true }),
          "viewableItemsChanged",
          viewable(withPreview[1], 1)
        );
        expect(mockAudioPlayer.replace).not.toHaveBeenCalled();

        act(() => {
          jest.advanceTimersByTime(500);
        });
        expect(mockAudioPlayer.replace).toHaveBeenLastCalledWith("https://cdn.example.com/b.mp3");
      } finally {
        jest.useRealTimers();
      }
    });

    it("activates audio preview on card tap even before visibility threshold", () => {
      mockGeneral(successResult({ items: withPreview, next_cursor: null }, false, generalHandlers));
      renderScreen();

      mockAudioPlayer.replace.mockClear();
      fireEvent.press(screen.getByTestId("feed-post-recorda-2"));

      expect(mockAudioPlayer.replace).toHaveBeenCalledWith("https://cdn.example.com/b.mp3");
    });
  });
});

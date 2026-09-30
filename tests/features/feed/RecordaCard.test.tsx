import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { useEffect } from "react";
import { I18nextProvider } from "react-i18next";

import { RecordaCard } from "@/features/feed/components/RecordaCard";
import { FeedAudioProvider, useFeedAudioActions } from "@/features/feed/state/FeedAudioContext";
import type { FeedItem } from "@/features/feed/types";
import { i18n } from "@/i18n";

import { mockUseVideoPlayer, resetVideoMock } from "../../mocks/expoVideo";

const BASE_ITEM: FeedItem = {
  author: {
    profile_picture_url: "https://cdn.example.com/avatar.jpg",
    user_id: "user-1",
    username: "lucas_almeida"
  },
  created_at: "2026-01-01T12:00:00Z",
  description: "Show I-N-C-R-I-V-E-L!",
  is_liked: false,
  likes_count: 12,
  media_type: "PHOTO",
  media_url: "https://cdn.example.com/media.jpg",
  recorda_id: "recorda-1",
  song_artist_name: "The American Dawn",
  song_cover_url: "https://cdn.example.com/cover.jpg",
  song_preview_url: null,
  song_title: "The Edge"
};

function FocusCard({ focusKey, recordaId }: { focusKey?: string; recordaId: string }) {
  const { setActivePreview } = useFeedAudioActions();
  useEffect(
    () => setActivePreview(recordaId, null, { focusKey }),
    [focusKey, recordaId, setActivePreview]
  );
  return null;
}

function renderCard(
  item: FeedItem,
  onPress = jest.fn(),
  onShare?: () => void,
  onToggleLike = jest.fn(),
  focused = false
) {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { gcTime: 0, retry: false } }
  });

  render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <FeedAudioProvider>
          {focused ? <FocusCard recordaId={item.recorda_id} /> : null}
          <RecordaCard
            item={item}
            onPress={onPress}
            onShare={onShare}
            onToggleLike={onToggleLike}
          />
        </FeedAudioProvider>
      </QueryClientProvider>
    </I18nextProvider>
  );
  return { onPress };
}

describe("RecordaCard", () => {
  it("renders author, song and the description caption", () => {
    renderCard(BASE_ITEM);

    expect(screen.getAllByText("lucas_almeida").length).toBeGreaterThan(0);
    expect(screen.getByText("The Edge")).toBeTruthy();
    expect(screen.getByText(/The American Dawn/)).toBeTruthy();
    expect(screen.getByText(/Show I-N-C-R-I-V-E-L!/)).toBeTruthy();
  });

  it("caps the caption at three lines", () => {
    renderCard(BASE_ITEM);

    const caption = screen.getByText(/Show I-N-C-R-I-V-E-L!/);
    expect(caption.props.numberOfLines).toBe(3);
    expect(caption.props.ellipsizeMode).toBe("tail");
  });

  it("omits the caption row when there is no description", () => {
    renderCard({ ...BASE_ITEM, description: null });

    expect(screen.queryByText(/Show I-N-C-R-I-V-E-L!/)).toBeNull();
  });

  it("shows the likes count when greater than zero", () => {
    renderCard({ ...BASE_ITEM, likes_count: 1 });

    expect(screen.getByText("1 curtida")).toBeTruthy();
  });

  it("shows zero likes beside the actions", () => {
    renderCard({ ...BASE_ITEM, likes_count: 0 });

    expect(screen.getByText("0 curtidas")).toBeTruthy();
  });

  it("renders a fallback avatar when there is no profile picture", () => {
    renderCard({ ...BASE_ITEM, author: { ...BASE_ITEM.author, profile_picture_url: null } });

    expect(screen.getAllByText("lucas_almeida").length).toBeGreaterThan(0);
  });

  it("resolves relative backend URLs before rendering images", () => {
    renderCard({
      ...BASE_ITEM,
      author: { ...BASE_ITEM.author, profile_picture_url: "/api/v1/users/avatar.jpg" },
      media_url: "/api/v1/recordas/media/photo.jpg"
    });

    expect(screen.getByTestId("recorda-author-avatar")).toHaveProp("source", [
      { uri: "http://localhost:8000/api/v1/users/avatar.jpg" }
    ]);
    expect(screen.getByTestId("recorda-media-image")).toHaveProp("source", [
      { uri: "http://localhost:8000/api/v1/recordas/media/photo.jpg" }
    ]);
  });

  it("renders a video view for focused VIDEO media instead of a static image", () => {
    renderCard(
      { ...BASE_ITEM, media_type: "VIDEO", media_url: "https://cdn.example.com/media.mp4" },
      jest.fn(),
      undefined,
      jest.fn(),
      true
    );

    expect(screen.getByTestId("mock-video-view")).toBeTruthy();
    expect(screen.queryByTestId("recorda-media-image")).toBeNull();
  });

  it("plays only the copy of a video in the tab that holds focus", () => {
    const item: FeedItem = {
      ...BASE_ITEM,
      media_type: "VIDEO",
      media_url: "https://cdn.example.com/media.mp4"
    };
    const queryClient = new QueryClient({ defaultOptions: { queries: { gcTime: 0 } } });

    render(
      <I18nextProvider i18n={i18n}>
        <QueryClientProvider client={queryClient}>
          <FeedAudioProvider>
            <FocusCard focusKey="following:recorda-1" recordaId="recorda-1" />
            <RecordaCard
              focusKey="geral:recorda-1"
              item={item}
              onPress={jest.fn()}
              onToggleLike={jest.fn()}
            />
            <RecordaCard
              focusKey="following:recorda-1"
              item={item}
              onPress={jest.fn()}
              onToggleLike={jest.fn()}
            />
          </FeedAudioProvider>
        </QueryClientProvider>
      </I18nextProvider>
    );

    expect(screen.getAllByTestId("mock-video-view")).toHaveLength(1);
  });

  it("waits for focus before loading a video", () => {
    mockUseVideoPlayer.mockClear();
    renderCard({
      ...BASE_ITEM,
      media_type: "VIDEO",
      media_url: "/api/v1/recordas/media/video.mp4"
    });

    expect(mockUseVideoPlayer).not.toHaveBeenCalled();
    expect(screen.queryByTestId("mock-video-view")).toBeNull();
    expect(screen.queryByTestId("recorda-video-loading")).toBeNull();
  });

  it("counts a video that was already ready before it was listened to", () => {
    // Like the real hook, the same player instance across renders.
    const readyPlayer = {
      addListener: () => ({ remove: () => undefined }),
      loop: false,
      pause: () => undefined,
      play: jest.fn(),
      playing: false,
      status: "readyToPlay"
    };
    mockUseVideoPlayer.mockImplementation(() => readyPlayer);
    try {
      renderCard(
        { ...BASE_ITEM, media_type: "VIDEO", media_url: "/api/v1/recordas/media/video.mp4" },
        jest.fn(),
        undefined,
        jest.fn(),
        true
      );

      expect(screen.queryByTestId("recorda-video-loading")).toBeNull();
    } finally {
      resetVideoMock();
    }
  });

  it("shows the loader while a focused video is loading", () => {
    renderCard(
      { ...BASE_ITEM, media_type: "VIDEO", media_url: "/api/v1/recordas/media/video.mp4" },
      jest.fn(),
      undefined,
      jest.fn(),
      true
    );

    expect(screen.getByTestId("recorda-video-loading")).toBeTruthy();
  });

  it("resolves a relative video URL once the card is focused", () => {
    renderCard(
      {
        ...BASE_ITEM,
        media_type: "VIDEO",
        media_url: "/api/v1/recordas/media/video.mp4"
      },
      jest.fn(),
      undefined,
      jest.fn(),
      true
    );

    expect(mockUseVideoPlayer).toHaveBeenLastCalledWith(
      { uri: "http://localhost:8000/api/v1/recordas/media/video.mp4" },
      expect.any(Function)
    );
  });

  it("exposes the card, menu and like controls as interactive buttons", () => {
    renderCard(BASE_ITEM);

    expect(screen.getAllByRole("button")).toHaveLength(5);
  });

  it("calls onPress with the whole card when tapped", () => {
    const { onPress } = renderCard(BASE_ITEM);

    fireEvent.press(screen.getByTestId("feed-post-recorda-1"));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("calls onShare when the share button is pressed", () => {
    const onShare = jest.fn();
    renderCard(BASE_ITEM, jest.fn(), onShare);

    fireEvent.press(screen.getByLabelText("Compartilhar"));

    expect(onShare).toHaveBeenCalledTimes(1);
  });

  it("opens the detail from the comment and more controls", () => {
    const { onPress } = renderCard(BASE_ITEM);
    fireEvent.press(screen.getByLabelText("Comentar"));
    fireEvent.press(screen.getByLabelText("Mais opções"));
    expect(onPress).toHaveBeenCalledTimes(2);
  });

  it("renders an empty date when created_at is not a valid ISO string", () => {
    renderCard({ ...BASE_ITEM, created_at: "not-a-date" });

    expect(screen.queryByText(/janeiro|fevereiro|março/i)).toBeNull();
  });

  it("toggles like immediately, calls the server handler and does not open the card", async () => {
    const onPress = jest.fn();
    const onToggleLike = jest.fn().mockResolvedValue(undefined);
    renderCard(
      { ...BASE_ITEM, is_liked: false, likes_count: 12 },
      onPress,
      undefined,
      onToggleLike
    );

    expect(screen.getByText("12 curtidas")).toBeTruthy();
    const likeButton = screen.getByTestId("like-button-recorda-1");
    fireEvent.press(likeButton);

    expect(screen.getByText("13 curtidas")).toBeTruthy();
    expect(likeButton).toBeSelected();
    await waitFor(() => expect(onToggleLike).toHaveBeenCalledWith(true));
    expect(onPress).not.toHaveBeenCalled();
  });

  it("reverts the optimistic like when the server request fails", async () => {
    const onToggleLike = jest.fn().mockRejectedValue(new Error("offline"));
    renderCard(
      { ...BASE_ITEM, is_liked: false, likes_count: 12 },
      jest.fn(),
      undefined,
      onToggleLike
    );

    const likeButton = screen.getByTestId("like-button-recorda-1");
    fireEvent.press(likeButton);
    expect(screen.getByText("13 curtidas")).toBeTruthy();

    await waitFor(() => {
      expect(screen.getByText("12 curtidas")).toBeTruthy();
      expect(likeButton).not.toBeSelected();
    });
  });
});

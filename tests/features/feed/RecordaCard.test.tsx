import { fireEvent, render, screen } from "@testing-library/react-native";
import { I18nextProvider } from "react-i18next";

import { RecordaCard } from "@/features/feed/components/RecordaCard";
import type { FeedItem } from "@/features/feed/types";
import { i18n } from "@/i18n";

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

function renderCard(item: FeedItem, onPress = jest.fn()) {
  render(
    <I18nextProvider i18n={i18n}>
      <RecordaCard item={item} onPress={onPress} />
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

  it("omits the caption row when there is no description", () => {
    renderCard({ ...BASE_ITEM, description: null });

    expect(screen.queryByText(/Show I-N-C-R-I-V-E-L!/)).toBeNull();
  });

  it("shows the likes count when greater than zero", () => {
    renderCard({ ...BASE_ITEM, likes_count: 1 });

    expect(screen.getByText("1 curtida")).toBeTruthy();
  });

  it("hides the likes line when the count is zero", () => {
    renderCard({ ...BASE_ITEM, likes_count: 0 });

    expect(screen.queryByText(/curtida/)).toBeNull();
  });

  it("renders a fallback avatar when there is no profile picture", () => {
    renderCard({ ...BASE_ITEM, author: { ...BASE_ITEM.author, profile_picture_url: null } });

    expect(screen.getAllByText("lucas_almeida").length).toBeGreaterThan(0);
  });

  it("renders a video view for VIDEO media instead of a static image", () => {
    renderCard({
      ...BASE_ITEM,
      media_type: "VIDEO",
      media_url: "https://cdn.example.com/media.mp4"
    });

    expect(screen.getByTestId("mock-video-view")).toBeTruthy();
  });

  it("only exposes the card itself and the menu icon as interactive buttons", () => {
    renderCard(BASE_ITEM);

    // The card (tap-to-open) and the "..." menu icon are the only real buttons;
    // like/comment/share are static Icons wrapped in plain (non-pressable) Views.
    expect(screen.getAllByRole("button")).toHaveLength(2);
  });

  it("calls onPress with the whole card when tapped", () => {
    const { onPress } = renderCard(BASE_ITEM);

    fireEvent.press(screen.getByTestId("feed-post-recorda-1"));

    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

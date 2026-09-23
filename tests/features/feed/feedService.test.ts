import { authApiClient } from "@/services/api";
import { feedService } from "@/features/feed/services/feedService";
import type { FeedPage } from "@/features/feed/types";

jest.mock("@/services/api", () => ({
  authApiClient: { get: jest.fn() }
}));

const mockGet = authApiClient.get as jest.Mock;

const FEED_PAGE: FeedPage = {
  items: [
    {
      author: { profile_picture_url: null, user_id: "user-1", username: "lucas_almeida" },
      created_at: "2026-01-01T12:00:00Z",
      description: "Show incrível!",
      is_liked: true,
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

beforeEach(() => mockGet.mockReset());

describe("feedService.getFollowingFeed", () => {
  it("calls the following feed endpoint and returns the page", async () => {
    mockGet.mockResolvedValueOnce(FEED_PAGE);

    const result = await feedService.getFollowingFeed();

    expect(mockGet).toHaveBeenCalledWith("/feed/following", { signal: undefined });
    expect(result).toEqual(FEED_PAGE);
  });

  it("forwards the abort signal when provided", async () => {
    mockGet.mockResolvedValueOnce(FEED_PAGE);
    const controller = new AbortController();

    await feedService.getFollowingFeed(null, controller.signal);

    expect(mockGet).toHaveBeenCalledWith("/feed/following", { signal: controller.signal });
  });

  it("encodes the cursor when requesting the next page", async () => {
    mockGet.mockResolvedValueOnce(FEED_PAGE);

    await feedService.getFollowingFeed("cursor/with+symbols=");

    expect(mockGet).toHaveBeenCalledWith("/feed/following?cursor=cursor%2Fwith%2Bsymbols%3D", {
      signal: undefined
    });
  });
});

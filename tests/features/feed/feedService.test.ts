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

// TEMP: covers the mock that stands in for GET /feed/general. When the real endpoint lands,
// replace this block with endpoint-path/cursor/signal tests like the ones above.
describe("feedService.getGeneralFeed (temporary mock)", () => {
  const FEED_ITEM_KEYS = [
    "author",
    "created_at",
    "description",
    "is_liked",
    "likes_count",
    "media_type",
    "media_url",
    "recorda_id",
    "song_artist_name",
    "song_cover_url",
    "song_preview_url",
    "song_title"
  ];

  async function fetchAllPages() {
    const pages: FeedPage[] = [];
    let cursor: string | null = null;

    do {
      const page: FeedPage = await feedService.getGeneralFeed(cursor);
      pages.push(page);
      cursor = page.next_cursor;
    } while (cursor !== null);

    return pages;
  }

  it("resolves a first page with a next cursor without calling the API", async () => {
    const page = await feedService.getGeneralFeed();

    expect(page.items.length).toBeGreaterThan(0);
    expect(page.next_cursor).toEqual(expect.any(String));
    expect(mockGet).not.toHaveBeenCalled();
  });

  it("follows the cursor to a final page whose next_cursor is null", async () => {
    const pages = await fetchAllPages();

    expect(pages.length).toBeGreaterThanOrEqual(2);
    expect(pages.slice(0, -1).every((page) => page.next_cursor !== null)).toBe(true);
    expect(pages[pages.length - 1].next_cursor).toBeNull();
  });

  it("never repeats a Recorda across pages", async () => {
    const ids = (await fetchAllPages()).flatMap((page) => page.items.map((i) => i.recorda_id));

    expect(new Set(ids).size).toBe(ids.length);
  });

  it("returns plain feed items with no source/discovery fields and absolute asset URLs", async () => {
    const items = (await fetchAllPages()).flatMap((page) => page.items);

    for (const item of items) {
      expect(Object.keys(item).sort()).toEqual(FEED_ITEM_KEYS);
      expect(item.media_url).toMatch(/^https?:\/\//);
      if (item.author.profile_picture_url) {
        expect(item.author.profile_picture_url).toMatch(/^https?:\/\//);
      }
    }
  });

  it("covers photo/video, avatar/fallback, description/none and liked/unliked", async () => {
    const items = (await fetchAllPages()).flatMap((page) => page.items);

    expect(new Set(items.map((item) => item.media_type))).toEqual(new Set(["PHOTO", "VIDEO"]));
    expect(items.some((item) => item.author.profile_picture_url === null)).toBe(true);
    expect(items.some((item) => item.author.profile_picture_url !== null)).toBe(true);
    expect(items.some((item) => item.description === null)).toBe(true);
    expect(items.some((item) => item.description !== null)).toBe(true);
    expect(items.some((item) => item.is_liked)).toBe(true);
    expect(items.some((item) => !item.is_liked)).toBe(true);
  });

  it("rejects an unknown cursor", async () => {
    await expect(feedService.getGeneralFeed("not-a-mock-cursor")).rejects.toThrow(
      "Unknown mock general feed cursor"
    );
  });
});

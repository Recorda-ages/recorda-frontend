import { feedService } from "@/features/feed/services/feedService";
import type { FeedPage, RecordaDetailResponse } from "@/features/feed/types";
import { authApiClient } from "@/services/api";

jest.mock("@/services/api", () => ({
  authApiClient: { get: jest.fn() }
}));

const mockGet = authApiClient.get as jest.Mock;

const FEED_PAGE: FeedPage = {
  items: [],
  next_cursor: null
};

beforeEach(() => mockGet.mockReset());

describe("feedService.getRecordaById", () => {
  it("loads the authenticated Recorda detail and encodes its id", async () => {
    const detail = { recorda_id: "recorda/id" } as RecordaDetailResponse;
    const controller = new AbortController();
    mockGet.mockResolvedValueOnce(detail);

    const result = await feedService.getRecordaById("recorda/id", controller.signal);

    expect(mockGet).toHaveBeenCalledWith("/recordas/recorda%2Fid", {
      signal: controller.signal
    });
    expect(result).toBe(detail);
  });
});

describe.each([
  ["following", feedService.getFollowingFeed],
  ["general", feedService.getGeneralFeed]
] as const)("feedService.get%sFeed", (feed, getFeed) => {
  it("calls the authenticated endpoint and returns the page", async () => {
    mockGet.mockResolvedValueOnce(FEED_PAGE);

    const result = await getFeed();

    expect(mockGet).toHaveBeenCalledWith(`/feed/${feed}`, { signal: undefined });
    expect(result).toEqual(FEED_PAGE);
  });

  it("forwards the abort signal", async () => {
    mockGet.mockResolvedValueOnce(FEED_PAGE);
    const controller = new AbortController();

    await getFeed(null, controller.signal);

    expect(mockGet).toHaveBeenCalledWith(`/feed/${feed}`, { signal: controller.signal });
  });

  it("encodes the pagination cursor", async () => {
    mockGet.mockResolvedValueOnce(FEED_PAGE);

    await getFeed("cursor/with+symbols=");

    expect(mockGet).toHaveBeenCalledWith(`/feed/${feed}?cursor=cursor%2Fwith%2Bsymbols%3D`, {
      signal: undefined
    });
  });
});

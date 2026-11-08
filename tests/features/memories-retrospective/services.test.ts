import { retrospectiveServiceMock } from "@/features/memories-retrospective/mocks/retrospectiveMock";
import { createRetrospectiveService } from "@/features/memories-retrospective/services/retrospectiveService";
import type {
  RetrospectiveDetailsResponse,
  RetrospectivePeriodSelection
} from "@/features/memories-retrospective/types";
import { ApiError, authApiClient } from "@/services/api";

jest.mock("@/services/api", () => ({
  ...jest.requireActual("@/services/api"),
  authApiClient: { get: jest.fn() }
}));

const mockGet = jest.mocked(authApiClient.get);

const OCTOBER: RetrospectivePeriodSelection = { month: 10, period_type: "MONTHLY", year: 2026 };
const YEAR_2025: RetrospectivePeriodSelection = { month: null, period_type: "YEARLY", year: 2025 };

beforeEach(() => mockGet.mockReset());

function withDev<T>(value: boolean, run: () => Promise<T>) {
  const development = __DEV__;
  Object.defineProperty(globalThis, "__DEV__", { configurable: true, value, writable: true });
  return run().finally(() =>
    Object.defineProperty(globalThis, "__DEV__", {
      configurable: true,
      value: development,
      writable: true
    })
  );
}

describe("retrospectiveService", () => {
  it("lists the available periods through the authenticated client", async () => {
    const signal = new AbortController().signal;
    const response = await retrospectiveServiceMock.getAvailablePeriods();
    mockGet.mockResolvedValueOnce(response);

    await expect(createRetrospectiveService().getAvailablePeriods(signal)).resolves.toBe(response);
    expect(mockGet).toHaveBeenCalledWith("/users/me/retrospectives/available", { signal });
  });

  it("asks for a month with its month and for a year without one", async () => {
    const signal = new AbortController().signal;
    const service = createRetrospectiveService();
    const october = await retrospectiveServiceMock.getRetrospective(OCTOBER);
    const year = await retrospectiveServiceMock.getRetrospective(YEAR_2025);
    mockGet.mockResolvedValueOnce(october).mockResolvedValueOnce(year);

    await expect(service.getRetrospective(OCTOBER, signal)).resolves.toBe(october);
    await expect(service.getRetrospective(YEAR_2025, signal)).resolves.toBe(year);
    expect(mockGet).toHaveBeenNthCalledWith(
      1,
      "/users/me/retrospectives?period_type=MONTHLY&year=2026&month=10",
      { signal }
    );
    expect(mockGet).toHaveBeenNthCalledWith(
      2,
      "/users/me/retrospectives?period_type=YEARLY&year=2025",
      { signal }
    );
  });

  it("treats a period without memories (404) as an empty retrospective", async () => {
    mockGet.mockRejectedValueOnce(new ApiError("RETROSPECTIVE_NOT_FOUND", "Empty", 404, null));

    await expect(createRetrospectiveService().getRetrospective(OCTOBER)).resolves.toBeNull();
  });

  it.each([401, 403, 422, 500])("propagates HTTP %s from the details", async (status) => {
    const error = new ApiError("REQUEST_FAILED", "failed", status, null);
    mockGet.mockRejectedValueOnce(error);

    await expect(createRetrospectiveService().getRetrospective(OCTOBER)).rejects.toBe(error);
  });

  it.each([401, 404, 500])("propagates HTTP %s from the period list", async (status) => {
    const error = new ApiError("REQUEST_FAILED", "failed", status, null);
    mockGet.mockRejectedValueOnce(error);

    await expect(createRetrospectiveService().getAvailablePeriods()).rejects.toBe(error);
  });

  it("propagates network failures without switching to the fixtures", async () => {
    const error = new ApiError("NETWORK_ERROR", "offline", 0, null);
    mockGet.mockRejectedValue(error);
    const service = createRetrospectiveService();

    await expect(service.getAvailablePeriods()).rejects.toBe(error);
    await expect(service.getRetrospective(OCTOBER)).rejects.toBe(error);
  });

  it.each<RetrospectivePeriodSelection>([
    { month: 13, period_type: "MONTHLY", year: 2026 },
    { month: 0, period_type: "MONTHLY", year: 2026 },
    { month: null, period_type: "MONTHLY", year: 2026 },
    { month: 10, period_type: "YEARLY", year: 2026 },
    { month: null, period_type: "YEARLY", year: 2026.5 }
  ])("rejects an invalid period before any request: %o", async (period) => {
    await expect(createRetrospectiveService().getRetrospective(period)).rejects.toThrow(RangeError);
    expect(mockGet).not.toHaveBeenCalled();
  });

  it("serves the fixtures without HTTP only when the mock is enabled in development", async () => {
    const service = createRetrospectiveService({ mock: true });

    await expect(service.getAvailablePeriods()).resolves.toEqual(
      await retrospectiveServiceMock.getAvailablePeriods()
    );
    await expect(service.getRetrospective(OCTOBER)).resolves.toMatchObject({ month: 10 });
    expect(mockGet).not.toHaveBeenCalled();
  });

  it("ignores the mock flag in production", async () => {
    mockGet.mockResolvedValueOnce({ periods: [] });

    await withDev(false, async () => {
      await expect(
        createRetrospectiveService({ mock: true }).getAvailablePeriods()
      ).resolves.toEqual({ periods: [] });
    });
    expect(mockGet).toHaveBeenCalledTimes(1);
  });
});

describe("retrospective fixtures", () => {
  it("lists months newest first, each closed year after its months and only one preview", async () => {
    const { periods } = await retrospectiveServiceMock.getAvailablePeriods();

    expect(periods.map((period) => period.label)).toEqual([
      "Novembro 2026",
      "Outubro 2026",
      "Setembro 2026",
      "Julho 2026",
      "Março 2026",
      "Dezembro 2025",
      "Novembro 2025",
      "Ano de 2025"
    ]);
    expect(periods.filter((period) => period.is_preview)).toEqual([
      expect.objectContaining({ month: 11, period_type: "MONTHLY", year: 2026 })
    ]);
    expect(periods.some((period) => period.period_type === "YEARLY" && period.year === 2026)).toBe(
      false
    );

    const year = periods.find((period) => period.period_type === "YEARLY");
    expect(year).toMatchObject({ month: null, total_memories: 9, year: 2025 });
  });

  it("fills the six indicators consistently for every available period", async () => {
    const { periods } = await retrospectiveServiceMock.getAvailablePeriods();

    for (const period of periods) {
      const details = (await retrospectiveServiceMock.getRetrospective(
        period
      )) as RetrospectiveDetailsResponse;

      expect(details).toMatchObject({
        is_preview: period.is_preview,
        label: period.label,
        month: period.month,
        period_type: period.period_type,
        total_recordas: period.total_memories,
        year: period.year
      });
      expect(details.active_days).toBeGreaterThan(0);
      expect(details.active_days).toBeLessThanOrEqual(details.total_recordas);
      expect(details.max_streak).toBeGreaterThan(0);
      expect(details.max_streak).toBeLessThanOrEqual(details.active_days);

      expect(details.top_artists.length).toBeGreaterThan(0);
      expect(details.top_artists.length).toBeLessThanOrEqual(5);
      const artistCounts = details.top_artists.map((artist) => artist.memory_count);
      expect(artistCounts).toEqual([...artistCounts].sort((a, b) => b - a));

      expect(details.top_genres.reduce((sum, genre) => sum + genre.percentage, 0)).toBe(100);
      expect(details.top_genres.reduce((sum, genre) => sum + genre.count, 0)).toBe(
        details.total_recordas
      );

      const tagCounts = details.tagged_users.map((user) => user.tag_count);
      expect(tagCounts).toEqual([...tagCounts].sort((a, b) => b - a));

      expect(details.engagement.likes_received).toBeGreaterThan(0);
      expect(details.engagement.comments_received).toBeGreaterThan(0);

      expect(details.featured_song?.song_preview_url).toBe(
        `/api/v1/music/tracks/${details.featured_song?.deezer_track_id}/preview`
      );
    }
  });

  it("builds October 2026 from its own memories", async () => {
    const october = (await retrospectiveServiceMock.getRetrospective(
      OCTOBER
    )) as RetrospectiveDetailsResponse;

    expect(october.top_artists.slice(0, 2)).toEqual([
      expect.objectContaining({ artist_name: "Coldplay", memory_count: 3 }),
      expect.objectContaining({ artist_name: "Marisa Monte", memory_count: 3 })
    ]);
    expect(october.top_genres[0]).toEqual({ count: 5, genre_name: "Rock", percentage: 42 });
    expect(october.tagged_users.map((user) => user.username)).toEqual([
      "pedro",
      "ana",
      "marina",
      "lucas"
    ]);
    expect(october.featured_song).toMatchObject({ memory_count: 3, song_title: "Ainda Bem" });
    expect(october.engagement).toEqual({ comments_received: 13, likes_received: 47 });
    expect(october.max_streak).toBe(4);
  });

  it("returns null for periods without memories or still open years", async () => {
    await expect(
      retrospectiveServiceMock.getRetrospective({ month: 8, period_type: "MONTHLY", year: 2026 })
    ).resolves.toBeNull();
    await expect(
      retrospectiveServiceMock.getRetrospective({ month: null, period_type: "YEARLY", year: 2026 })
    ).resolves.toBeNull();
  });

  it("returns a fresh copy on every call", async () => {
    const first = (await retrospectiveServiceMock.getRetrospective(
      OCTOBER
    )) as RetrospectiveDetailsResponse;
    first.top_artists[0].memory_count = 999;
    first.tagged_users.pop();

    const second = (await retrospectiveServiceMock.getRetrospective(
      OCTOBER
    )) as RetrospectiveDetailsResponse;
    expect(second.top_artists[0].memory_count).toBe(3);
    expect(second.tagged_users).toHaveLength(4);
  });

  it("stops when the request was cancelled", async () => {
    const controller = new AbortController();
    controller.abort();

    await expect(retrospectiveServiceMock.getAvailablePeriods(controller.signal)).rejects.toThrow(
      expect.objectContaining({ name: "AbortError" })
    );
    await expect(
      retrospectiveServiceMock.getRetrospective(OCTOBER, controller.signal)
    ).rejects.toThrow(expect.objectContaining({ name: "AbortError" }));
  });
});

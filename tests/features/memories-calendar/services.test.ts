import { createMemoryCalendarService } from "@/features/memories-calendar/services/memoryCalendarService";
import { memoryCalendarMock } from "@/features/memories-calendar/mocks/memoryCalendarMock";
import { authApiClient } from "@/services/api";
import { ApiError } from "@/services/api/errors";

jest.mock("@/services/api", () => ({ authApiClient: { get: jest.fn() } }));
const get = jest.mocked(authApiClient.get);
beforeEach(() => get.mockReset());

it("requests month and day through the authenticated client with cancellation", async () => {
  const service = createMemoryCalendarService();
  const signal = new AbortController().signal;
  const month = await memoryCalendarMock.getMonthCalendar(2026, 10);
  const day = await memoryCalendarMock.getDayMemories("2026-10-03");
  get.mockResolvedValueOnce(month).mockResolvedValueOnce(day);
  await expect(service.getMonthCalendar(2026, 10, signal)).resolves.toEqual(month);
  await expect(service.getDayMemories(day.date, signal)).resolves.toEqual(day);
  expect(get).toHaveBeenNthCalledWith(1, "/users/me/calendar?year=2026&month=10", {
    signal
  });
  expect(get).toHaveBeenNthCalledWith(2, "/users/me/calendar/day?date=2026-10-03", { signal });
});
it("uses explicit mocks without HTTP and keeps month and daily details consistent", async () => {
  const service = createMemoryCalendarService({ mock: true });
  const month = await service.getMonthCalendar(2026, 10);
  expect(month.active_days_count).toBe(month.days.length);
  expect(month.total_memories).toBe(month.days.reduce((sum, day) => sum + day.count, 0));
  expect(month.days.some((day) => day.count > 1)).toBe(true);
  for (const summary of month.days) {
    const day = await service.getDayMemories(summary.date);
    expect(day.total_count).toBe(summary.count);
    expect(day.memories[0].recorda_id).toBe(summary.first_recorda_id);
    expect(day.memories[0].thumbnail_url).toBe(summary.thumbnail_url);
    expect(day.memories[0].song_preview_url).toContain("/api/v1/music/tracks/");
  }
  expect(get).not.toHaveBeenCalled();
});
it("returns isolated fixtures and navigation across months and empty days", async () => {
  const first = await memoryCalendarMock.getDayMemories("2026-10-01");
  expect(first.previous_date_with_memories).toBe("2026-09-30");
  first.memories[0].comments[0].content = "changed";
  expect(
    (await memoryCalendarMock.getDayMemories(first.date)).memories[0].comments[0].content
  ).not.toBe("changed");
  expect((await memoryCalendarMock.getDayMemories("2026-10-29")).next_date_with_memories).toBe(
    "2026-11-02"
  );
  expect((await memoryCalendarMock.getDayMemories("2026-10-02")).total_count).toBe(0);
  expect((await memoryCalendarMock.getMonthCalendar(2025, 1)).days).toEqual([]);
  expect(
    (await memoryCalendarMock.getDayMemories("2026-09-30")).previous_date_with_memories
  ).toBeNull();
  expect(
    (await memoryCalendarMock.getDayMemories("2026-11-02")).next_date_with_memories
  ).toBeNull();
});
it("falls back only when explicitly enabled for network errors", async () => {
  const error = new ApiError("NETWORK_ERROR", "offline", 0, null);
  get.mockRejectedValue(error);
  await expect(createMemoryCalendarService().getDayMemories("2026-10-03")).rejects.toBe(error);
  await expect(
    createMemoryCalendarService({ fallbackToMock: true }).getDayMemories("2026-10-03")
  ).resolves.toMatchObject({ total_count: 3 });
});
it.each([401, 403, 404, 500, 408])("propagates HTTP %s even with fallback", async (status) => {
  const error = new ApiError("REQUEST_FAILED", "failed", status, null);
  get.mockRejectedValue(error);
  await expect(
    createMemoryCalendarService({ fallbackToMock: true }).getMonthCalendar(2026, 10)
  ).rejects.toBe(error);
});
it("rejects invalid inputs before HTTP and respects cancellation in mock mode", async () => {
  const service = createMemoryCalendarService({ mock: true });
  await expect(service.getMonthCalendar(2026, 13)).rejects.toBeInstanceOf(RangeError);
  await expect(service.getDayMemories("2026-02-29")).rejects.toBeInstanceOf(RangeError);
  const controller = new AbortController();
  controller.abort();
  await expect(service.getDayMemories("2026-10-01", controller.signal)).rejects.toMatchObject({
    name: "AbortError"
  });
  expect(get).not.toHaveBeenCalled();
});
it("does not turn an aborted live request into mock data", async () => {
  const controller = new AbortController();
  get.mockImplementationOnce(async () => {
    controller.abort();
    throw new ApiError("NETWORK_ERROR", "offline", 0, null);
  });
  await expect(
    createMemoryCalendarService({ fallbackToMock: true }).getDayMemories(
      "2026-10-01",
      controller.signal
    )
  ).rejects.toMatchObject({ name: "AbortError" });
});

it("ignores mock and fallback flags in production", async () => {
  const development = __DEV__;
  Object.defineProperty(globalThis, "__DEV__", {
    value: false,
    configurable: true,
    writable: true
  });
  try {
    const service = createMemoryCalendarService({ mock: true, fallbackToMock: true });
    const error = new ApiError("NETWORK_ERROR", "offline", 0, null);
    get.mockRejectedValueOnce(error);
    await expect(service.getDayMemories("2026-10-03")).rejects.toBe(error);
    expect(get).toHaveBeenCalledTimes(1);
  } finally {
    Object.defineProperty(globalThis, "__DEV__", {
      value: development,
      configurable: true,
      writable: true
    });
  }
});
it("keeps mock times chronological and includes both media types in the mosaic", async () => {
  const month = await memoryCalendarMock.getMonthCalendar(2026, 10);
  expect(new Set(month.days.map((day) => day.media_type))).toEqual(new Set(["PHOTO", "VIDEO"]));
  for (const summary of month.days) {
    const { memories } = await memoryCalendarMock.getDayMemories(summary.date);
    const times = memories.map((memory) => Date.parse(memory.created_at));
    expect(times).toEqual([...times].sort((a, b) => a - b));
    for (const memory of memories) {
      expect(memory.comments_count).toBe(memory.comments.length);
      expect(memory.formatted_time).toBe(memory.created_at.slice(11, 16));
    }
  }
});

it.each([
  "",
  "2026-2-01",
  "2026-02-30",
  "2026-00-01",
  "2026-13-01",
  "2026-01-00",
  "2026-01-32",
  "0000-01-01",
  "1900-02-29"
])("rejects noncanonical or impossible calendar date %s before requesting data", async (date) => {
  await expect(createMemoryCalendarService().getDayMemories(date)).rejects.toBeInstanceOf(
    RangeError
  );
  expect(get).not.toHaveBeenCalled();
});
it.each(["2000-02-29", "2024-02-29", "2026-04-30", "2026-12-31"])(
  "accepts valid calendar boundary %s",
  async (date) => {
    await expect(memoryCalendarMock.getDayMemories(date)).resolves.toMatchObject({ date });
  }
);

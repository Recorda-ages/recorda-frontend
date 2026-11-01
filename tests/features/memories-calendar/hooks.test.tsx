import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import { useMemoryCalendar } from "@/features/memories-calendar/hooks/useMemoryCalendar";
import { useDayMemories } from "@/features/memories-calendar/hooks/useDayMemories";
import { memoryCalendarService } from "@/features/memories-calendar/services/memoryCalendarService";
import { memoryCalendarMock } from "@/features/memories-calendar/mocks/memoryCalendarMock";
import {
  dayMemoriesQueryKey,
  monthCalendarQueryKey,
  invalidateMemoryCalendar
} from "@/features/memories-calendar/queryKeys";

jest.mock("@/features/memories-calendar/services/memoryCalendarService", () => ({
  memoryCalendarService: { getMonthCalendar: jest.fn(), getDayMemories: jest.fn() }
}));
const month = jest.mocked(memoryCalendarService.getMonthCalendar);
const day = jest.mocked(memoryCalendarService.getDayMemories);
const clients: QueryClient[] = [];
function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  clients.push(client);
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { client, wrapper };
}
beforeEach(() => {
  month.mockReset().mockImplementation(memoryCalendarMock.getMonthCalendar);
  day.mockReset().mockImplementation(memoryCalendarMock.getDayMemories);
});
afterEach(() => {
  clients.forEach((client) => client.clear());
  clients.length = 0;
});

it("loads both resources, exposes data and caches them for five minutes", async () => {
  const { client, wrapper } = setup();
  const { result, unmount } = renderHook(
    () => ({ month: useMemoryCalendar(2026, 10), day: useDayMemories("2026-10-03") }),
    { wrapper }
  );
  expect(result.current.month.isLoading).toBe(true);
  await waitFor(() => expect(result.current.day.isSuccess).toBe(true));
  expect(result.current.month.data?.active_days_count).toBe(5);
  expect(result.current.day.data?.total_count).toBe(3);
  expect(month).toHaveBeenCalledWith(2026, 10, expect.any(AbortSignal));
  expect(day).toHaveBeenCalledWith("2026-10-03", expect.any(AbortSignal));
  const query = client.getQueryCache().find({ queryKey: monthCalendarQueryKey(2026, 10) });
  expect(query?.gcTime).toBe(300000);
  unmount();
  const second = renderHook(() => useMemoryCalendar(2026, 10), { wrapper });
  expect(second.result.current.isSuccess).toBe(true);
  expect(month).toHaveBeenCalledTimes(1);
});
it("keeps invalid input idle", () => {
  const { wrapper } = setup();
  const { result } = renderHook(
    () => ({ month: useMemoryCalendar(2026, 0), day: useDayMemories("2026-02-30") }),
    { wrapper }
  );
  expect(result.current.month.fetchStatus).toBe("idle");
  expect(result.current.day.fetchStatus).toBe("idle");
  expect(month).not.toHaveBeenCalled();
  expect(day).not.toHaveBeenCalled();
});
it("exposes errors from either resource", async () => {
  const error = new Error("offline");
  month.mockRejectedValue(error);
  day.mockRejectedValue(error);
  const { wrapper } = setup();
  const { result } = renderHook(
    () => ({ month: useMemoryCalendar(2026, 10), day: useDayMemories("2026-10-03") }),
    { wrapper }
  );
  await waitFor(() =>
    expect(result.current.month.isError && result.current.day.isError).toBe(true)
  );
  expect(result.current.day.error).toBe(error);
});
it("refetches active calendars on invalidation without invalidating unrelated data", async () => {
  const { client, wrapper } = setup();
  client.setQueryData(["unrelated"], "keep");
  const { result } = renderHook(
    () => ({ month: useMemoryCalendar(2026, 10), day: useDayMemories("2026-10-03") }),
    { wrapper }
  );
  await waitFor(() => expect(result.current.day.isSuccess).toBe(true));
  await act(async () => {
    await invalidateMemoryCalendar(client);
  });
  expect(month).toHaveBeenCalledTimes(2);
  expect(day).toHaveBeenCalledTimes(2);
  expect(client.getQueryState(["unrelated"])?.isInvalidated).toBe(false);
});
it("separates months and dates in cache", async () => {
  const { client, wrapper } = setup();
  const { result, rerender } = renderHook(
    ({ date, monthNumber }: { date: string; monthNumber: number }) => ({
      month: useMemoryCalendar(2026, monthNumber),
      day: useDayMemories(date)
    }),
    { wrapper, initialProps: { date: "2026-10-03", monthNumber: 10 } }
  );
  await waitFor(() => expect(result.current.day.isSuccess).toBe(true));
  rerender({ date: "2026-11-02", monthNumber: 11 });
  await waitFor(() => expect(result.current.day.data?.date).toBe("2026-11-02"));
  expect(client.getQueryData(dayMemoriesQueryKey("2026-10-03"))).toBeDefined();
  expect(client.getQueryData(monthCalendarQueryKey(2026, 10))).toBeDefined();
});

it("refetches after five minutes of freshness and collects inactive data after five minutes", async () => {
  jest.useFakeTimers();
  try {
    const { client, wrapper } = setup();
    const first = renderHook(() => useDayMemories("2026-10-03"), { wrapper });
    await waitFor(() => expect(first.result.current.isSuccess).toBe(true));
    act(() => {
      jest.advanceTimersByTime(300001);
    });
    first.unmount();
    const second = renderHook(() => useDayMemories("2026-10-03"), { wrapper });
    await waitFor(() => expect(day).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(second.result.current.isFetching).toBe(false));
    second.unmount();
    act(() => {
      jest.advanceTimersByTime(299999);
    });
    expect(client.getQueryData(dayMemoriesQueryKey("2026-10-03"))).toBeDefined();
    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(client.getQueryData(dayMemoriesQueryKey("2026-10-03"))).toBeUndefined();
  } finally {
    jest.useRealTimers();
  }
});

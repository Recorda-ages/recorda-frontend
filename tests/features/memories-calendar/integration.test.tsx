import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react-native";

import { useMemoryCalendar } from "@/features/memories-calendar/hooks/useMemoryCalendar";
import { useDayMemories } from "@/features/memories-calendar/hooks/useDayMemories";
import { createMemoryCalendarService } from "@/features/memories-calendar/services/memoryCalendarService";
import { memoryCalendarMock } from "@/features/memories-calendar/mocks/memoryCalendarMock";
import { secureStorage } from "@/services/storage";
import { buildApiUrl } from "@/services/api/client";

// Load the actual singleton with the same configuration used by Expo development.
// Only configuration is changed: the hooks and both service adapters remain real.
jest.mock("@/features/memories-calendar/services/memoryCalendarService", () => {
  const previous = process.env.EXPO_PUBLIC_MEMORY_CALENDAR_MOCK;
  process.env.EXPO_PUBLIC_MEMORY_CALENDAR_MOCK = "true";
  try {
    return jest.requireActual("@/features/memories-calendar/services/memoryCalendarService");
  } finally {
    if (previous === undefined) delete process.env.EXPO_PUBLIC_MEMORY_CALENDAR_MOCK;
    else process.env.EXPO_PUBLIC_MEMORY_CALENDAR_MOCK = previous;
  }
});
jest.mock("@/services/storage", () => ({
  secureStorage: { getItem: jest.fn(), setItem: jest.fn(), removeItem: jest.fn() }
}));

beforeEach(() => jest.clearAllMocks());
afterEach(() => jest.restoreAllMocks());

it("loads both real hooks through the environment-configured singleton without HTTP or credentials", async () => {
  const fetch = jest.spyOn(globalThis, "fetch").mockRejectedValue(new Error("No backend running"));
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const { result, unmount } = renderHook(
    () => ({
      month: useMemoryCalendar(2026, 10),
      day: useDayMemories("2026-10-03")
    }),
    { wrapper }
  );
  try {
    await waitFor(() =>
      expect(result.current.month.isSuccess && result.current.day.isSuccess).toBe(true)
    );
    expect(result.current.month.data?.total_memories).toBe(11);
    expect(result.current.day.data?.memories).toHaveLength(3);
    expect(fetch).not.toHaveBeenCalled();
    expect(secureStorage.getItem).not.toHaveBeenCalled();
  } finally {
    unmount();
    client.clear();
  }
});

it("uses the real authenticated client and API version prefix when requesting live data", async () => {
  const payload = await memoryCalendarMock.getMonthCalendar(2026, 10);
  jest.mocked(secureStorage.getItem).mockResolvedValueOnce("calendar-token");
  const fetch = jest.spyOn(globalThis, "fetch").mockResolvedValue({
    ok: true,
    status: 200,
    headers: new Headers({ "Content-Type": "application/json" }),
    json: async () => payload
  } as Response);
  await expect(createMemoryCalendarService().getMonthCalendar(2026, 10)).resolves.toEqual(payload);
  expect(fetch).toHaveBeenCalledWith(
    buildApiUrl("/users/me/calendar?year=2026&month=10"),
    expect.objectContaining({
      method: "GET",
      headers: expect.objectContaining({ Authorization: "Bearer calendar-token" })
    })
  );
});

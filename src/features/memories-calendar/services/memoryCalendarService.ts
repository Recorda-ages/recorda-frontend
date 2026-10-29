import { authApiClient } from "@/services/api";
import { ApiError } from "@/services/api/errors";
import { memoryCalendarMock } from "../mocks/memoryCalendarMock";
import type {
  DailyMemoriesResponse,
  MemoryCalendarService,
  MonthlyCalendarResponse
} from "../types";
import { assertDate, assertMonth, throwIfAborted } from "../validation";

// Routes defined by backend issues #144 (month) and #145 (day).
const apiAdapter: MemoryCalendarService = {
  getMonthCalendar: (year, month, signal) =>
    authApiClient.get<MonthlyCalendarResponse>(`/users/me/calendar?year=${year}&month=${month}`, {
      signal
    }),
  getDayMemories: (date, signal) =>
    authApiClient.get<DailyMemoriesResponse>(
      `/users/me/calendar/day?date=${encodeURIComponent(date)}`,
      { signal }
    )
};
type Options = { mock?: boolean; fallbackToMock?: boolean };
export function createMemoryCalendarService(options: Options = {}): MemoryCalendarService {
  async function read<T>(
    live: () => Promise<T>,
    mock: () => Promise<T>,
    signal?: AbortSignal
  ): Promise<T> {
    throwIfAborted(signal);
    if (__DEV__ && options.mock) return mock();
    try {
      return await live();
    } catch (error) {
      throwIfAborted(signal);
      if (
        __DEV__ &&
        options.fallbackToMock &&
        error instanceof ApiError &&
        error.code === "NETWORK_ERROR"
      )
        return mock();
      throw error;
    }
  }
  return {
    async getMonthCalendar(year, month, signal) {
      assertMonth(year, month);
      return read(
        () => apiAdapter.getMonthCalendar(year, month, signal),
        () => memoryCalendarMock.getMonthCalendar(year, month, signal),
        signal
      );
    },
    async getDayMemories(date, signal) {
      assertDate(date);
      return read(
        () => apiAdapter.getDayMemories(date, signal),
        () => memoryCalendarMock.getDayMemories(date, signal),
        signal
      );
    }
  };
}
export const memoryCalendarService = createMemoryCalendarService({
  mock: process.env.EXPO_PUBLIC_MEMORY_CALENDAR_MOCK === "true",
  fallbackToMock: process.env.EXPO_PUBLIC_MEMORY_CALENDAR_MOCK_FALLBACK === "true"
});

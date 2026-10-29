import type { QueryClient } from "@tanstack/react-query";

export const MEMORY_CALENDAR_QUERY_KEY = ["memories-calendar"] as const;
export const MEMORY_CALENDAR_CACHE_TIME = 5 * 60 * 1000;
export const monthCalendarQueryKey = (year: number, month: number) =>
  [...MEMORY_CALENDAR_QUERY_KEY, "month", year, month] as const;
export const dayMemoriesQueryKey = (date: string) =>
  [...MEMORY_CALENDAR_QUERY_KEY, "day", date] as const;

// All daily navigation links may change after publishing/deleting a memory.
export function invalidateMemoryCalendar(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: MEMORY_CALENDAR_QUERY_KEY });
}

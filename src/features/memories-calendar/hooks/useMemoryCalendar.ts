import { useQuery } from "@tanstack/react-query";

import { monthCalendarQueryKey, MEMORY_CALENDAR_CACHE_TIME } from "../queryKeys";
import { memoryCalendarService } from "../services/memoryCalendarService";
import { isValidMonth } from "../validation";

export function useMemoryCalendar(year: number, month: number, userId?: string) {
  return useQuery({
    queryKey: monthCalendarQueryKey(year, month, userId),
    queryFn: ({ signal }) => memoryCalendarService.getMonthCalendar(year, month, signal, userId),
    enabled: isValidMonth(year, month),
    staleTime: MEMORY_CALENDAR_CACHE_TIME,
    gcTime: MEMORY_CALENDAR_CACHE_TIME
  });
}

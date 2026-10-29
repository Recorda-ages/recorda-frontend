import { useQuery } from "@tanstack/react-query";
import { monthCalendarQueryKey, MEMORY_CALENDAR_CACHE_TIME } from "../queryKeys";
import { memoryCalendarService } from "../services/memoryCalendarService";
import { isValidMonth } from "../validation";

export function useMemoryCalendar(year: number, month: number) {
  return useQuery({
    queryKey: monthCalendarQueryKey(year, month),
    queryFn: ({ signal }) => memoryCalendarService.getMonthCalendar(year, month, signal),
    enabled: isValidMonth(year, month),
    staleTime: MEMORY_CALENDAR_CACHE_TIME,
    gcTime: MEMORY_CALENDAR_CACHE_TIME
  });
}

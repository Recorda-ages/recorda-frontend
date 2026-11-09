import { useQuery } from "@tanstack/react-query";

import { dayMemoriesQueryKey, MEMORY_CALENDAR_CACHE_TIME } from "../queryKeys";
import { memoryCalendarService } from "../services/memoryCalendarService";
import { isValidDate } from "../validation";

export function useDayMemories(date: string, userId?: string) {
  return useQuery({
    queryKey: dayMemoriesQueryKey(date, userId),
    queryFn: ({ signal }) => memoryCalendarService.getDayMemories(date, signal, userId),
    enabled: isValidDate(date),
    staleTime: MEMORY_CALENDAR_CACHE_TIME,
    gcTime: MEMORY_CALENDAR_CACHE_TIME
  });
}

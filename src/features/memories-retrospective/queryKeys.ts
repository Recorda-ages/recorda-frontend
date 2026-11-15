import type { QueryClient } from "@tanstack/react-query";

import type { RetrospectivePeriodSelection } from "./types";

export const RETROSPECTIVE_QUERY_KEY = ["memories-retrospective"] as const;
export const RETROSPECTIVE_CACHE_TIME = 5 * 60 * 1000;

export const retrospectivePeriodsQueryKey = (userId: string | null) =>
  [...RETROSPECTIVE_QUERY_KEY, "periods", userId] as const;

export const retrospectiveDetailsQueryKey = (
  userId: string | null,
  period: RetrospectivePeriodSelection
) =>
  [
    ...RETROSPECTIVE_QUERY_KEY,
    "details",
    userId,
    period.period_type,
    period.year,
    period.month
  ] as const;

export function invalidateRetrospectives(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: RETROSPECTIVE_QUERY_KEY });
}

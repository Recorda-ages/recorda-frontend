import { useQuery } from "@tanstack/react-query";

import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";

import { RETROSPECTIVE_CACHE_TIME, retrospectiveDetailsQueryKey } from "../queryKeys";
import { retrospectiveService } from "../services/retrospectiveService";
import type { RetrospectivePeriodSelection } from "../types";
import { isValidRetrospectivePeriod } from "../validation";
import { shouldRetryRetrospective } from "./shouldRetryRetrospective";

const IDLE_PERIOD: RetrospectivePeriodSelection = {
  month: null,
  period_type: "YEARLY",
  year: 0
};

export function useRetrospective(period: RetrospectivePeriodSelection | null) {
  const currentUser = useCurrentUser();
  const selected = period ?? IDLE_PERIOD;
  const isSelected = period !== null && isValidRetrospectivePeriod(period);

  const query = useQuery({
    enabled: Boolean(currentUser) && isSelected,
    gcTime: RETROSPECTIVE_CACHE_TIME,
    queryFn: ({ signal }) => retrospectiveService.getRetrospective(selected, signal),
    queryKey: retrospectiveDetailsQueryKey(currentUser?.user_id ?? null, selected),
    retry: shouldRetryRetrospective,
    staleTime: RETROSPECTIVE_CACHE_TIME
  });

  return {
    ...query,
    isEmpty: query.isSuccess && query.data === null
  };
}

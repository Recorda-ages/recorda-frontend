import { useQuery } from "@tanstack/react-query";

import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";

import { RETROSPECTIVE_CACHE_TIME, retrospectivePeriodsQueryKey } from "../queryKeys";
import { retrospectiveService } from "../services/retrospectiveService";
import { shouldRetryRetrospective } from "./shouldRetryRetrospective";

export function useRetrospectivePeriods() {
  const currentUser = useCurrentUser();

  const query = useQuery({
    enabled: Boolean(currentUser),
    gcTime: RETROSPECTIVE_CACHE_TIME,
    queryFn: ({ signal }) => retrospectiveService.getAvailablePeriods(signal),
    queryKey: retrospectivePeriodsQueryKey(currentUser?.user_id ?? null),
    retry: shouldRetryRetrospective,
    staleTime: RETROSPECTIVE_CACHE_TIME
  });

  return {
    ...query,
    isEmpty: query.isSuccess && query.data.periods.length === 0
  };
}

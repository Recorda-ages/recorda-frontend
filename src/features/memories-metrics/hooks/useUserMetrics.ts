import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { ApiError } from "@/services/api";

import { profileMetricsQueryKey } from "../queryKeys";
import { userMetricsService } from "../services/userMetricsService";

/** Metrics of the signed-in user, or of another user when `userId` is given. */
export function useUserMetrics(period: string, userId?: string) {
  const currentUser = useCurrentUser();
  const { t } = useTranslation();
  const targetUserId = userId ?? currentUser?.user_id ?? null;
  const query = useQuery({
    queryKey: profileMetricsQueryKey(targetUserId, period),
    queryFn: ({ signal }) => userMetricsService.getProfileMetrics(period, signal, userId),
    enabled: Boolean(currentUser),
    placeholderData: (previous, previousQuery) =>
      previousQuery?.queryKey[2] === targetUserId ? previous : undefined,
    retry: (failureCount, error) =>
      !(error instanceof ApiError && (error.status === 401 || error.status === 403)) &&
      failureCount < 1
  });

  return {
    ...query,
    errorMessage: query.isError
      ? t(userId ? "memoriesMetrics.loadErrorOther" : "memoriesMetrics.loadError")
      : null
  };
}

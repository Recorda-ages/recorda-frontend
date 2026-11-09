import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { ApiError } from "@/services/api";

import { profileMetricsQueryKey } from "../queryKeys";
import { userMetricsService } from "../services/userMetricsService";

export function useUserMetrics(period: string) {
  const currentUser = useCurrentUser();
  const { t } = useTranslation();
  const query = useQuery({
    queryKey: profileMetricsQueryKey(currentUser?.user_id ?? null, period),
    queryFn: ({ signal }) => userMetricsService.getProfileMetrics(period, signal),
    enabled: Boolean(currentUser),
    placeholderData: (previous, previousQuery) =>
      previousQuery?.queryKey[2] === currentUser?.user_id ? previous : undefined,
    retry: (failureCount, error) =>
      !(error instanceof ApiError && (error.status === 401 || error.status === 403)) &&
      failureCount < 1
  });

  return {
    ...query,
    errorMessage: query.isError ? t("memoriesMetrics.loadError") : null
  };
}

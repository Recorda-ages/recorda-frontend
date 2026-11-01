export const USER_METRICS_QUERY_KEY = ["user-metrics"] as const;

export const profileMetricsQueryKey = (userId: string | null, period: string) =>
  [...USER_METRICS_QUERY_KEY, "profile", userId, period] as const;

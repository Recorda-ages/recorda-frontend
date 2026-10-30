import { authApiClient } from "@/services/api";

import type { ProfileMetricsResponse } from "../types";

export const userMetricsService = {
  getProfileMetrics: (period: string, signal?: AbortSignal) =>
    authApiClient.get<ProfileMetricsResponse>(
      `/users/me/metrics?bundle=profile&period=${encodeURIComponent(period)}`,
      { signal }
    )
};

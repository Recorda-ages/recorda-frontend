import { authApiClient } from "@/services/api";

import { userMetricsServiceMock } from "../mocks/metricsMock";
import type { ProfileMetricsResponse, UserMetricsService } from "../types";

const apiService: UserMetricsService = {
  getProfileMetrics: (period, signal, userId) =>
    authApiClient.get<ProfileMetricsResponse>(
      `/users/${userId ? encodeURIComponent(userId) : "me"}/metrics?bundle=profile&period=${encodeURIComponent(period)}`,
      { signal }
    )
};

type Options = { mock?: boolean };

// The fixtures are opt-in and development-only: API failures never switch to them.
export function createUserMetricsService(options: Options = {}): UserMetricsService {
  return __DEV__ && options.mock ? userMetricsServiceMock : apiService;
}

export const userMetricsService = createUserMetricsService({
  mock: process.env.EXPO_PUBLIC_MEMORY_METRICS_MOCK === "true"
});

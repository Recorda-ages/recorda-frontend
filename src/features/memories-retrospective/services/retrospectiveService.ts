import { ApiError, authApiClient } from "@/services/api";

import { retrospectiveServiceMock } from "../mocks/retrospectiveMock";
import type {
  AvailableRetrospectivesResponse,
  RetrospectiveDetailsResponse,
  RetrospectiveService
} from "../types";
import { assertRetrospectivePeriod, toRetrospectiveQuery } from "../validation";

const apiService: RetrospectiveService = {
  getAvailablePeriods: (signal) =>
    authApiClient.get<AvailableRetrospectivesResponse>("/users/me/retrospectives/available", {
      signal
    }),
  async getRetrospective(period, signal) {
    assertRetrospectivePeriod(period);

    try {
      return await authApiClient.get<RetrospectiveDetailsResponse>(
        `/users/me/retrospectives?${toRetrospectiveQuery(period)}`,
        { signal }
      );
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return null;
      throw error;
    }
  }
};

type Options = { mock?: boolean };

export function createRetrospectiveService(options: Options = {}): RetrospectiveService {
  return __DEV__ && options.mock ? retrospectiveServiceMock : apiService;
}

export const retrospectiveService = createRetrospectiveService({
  mock: process.env.EXPO_PUBLIC_MEMORY_RETROSPECTIVE_MOCK === "true"
});

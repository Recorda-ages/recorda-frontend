import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react-native";
import React from "react";

import { AUTH_ME_QUERY_KEY } from "@/features/auth/api/getCurrentUser";
import { useUserMetrics } from "@/features/memories-metrics/hooks/useUserMetrics";
import {
  emptyProfileMetricsMock,
  profileMetricsMock,
  userMetricsServiceMock
} from "@/features/memories-metrics/mocks/metricsMock";
import { userMetricsService } from "@/features/memories-metrics/services/userMetricsService";
import type { ProfileMetricsResponse } from "@/features/memories-metrics/types";
import { i18n } from "@/i18n";
import { ApiError, authApiClient } from "@/services/api";

jest.mock("@/services/api", () => ({
  ...jest.requireActual("@/services/api"),
  authApiClient: { get: jest.fn() }
}));

const mockGet = jest.mocked(authApiClient.get);
let client: QueryClient;

function wrapper({ children }: { children: React.ReactNode }) {
  return React.createElement(QueryClientProvider, { client }, children);
}

beforeEach(() => {
  mockGet.mockReset();
  client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  client.setQueryData(AUTH_ME_QUERY_KEY, { user_id: "user-1" });
});

afterEach(() => {
  cleanup();
  client.clear();
});

describe("userMetricsService", () => {
  it("requests the profile bundle with an encoded period and cancellation", async () => {
    const controller = new AbortController();
    mockGet.mockResolvedValueOnce(profileMetricsMock);
    await expect(
      userMetricsService.getProfileMetrics("30 days&bundle=other", controller.signal)
    ).resolves.toEqual(profileMetricsMock);
    expect(mockGet).toHaveBeenCalledWith(
      "/users/me/metrics?bundle=profile&period=30%20days%26bundle%3Dother",
      { signal: controller.signal }
    );
  });

  it("propagates API failures without falling back to fixtures", async () => {
    const error = new ApiError("UNAVAILABLE", "Internal details", 503, null);
    mockGet.mockRejectedValueOnce(error);
    await expect(userMetricsService.getProfileMetrics("30d")).rejects.toBe(error);
  });
});

describe("metrics fixtures", () => {
  it("provides realistic profile data and an explicit empty scenario", () => {
    expect(profileMetricsMock.top_artist?.memory_count).toBeGreaterThan(0);
    expect(profileMetricsMock.top_genres.reduce((sum, genre) => sum + genre.percentage, 0)).toBe(
      100
    );
    expect(profileMetricsMock.streak.current_streak_days).toBeGreaterThan(0);
    expect(emptyProfileMetricsMock).toMatchObject({
      top_artist: null,
      top_genres: [],
      streak: { current_streak_days: 0, last_post_date: null }
    });
  });

  it("returns typed independent mock responses for the requested period", async () => {
    const first: ProfileMetricsResponse = await userMetricsServiceMock.getProfileMetrics("7d");
    first.top_genres[0].count = 999;
    const second = await userMetricsServiceMock.getProfileMetrics("30d");
    expect(first.period).toBe("7d");
    expect(second.period).toBe("30d");
    expect(second.top_genres[0].count).not.toBe(999);
    expect(profileMetricsMock.top_genres[0].count).not.toBe(999);
  });
});

describe("useUserMetrics", () => {
  it("exposes initial loading then profile data", async () => {
    mockGet.mockResolvedValueOnce(profileMetricsMock);
    const { result } = renderHook(() => useUserMetrics("30d"), { wrapper });
    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(profileMetricsMock);
    expect(result.current.errorMessage).toBeNull();
  });

  it("changes period, cancels the old request and caches each period separately", async () => {
    mockGet.mockImplementationOnce(() => new Promise(() => {}));
    const { result, rerender } = renderHook(
      ({ period }: { period: string }) => useUserMetrics(period),
      {
        initialProps: { period: "7d" },
        wrapper
      }
    );
    const signal = mockGet.mock.calls[0][1]?.signal;
    mockGet.mockResolvedValueOnce(profileMetricsMock);
    rerender({ period: "30d" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(signal?.aborted).toBe(true);
    expect(mockGet).toHaveBeenLastCalledWith("/users/me/metrics?bundle=profile&period=30d", {
      signal: expect.any(AbortSignal)
    });
    expect(client.getQueryData(["user-metrics", "profile", "user-1", "30d"])).toEqual(
      profileMetricsMock
    );
    expect(client.getQueryData(["user-metrics", "profile", "user-1", "7d"])).toBeUndefined();
  });

  it("retains data while refetching", async () => {
    mockGet.mockResolvedValueOnce(profileMetricsMock);
    const { result } = renderHook(() => useUserMetrics("30d"), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    let resolve!: (value: ProfileMetricsResponse) => void;
    mockGet.mockReturnValueOnce(
      new Promise((done) => {
        resolve = done;
      })
    );
    act(() => {
      void result.current.refetch();
    });
    await waitFor(() => expect(result.current.isRefetching).toBe(true));
    expect(result.current.data).toEqual(profileMetricsMock);
    await act(async () => resolve(emptyProfileMetricsMock));
    await waitFor(() => expect(result.current.isRefetching).toBe(false));
    expect(result.current.data?.top_artist).toBeNull();
  });

  it.each(["pt-BR", "en", "es"])("provides a friendly localized error in %s", async (language) => {
    await i18n.changeLanguage(language);
    const error = new ApiError("UNAVAILABLE", "Internal details", 503, null);
    mockGet.mockRejectedValue(error);
    const { result } = renderHook(() => useUserMetrics("30d"), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 3000 });
    expect(result.current.error).toBe(error);
    expect(result.current.errorMessage).toBe(i18n.t("memoriesMetrics.loadError"));
    expect(result.current.errorMessage).not.toContain("Internal details");
  });

  it("does not request metrics without a current user", () => {
    client.removeQueries({ queryKey: AUTH_ME_QUERY_KEY });
    const { result } = renderHook(() => useUserMetrics("30d"), { wrapper });
    expect(result.current.fetchStatus).toBe("idle");
    expect(mockGet).not.toHaveBeenCalled();
  });

  it.each([401, 403])("does not retry session failures (%s)", async (status) => {
    mockGet.mockRejectedValue(new ApiError("FORBIDDEN", "Session ended", status, null));
    const { result } = renderHook(() => useUserMetrics("30d"), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(mockGet).toHaveBeenCalledTimes(1);
  });

  it("does not expose the previous user's metrics after an account switch", async () => {
    const consoleError = jest.spyOn(console, "error");
    mockGet.mockResolvedValueOnce(profileMetricsMock);
    const { result } = renderHook(() => useUserMetrics("30d"), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    mockGet.mockImplementationOnce(() => new Promise(() => {}));
    act(() => {
      client.setQueryData(AUTH_ME_QUERY_KEY, { user_id: "user-2" });
    });
    await waitFor(() => expect(result.current.isLoading).toBe(true));
    expect(result.current.data).toBeUndefined();
    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });
});

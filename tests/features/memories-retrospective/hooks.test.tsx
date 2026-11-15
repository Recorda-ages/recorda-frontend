import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import type { ReactNode } from "react";

import { AUTH_ME_QUERY_KEY } from "@/features/auth/api/getCurrentUser";
import { useRetrospective } from "@/features/memories-retrospective/hooks/useRetrospective";
import { useRetrospectivePeriods } from "@/features/memories-retrospective/hooks/useRetrospectivePeriods";
import { retrospectiveServiceMock } from "@/features/memories-retrospective/mocks/retrospectiveMock";
import {
  invalidateRetrospectives,
  retrospectiveDetailsQueryKey,
  retrospectivePeriodsQueryKey
} from "@/features/memories-retrospective/queryKeys";
import type {
  RetrospectiveDetailsResponse,
  RetrospectivePeriodSelection
} from "@/features/memories-retrospective/types";
import { ApiError, authApiClient } from "@/services/api";

jest.mock("@/services/api", () => ({
  ...jest.requireActual("@/services/api"),
  authApiClient: { get: jest.fn() }
}));

const mockGet = jest.mocked(authApiClient.get);

const OCTOBER: RetrospectivePeriodSelection = { month: 10, period_type: "MONTHLY", year: 2026 };
const SEPTEMBER: RetrospectivePeriodSelection = { month: 9, period_type: "MONTHLY", year: 2026 };

let client: QueryClient;

function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

function signIn(userId = "user-1") {
  client.setQueryData(AUTH_ME_QUERY_KEY, { user_id: userId });
}

function respondWithFixtures() {
  mockGet.mockImplementation(async (path: string) => {
    if (path === "/users/me/retrospectives/available") {
      return retrospectiveServiceMock.getAvailablePeriods();
    }
    const params = new URLSearchParams(path.split("?")[1]);
    const month = params.get("month");
    const details = await retrospectiveServiceMock.getRetrospective({
      month: month === null ? null : Number(month),
      period_type: params.get("period_type") as RetrospectivePeriodSelection["period_type"],
      year: Number(params.get("year"))
    });
    if (!details) throw new ApiError("RETROSPECTIVE_NOT_FOUND", "Empty", 404, null);
    return details;
  });
}

beforeEach(() => {
  mockGet.mockReset();
  client = new QueryClient({ defaultOptions: { queries: { retryDelay: 0 } } });
  signIn();
});

afterEach(() => client.clear());

describe("useRetrospectivePeriods", () => {
  it("loads the periods available for the signed-in user", async () => {
    respondWithFixtures();
    const { result } = renderHook(() => useRetrospectivePeriods(), { wrapper });

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.periods[0]).toMatchObject({ is_preview: true, month: 11 });
    expect(result.current.isEmpty).toBe(false);
    expect(
      client.getQueryCache().find({ queryKey: retrospectivePeriodsQueryKey("user-1") })?.gcTime
    ).toBe(300000);
  });

  it("flags an account without any retrospective", async () => {
    mockGet.mockResolvedValueOnce({ periods: [] });
    const { result } = renderHook(() => useRetrospectivePeriods(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.isEmpty).toBe(true);
  });

  it("stays idle without a signed-in user", () => {
    client.clear();
    const { result } = renderHook(() => useRetrospectivePeriods(), { wrapper });

    expect(result.current.fetchStatus).toBe("idle");
    expect(mockGet).not.toHaveBeenCalled();
  });

  it("does not retry when the session is no longer valid", async () => {
    mockGet.mockRejectedValue(new ApiError("UNAUTHORIZED", "expired", 401, null));
    const { result } = renderHook(() => useRetrospectivePeriods(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(mockGet).toHaveBeenCalledTimes(1);
  });

  it("retries a server failure once before showing the error", async () => {
    const error = new ApiError("UNAVAILABLE", "down", 503, null);
    mockGet.mockRejectedValue(error);
    const { result } = renderHook(() => useRetrospectivePeriods(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBe(error);
    expect(mockGet).toHaveBeenCalledTimes(2);
  });
});

describe("useRetrospective", () => {
  it("does not request anything until a period is selected", async () => {
    respondWithFixtures();
    const { result, rerender } = renderHook(
      ({ period }: { period: RetrospectivePeriodSelection | null }) => useRetrospective(period),
      { initialProps: { period: null as RetrospectivePeriodSelection | null }, wrapper }
    );

    expect(result.current.fetchStatus).toBe("idle");
    expect(result.current.data).toBeUndefined();
    expect(mockGet).not.toHaveBeenCalled();

    rerender({ period: OCTOBER });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockGet).toHaveBeenCalledWith(
      "/users/me/retrospectives?period_type=MONTHLY&year=2026&month=10",
      { signal: expect.any(AbortSignal) }
    );
    expect(result.current.data?.total_recordas).toBe(12);
  });

  it("accepts a period straight from the available list", async () => {
    respondWithFixtures();
    const { periods } = await retrospectiveServiceMock.getAvailablePeriods();
    const year = periods.find((period) => period.period_type === "YEARLY") ?? null;
    const { result } = renderHook(() => useRetrospective(year), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toMatchObject({ label: "Ano de 2025", total_recordas: 9 });
  });

  it("keeps each period in its own five-minute cache", async () => {
    respondWithFixtures();
    const { result, rerender } = renderHook(
      ({ period }: { period: RetrospectivePeriodSelection }) => useRetrospective(period),
      { initialProps: { period: OCTOBER }, wrapper }
    );
    await waitFor(() => expect(result.current.data?.month).toBe(10));

    rerender({ period: SEPTEMBER });
    await waitFor(() => expect(result.current.data?.month).toBe(9));

    rerender({ period: OCTOBER });
    expect(result.current.data?.month).toBe(10);
    expect(mockGet).toHaveBeenCalledTimes(2);
    expect(
      client.getQueryCache().find({ queryKey: retrospectiveDetailsQueryKey("user-1", OCTOBER) })
        ?.gcTime
    ).toBe(300000);
  });

  it("flags a period without memories as empty instead of an error", async () => {
    respondWithFixtures();
    const { result } = renderHook(
      () => useRetrospective({ month: 8, period_type: "MONTHLY", year: 2026 }),
      { wrapper }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeNull();
    expect(result.current.isEmpty).toBe(true);
    expect(result.current.isError).toBe(false);
    expect(mockGet).toHaveBeenCalledTimes(1);
  });

  it("keeps an invalid period idle", () => {
    const { result } = renderHook(
      () => useRetrospective({ month: 13, period_type: "MONTHLY", year: 2026 }),
      { wrapper }
    );

    expect(result.current.fetchStatus).toBe("idle");
    expect(mockGet).not.toHaveBeenCalled();
  });

  it("exposes errors without retrying forbidden requests", async () => {
    const error = new ApiError("FORBIDDEN", "no", 403, null);
    mockGet.mockRejectedValue(error);
    const { result } = renderHook(() => useRetrospective(OCTOBER), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBe(error);
    expect(result.current.isEmpty).toBe(false);
    expect(mockGet).toHaveBeenCalledTimes(1);
  });

  it("keeps the cache of each account apart", async () => {
    respondWithFixtures();
    const first = renderHook(() => useRetrospective(OCTOBER), { wrapper });
    await waitFor(() => expect(first.result.current.isSuccess).toBe(true));
    first.unmount();

    signIn("user-2");
    const second = renderHook(() => useRetrospective(OCTOBER), { wrapper });
    await waitFor(() => expect(second.result.current.isSuccess).toBe(true));

    expect(mockGet).toHaveBeenCalledTimes(2);
  });

  it("refetches every retrospective when invalidated", async () => {
    respondWithFixtures();
    const { result } = renderHook(
      () => ({ details: useRetrospective(OCTOBER), periods: useRetrospectivePeriods() }),
      { wrapper }
    );
    await waitFor(() => expect(result.current.details.isSuccess).toBe(true));
    await waitFor(() => expect(result.current.periods.isSuccess).toBe(true));

    await act(async () => {
      await invalidateRetrospectives(client);
    });

    expect(mockGet).toHaveBeenCalledTimes(4);
    expect((result.current.details.data as RetrospectiveDetailsResponse).total_recordas).toBe(12);
  });
});

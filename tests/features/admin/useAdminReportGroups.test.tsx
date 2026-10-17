import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import type { PropsWithChildren } from "react";

import { useAdminApiErrorHandler } from "@/features/admin/hooks/useAdminApiErrorHandler";
import {
  ADMIN_REPORTS_QUERY_KEY,
  useAdminReportGroups
} from "@/features/admin/reports/hooks/useAdminReportGroups";
import { adminAdapter } from "@/features/admin/services/adminAdapter";
import { adminService } from "@/features/admin/services/adminService";
import type { AdminReportPageResponse } from "@/features/admin/types";
import { AUTH_ME_QUERY_KEY } from "@/features/auth/api/getCurrentUser";
import { ApiError, authApiClient } from "@/services/api";

jest.mock("@/features/admin/hooks/useAdminApiErrorHandler", () => ({
  useAdminApiErrorHandler: jest.fn()
}));

const mockHandleError = jest.fn(async () => false);
const mockUseAdminApiErrorHandler = useAdminApiErrorHandler as jest.Mock;

function createClient(role = "ADMIN") {
  const client = new QueryClient({
    defaultOptions: { mutations: { gcTime: Infinity }, queries: { gcTime: Infinity } }
  });
  client.setQueryData(AUTH_ME_QUERY_KEY, { user_id: "admin-1", role });
  return client;
}

function createWrapper(role = "ADMIN", client = createClient(role)) {
  return function Wrapper({ children }: PropsWithChildren) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

type ApiGroup = AdminReportPageResponse["items"][number];

function apiGroup(id: string): ApiGroup {
  return {
    first_reported_at: "2026-10-01T12:00:00Z",
    last_reported_at: "2026-10-02T12:00:00Z",
    preview: { image_url: null, subtitle: "@autor", title: `Música ${id}` },
    report_count: 1,
    status: "OPEN",
    target_id: id,
    target_type: "RECORDA"
  };
}

function page(items: ApiGroup[], total = items.length): AdminReportPageResponse {
  return { items, total };
}

function mockGet() {
  return jest.spyOn(authApiClient, "get");
}

describe("useAdminReportGroups", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAdminApiErrorHandler.mockReturnValue(mockHandleError);
  });

  afterEach(() => jest.restoreAllMocks());

  it("reads the groups from the real API through the authenticated client", async () => {
    const get = mockGet().mockResolvedValue(page([apiGroup("a")]));
    const filters = { order: "asc", status: "RESOLVED", targetType: "USER" } as const;
    const { result } = renderHook(() => useAdminReportGroups(filters), {
      wrapper: createWrapper()
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(adminAdapter).toBe(adminService);
    expect(get).toHaveBeenCalledWith(
      "/admin/reports?status=RESOLVED&limit=20&offset=0&order=asc&target_type=USER",
      { signal: expect.any(AbortSignal) }
    );
    expect(result.current.items).toEqual([
      expect.objectContaining({
        contentSummary: "Música a",
        targetId: "a",
        targetUsername: "autor"
      })
    ]);
    expect(result.current.canSearch).toBe(false);
    expect(mockHandleError).not.toHaveBeenCalled();
  });

  it.each([401, 403])(
    "does not retry %s and delegates it to the shared handler",
    async (status) => {
      const error = new ApiError("session_expired", "expired", status, null);
      const get = mockGet().mockRejectedValue(error);
      const { result } = renderHook(() => useAdminReportGroups({}), { wrapper: createWrapper() });

      await waitFor(() => expect(result.current.isError).toBe(true));
      await waitFor(() => expect(mockHandleError).toHaveBeenCalledWith(error));
      expect(get).toHaveBeenCalledTimes(1);
    }
  );

  it("does not query for a common user", () => {
    const get = mockGet();
    renderHook(() => useAdminReportGroups({}), { wrapper: createWrapper("USER") });
    expect(get).not.toHaveBeenCalled();
  });

  it("walks the pages by offset without skipping or repeating groups", async () => {
    const get = mockGet()
      .mockResolvedValueOnce(page([apiGroup("a"), apiGroup("b")], 3))
      .mockResolvedValueOnce(page([apiGroup("c")], 3));
    const { result } = renderHook(() => useAdminReportGroups({ limit: 2 }), {
      wrapper: createWrapper()
    });

    await waitFor(() => expect(result.current.hasNextPage).toBe(true));
    await act(async () => {
      await result.current.fetchNextPage();
    });

    await waitFor(() =>
      expect(result.current.items.map((item) => item.targetId)).toEqual(["a", "b", "c"])
    );
    expect(get.mock.calls.map(([path]) => path)).toEqual([
      "/admin/reports?status=OPEN&limit=2&offset=0",
      "/admin/reports?status=OPEN&limit=2&offset=2"
    ]);
    expect(result.current.hasNextPage).toBe(false);
    expect(result.current.total).toBe(3);
  });

  it("does not repeat a group that moved between pages", async () => {
    mockGet()
      .mockResolvedValueOnce(page([apiGroup("a"), apiGroup("b")], 4))
      .mockResolvedValueOnce(page([apiGroup("b"), apiGroup("c")], 4));
    const { result } = renderHook(() => useAdminReportGroups({ limit: 2 }), {
      wrapper: createWrapper()
    });

    await waitFor(() => expect(result.current.hasNextPage).toBe(true));
    await act(async () => {
      await result.current.fetchNextPage();
    });

    await waitFor(() =>
      expect(result.current.items.map((item) => item.targetId)).toEqual(["a", "b", "c"])
    );
  });

  it("refetches when anything under admin/reports is invalidated", async () => {
    const get = mockGet().mockResolvedValue(page([apiGroup("a")]));
    const client = createClient();
    const { result } = renderHook(() => useAdminReportGroups({ status: "OPEN" }), {
      wrapper: createWrapper("ADMIN", client)
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    await act(async () => {
      await client.invalidateQueries({ queryKey: ADMIN_REPORTS_QUERY_KEY });
    });

    expect(get).toHaveBeenCalledTimes(2);
  });
});

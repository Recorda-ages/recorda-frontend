import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import type { PropsWithChildren } from "react";

import { useAdminApiErrorHandler } from "@/features/admin/hooks/useAdminApiErrorHandler";
import { useAdminReports } from "@/features/admin/hooks/useAdminReports";
import { adminServiceMock } from "@/features/admin/services/adminService.mock";
import { authApiClient, ApiError } from "@/services/api";
import { adminAdapter } from "@/features/admin/services/adminAdapter";
import { AUTH_ME_QUERY_KEY } from "@/features/auth/api/getCurrentUser";

jest.mock("@/features/admin/hooks/useAdminApiErrorHandler", () => ({
  useAdminApiErrorHandler: jest.fn()
}));

const mockHandleError = jest.fn(async () => false);
const mockUseAdminApiErrorHandler = useAdminApiErrorHandler as jest.Mock;

function createWrapper(role = "ADMIN") {
  const client = new QueryClient({
    defaultOptions: { queries: { gcTime: Infinity, retry: false } }
  });
  client.setQueryData(AUTH_ME_QUERY_KEY, { user_id: "admin-1", role });

  return function Wrapper({ children }: PropsWithChildren) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

describe("useAdminReports", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAdminApiErrorHandler.mockReturnValue(mockHandleError);
  });

  afterEach(() => jest.restoreAllMocks());

  it("queries the administrative adapter with filters and an abort signal", async () => {
    const httpGet = jest
      .spyOn(authApiClient, "get")
      .mockRejectedValue(new Error("Unexpected HTTP request"));
    const listReports = jest.spyOn(adminServiceMock, "listReportGroups");
    const filters = { query: "marina", status: "OPEN", targetType: "RECORDA" } as const;
    const { result } = renderHook(() => useAdminReports(filters), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(listReports).toHaveBeenCalledWith(
      { ...filters, cursor: undefined },
      expect.any(AbortSignal)
    );
    expect(mockHandleError).not.toHaveBeenCalled();
    expect(adminAdapter).toBe(adminServiceMock);
    expect(httpGet).not.toHaveBeenCalled();
  });

  it.each([401, 403])(
    "does not retry %s and delegates it to the shared handler",
    async (status) => {
      const error = new ApiError("session_expired", "expired", status, null);
      const list = jest.spyOn(adminServiceMock, "listReportGroups").mockRejectedValue(error);
      const { result } = renderHook(() => useAdminReports({}), { wrapper: createWrapper() });

      await waitFor(() => expect(result.current.isError).toBe(true));
      await waitFor(() => expect(mockHandleError).toHaveBeenCalledWith(error));
      expect(list).toHaveBeenCalledTimes(1);
    }
  );

  it("does not query for a common user", () => {
    const list = jest.spyOn(adminServiceMock, "listReportGroups");
    renderHook(() => useAdminReports({}), { wrapper: createWrapper("USER") });
    expect(list).not.toHaveBeenCalled();
  });

  it("loads the next page without losing previous reports", async () => {
    const { result } = renderHook(() => useAdminReports({ limit: 1 }), {
      wrapper: createWrapper()
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.items).toHaveLength(1);
    expect(result.current.hasNextPage).toBe(true);
    await act(async () => {
      await result.current.fetchNextPage();
    });
    await waitFor(() => expect(result.current.items).toHaveLength(2));
  });
});

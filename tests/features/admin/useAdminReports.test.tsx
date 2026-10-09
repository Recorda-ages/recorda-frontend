import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react-native";
import type { PropsWithChildren } from "react";

import { useAdminApiErrorHandler } from "@/features/admin/hooks/useAdminApiErrorHandler";
import { useAdminReports } from "@/features/admin/hooks/useAdminReports";
import { adminServiceMock } from "@/features/admin/services/adminService.mock";
import { ApiError } from "@/services/api";

jest.mock("@/features/admin/hooks/useAdminApiErrorHandler", () => ({
  useAdminApiErrorHandler: jest.fn()
}));

const mockHandleError = jest.fn(async () => false);
const mockUseAdminApiErrorHandler = useAdminApiErrorHandler as jest.Mock;

function createWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { gcTime: 0, retry: false } }
  });

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
    const listReports = jest.spyOn(adminServiceMock, "listReportGroups");
    const filters = { query: "marina", status: "OPEN", targetType: "RECORDA" } as const;
    const { result } = renderHook(() => useAdminReports(filters), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(listReports).toHaveBeenCalledWith(filters, expect.any(AbortSignal));
    expect(mockHandleError).not.toHaveBeenCalled();
  });

  it("delegates authorization failures to the shared admin handler", async () => {
    const error = new ApiError("session_expired", "expired", 401, null);
    jest.spyOn(adminServiceMock, "listReportGroups").mockRejectedValueOnce(error);
    const { result } = renderHook(() => useAdminReports({}), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
    await waitFor(() => expect(mockHandleError).toHaveBeenCalledWith(error));
  });
});

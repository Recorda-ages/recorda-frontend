import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import type { PropsWithChildren } from "react";

import { useAdminApiErrorHandler } from "@/features/admin/hooks/useAdminApiErrorHandler";
import { useAdminReportDetail } from "@/features/admin/reports/hooks/useAdminReportDetail";
import { ADMIN_REPORTS_QUERY_KEY } from "@/features/admin/reports/hooks/useAdminReportGroups";
import { useUpdateAdminReportStatus } from "@/features/admin/reports/hooks/useUpdateAdminReportStatus";
import {
  adminServiceMock,
  resetAdminServiceMock
} from "@/features/admin/services/adminService.mock";
import { AUTH_ME_QUERY_KEY } from "@/features/auth/api/getCurrentUser";
import { ApiError } from "@/services/api";

jest.mock("@/features/admin/hooks/useAdminApiErrorHandler", () => ({
  useAdminApiErrorHandler: jest.fn()
}));

const mockHandleError = jest.fn(async () => false);
const mockUseAdminApiErrorHandler = useAdminApiErrorHandler as jest.Mock;

function createClient(role = "ADMIN") {
  const client = new QueryClient({
    defaultOptions: { mutations: { gcTime: Infinity }, queries: { gcTime: Infinity } }
  });
  client.setQueryData(AUTH_ME_QUERY_KEY, { role, user_id: "admin-1" });
  return client;
}

function wrapperFor(client: QueryClient) {
  return function Wrapper({ children }: PropsWithChildren) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

describe("useAdminReportDetail", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
    resetAdminServiceMock();
    mockUseAdminApiErrorHandler.mockReturnValue(mockHandleError);
  });

  it("reads the detail of the target under the reports query key", async () => {
    const read = jest.spyOn(adminServiceMock, "getReportDetail");
    const client = createClient();

    const { result } = renderHook(() => useAdminReportDetail("RECORDA", "recorda-1042"), {
      wrapper: wrapperFor(client)
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(read).toHaveBeenCalledWith("RECORDA", "recorda-1042", expect.any(AbortSignal));
    expect(
      client.getQueryData([
        ...ADMIN_REPORTS_QUERY_KEY,
        "detail",
        "admin-1",
        "RECORDA",
        "recorda-1042"
      ])
    ).toBe(result.current.data);
  });

  it("does not ask for the detail without an admin session", async () => {
    const read = jest.spyOn(adminServiceMock, "getReportDetail");

    renderHook(() => useAdminReportDetail("RECORDA", "recorda-1042"), {
      wrapper: wrapperFor(createClient("USER"))
    });

    await act(async () => undefined);
    expect(read).not.toHaveBeenCalled();
  });

  it.each([401, 403, 404])(
    "does not retry a %s and hands it to the admin error handler",
    async (status) => {
      const error = new ApiError("ERROR", "failure", status, null);
      const read = jest.spyOn(adminServiceMock, "getReportDetail").mockRejectedValue(error);

      const { result } = renderHook(() => useAdminReportDetail("USER", "user-1088"), {
        wrapper: wrapperFor(createClient())
      });

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(read).toHaveBeenCalledTimes(1);
      expect(mockHandleError).toHaveBeenCalledWith(error);
    }
  );
});

describe("useUpdateAdminReportStatus", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    resetAdminServiceMock();
  });

  it("refreshes the detail and the list after a change", async () => {
    const client = createClient();
    const invalidate = jest.spyOn(client, "invalidateQueries");
    const { result } = renderHook(() => useUpdateAdminReportStatus("RECORDA", "recorda-1042"), {
      wrapper: wrapperFor(client)
    });

    await act(async () => {
      await result.current.mutateAsync({ reason: "Confirmado", status: "RESOLVED" });
    });

    expect(invalidate).toHaveBeenCalledWith({ queryKey: ADMIN_REPORTS_QUERY_KEY });
  });

  it("also refreshes after a conflict, but not after other failures", async () => {
    const client = createClient();
    const invalidate = jest.spyOn(client, "invalidateQueries");
    const update = jest.spyOn(adminServiceMock, "updateReportStatus");
    const { result } = renderHook(() => useUpdateAdminReportStatus("RECORDA", "recorda-1042"), {
      wrapper: wrapperFor(client)
    });

    update.mockRejectedValueOnce(new Error("network"));
    await act(async () => {
      await expect(
        result.current.mutateAsync({ reason: "Confirmado", status: "RESOLVED" })
      ).rejects.toThrow("network");
    });
    expect(invalidate).not.toHaveBeenCalled();

    update.mockRejectedValueOnce(new ApiError("CONFLICT", "conflict", 409, null));
    await act(async () => {
      await expect(
        result.current.mutateAsync({ reason: "Confirmado", status: "RESOLVED" })
      ).rejects.toMatchObject({ status: 409 });
    });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ADMIN_REPORTS_QUERY_KEY });
  });
});

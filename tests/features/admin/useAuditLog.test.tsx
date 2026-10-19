import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import type { PropsWithChildren } from "react";

import { useAdminApiErrorHandler } from "@/features/admin/hooks/useAdminApiErrorHandler";
import { useAuditLog } from "@/features/admin/audit-log/hooks/useAuditLog";
import {
  adminServiceMock,
  resetAdminServiceMock
} from "@/features/admin/services/adminService.mock";
import type { AdminAuditEntry } from "@/features/admin/types";
import { AUTH_ME_QUERY_KEY } from "@/features/auth/api/getCurrentUser";
import { ApiError } from "@/services/api";

jest.mock("@/features/admin/services/adminAdapter", () => ({
  adminAdapter: jest.requireActual("@/features/admin/services/adminService.mock").adminServiceMock
}));

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

describe("useAuditLog", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
    resetAdminServiceMock();
    mockUseAdminApiErrorHandler.mockReturnValue(mockHandleError);
  });

  it("fetches the audit log for an admin user", async () => {
    const list = jest.spyOn(adminServiceMock, "listAuditLog");
    const client = createClient();

    const { result } = renderHook(() => useAuditLog({}), {
      wrapper: wrapperFor(client)
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(list).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 20, offset: 0 }),
      expect.any(AbortSignal)
    );
    expect(result.current.items).toEqual([]);
    expect(result.current.total).toBe(0);
  });

  it("does not fetch without an admin session", async () => {
    const list = jest.spyOn(adminServiceMock, "listAuditLog");

    renderHook(() => useAuditLog({}), {
      wrapper: wrapperFor(createClient("USER"))
    });

    await act(async () => undefined);
    expect(list).not.toHaveBeenCalled();
  });

  it("maps frontend filters to snake_case api params", async () => {
    const list = jest.spyOn(adminServiceMock, "listAuditLog");
    const client = createClient();

    renderHook(
      () =>
        useAuditLog({
          adminId: "admin-1",
          actionType: "CHANGE_REPORT_STATUS",
          dateFrom: "2026-01-01",
          dateTo: "2026-01-31"
        }),
      { wrapper: wrapperFor(client) }
    );

    await waitFor(() => expect(list).toHaveBeenCalled());
    expect(list).toHaveBeenCalledWith(
      expect.objectContaining({
        admin_id: "admin-1",
        action_type: "CHANGE_REPORT_STATUS",
        date_from: "2026-01-01",
        date_to: "2026-01-31"
      }),
      expect.any(AbortSignal)
    );
  });

  it("returns items deduplicated across pages", async () => {
    const mockEntry: AdminAuditEntry = {
      action_id: "a1",
      admin: { user_id: "admin-1", username: "admin" },
      action_type: "CHANGE_REPORT_STATUS",
      target_label: "user",
      target_user_id: null,
      target_recorda_id: "recorda-1",
      created_at: "2026-01-01T00:00:00Z",
      reason: "razao",
      details: null
    };
    jest
      .spyOn(adminServiceMock, "listAuditLog")
      .mockResolvedValue({ items: [mockEntry, mockEntry], total: 1 });

    const client = createClient();
    const { result } = renderHook(() => useAuditLog({}), {
      wrapper: wrapperFor(client)
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.items).toHaveLength(1);
  });

  it.each([401, 403])(
    "does not retry on %s and hands the error to the admin error handler",
    async (status) => {
      const error = new ApiError("ERROR", "forbidden", status, null);
      const list = jest.spyOn(adminServiceMock, "listAuditLog").mockRejectedValue(error);

      const { result } = renderHook(() => useAuditLog({}), {
        wrapper: wrapperFor(createClient())
      });

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(list).toHaveBeenCalledTimes(1);
      expect(mockHandleError).toHaveBeenCalledWith(error);
    }
  );
});

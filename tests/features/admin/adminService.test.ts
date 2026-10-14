import { adminService } from "@/features/admin/services/adminService";
import type { AdminReportPageResponse } from "@/features/admin/types";
import { authApiClient, ApiError } from "@/services/api";

jest.mock("@/services/api", () => ({
  ...jest.requireActual("@/services/api"),
  authApiClient: { get: jest.fn() }
}));
const mockGet = authApiClient.get as jest.Mock;
const group: AdminReportPageResponse["items"][number] = {
  target_type: "RECORDA",
  target_id: "recorda-1",
  status: "OPEN",
  report_count: 2,
  first_reported_at: "2026-10-01T12:00:00Z",
  last_reported_at: "2026-10-02T12:00:00Z",
  preview: { title: "Song title", subtitle: "@marina", image_url: "/api/v1/recordas/media/a.jpg" }
};

describe("adminService HTTP contract", () => {
  beforeEach(() => jest.clearAllMocks());

  it("uses authApiClient and maps the grouped report contract without inventing a reporter", async () => {
    mockGet.mockResolvedValue({ items: [group], total: 2 });
    const signal = new AbortController().signal;
    const page = await adminService.listReportGroups({ limit: 1, targetType: "RECORDA" }, signal);
    expect(mockGet).toHaveBeenCalledWith(
      "/admin/reports?status=OPEN&limit=1&offset=0&target_type=RECORDA",
      { signal }
    );
    expect(page).toEqual({
      items: [
        {
          contentSummary: "Song title",
          imageUrl: "/api/v1/recordas/media/a.jpg",
          latestReportedAt: group.last_reported_at,
          openReportCount: 2,
          status: "OPEN",
          targetId: "recorda-1",
          targetLabel: "Song title",
          targetType: "RECORDA",
          targetUsername: "marina"
        }
      ],
      nextCursor: "1",
      total: 2
    });
    expect(page.items[0].latestReporterUsername).toBeUndefined();
  });

  it("forwards pagination and stops at the last page", async () => {
    mockGet.mockResolvedValue({
      items: [{ ...group, preview: { ...group.preview, subtitle: null } }],
      total: 2
    });
    const page = await adminService.listReportGroups({ cursor: "1", limit: 1, status: "RESOLVED" });
    expect(mockGet).toHaveBeenCalledWith("/admin/reports?status=RESOLVED&limit=1&offset=1", {
      signal: undefined
    });
    expect(page.nextCursor).toBeNull();
    expect(page.items[0].targetUsername).toBe("");
  });

  it("forwards the date order chosen on the screen", async () => {
    mockGet.mockResolvedValue({ items: [group], total: 1 });
    await adminService.listReportGroups({ order: "asc", status: "OPEN" });
    expect(mockGet).toHaveBeenCalledWith("/admin/reports?status=OPEN&limit=20&offset=0&order=asc", {
      signal: undefined
    });
  });

  it("does not loop if a concurrently changed collection returns an empty page", async () => {
    mockGet.mockResolvedValue({ items: [], total: 2 });
    expect((await adminService.listReportGroups()).nextCursor).toBeNull();
  });

  it("does not silently ignore an unsupported search", async () => {
    await expect(adminService.listReportGroups({ query: "marina" })).rejects.toThrow(
      "not supported"
    );
    expect(mockGet).not.toHaveBeenCalled();
  });

  it("forwards audit filters including zero offset and skips undefined values", async () => {
    const response = { items: [], total: 0 };
    mockGet.mockResolvedValue(response);
    const signal = new AbortController().signal;
    const result = await adminService.listAuditLog(
      {
        admin_id: "admin 1",
        action_type: "REMOVE_RECORDA",
        date_from: "2026-10-01",
        date_to: undefined,
        offset: 0,
        limit: 20
      },
      signal
    );
    expect(mockGet).toHaveBeenCalledWith(
      "/admin/audit-log?admin_id=admin+1&action_type=REMOVE_RECORDA&date_from=2026-10-01&offset=0&limit=20",
      { signal }
    );
    expect(result).toBe(response);
  });

  it("reads the available admin and audit endpoints without filters", async () => {
    mockGet.mockResolvedValue([]);
    await adminService.listAdmins();
    expect(mockGet).toHaveBeenLastCalledWith("/admin/admins", { signal: undefined });
    await adminService.listAuditLog();
    expect(mockGet).toHaveBeenLastCalledWith("/admin/audit-log", { signal: undefined });
  });

  it.each([401, 403, 500])("preserves a %s error for the shared handler", async (status) => {
    const error = new ApiError("ERROR", "failure", status, null);
    mockGet.mockRejectedValue(error);
    await expect(adminService.listReportGroups()).rejects.toBe(error);
    await expect(adminService.listAuditLog()).rejects.toBe(error);
    await expect(adminService.listAdmins()).rejects.toBe(error);
  });
});

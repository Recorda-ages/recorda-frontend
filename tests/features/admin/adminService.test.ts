import { adminService } from "@/features/admin/services/adminService";
import type { AdminReportDetailResponse, AdminReportPageResponse } from "@/features/admin/types";
import { authApiClient, ApiError } from "@/services/api";

jest.mock("@/services/api", () => ({
  ...jest.requireActual("@/services/api"),
  authApiClient: { get: jest.fn(), patch: jest.fn() }
}));
const mockGet = authApiClient.get as jest.Mock;
const mockPatch = authApiClient.patch as jest.Mock;
const author = {
  deleted_at: null,
  profile_picture_url: "/media/avatars/marina.jpg",
  status: "ACTIVE" as const,
  user_id: "user-1",
  username: "marina"
};
const detailBase = {
  actions: [
    {
      action_id: "action-1",
      action_type: "CHANGE_REPORT_STATUS" as const,
      admin: { user_id: "admin-1", username: "admin" },
      created_at: "2026-10-03T12:00:00Z",
      details: { from: "OPEN", report_count: 2, target_type: "RECORDA", to: "RESOLVED" },
      reason: "Confirmado",
      target_label: "Levitating",
      target_recorda_id: "recorda/1",
      target_user_id: null
    },
    {
      action_id: "action-2",
      action_type: "REMOVE_RECORDA" as const,
      admin: { user_id: "admin-2", username: "moderador" },
      created_at: "2026-10-02T12:00:00Z",
      details: null,
      reason: "Conteúdo ofensivo",
      target_label: "Levitating",
      target_recorda_id: "recorda/1",
      target_user_id: null
    }
  ],
  reports: [
    {
      created_at: "2026-10-01T12:00:00Z",
      description: null,
      report_id: "report-1",
      reporter: { user_id: "user-2", username: "paulo" },
      resolved_at: "2026-10-03T12:00:00Z",
      status: "RESOLVED" as const
    }
  ]
};
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

  it("reads the full detail of a reported Recorda and maps it for the screen", async () => {
    const response: AdminReportDetailResponse = {
      ...detailBase,
      target: {
        author,
        created_at: "2026-09-30T12:00:00Z",
        deleted_at: "2026-10-02T12:00:00Z",
        description: "Legenda",
        media_type: "VIDEO",
        media_url: "/media/recordas/1.mp4",
        recorda_id: "recorda/1",
        song_artist_name: "Dua Lipa",
        song_cover_url: "https://cdn.example.com/cover.jpg",
        song_title: "Levitating"
      },
      target_type: "RECORDA"
    };
    mockGet.mockResolvedValue(response);
    const signal = new AbortController().signal;

    const detail = await adminService.getReportDetail("RECORDA", "recorda/1", signal);

    expect(mockGet).toHaveBeenCalledWith("/admin/reports/RECORDA/recorda%2F1", { signal });
    expect(detail).toEqual({
      actions: [
        {
          actionId: "action-1",
          actionType: "CHANGE_REPORT_STATUS",
          adminUsername: "admin",
          createdAt: "2026-10-03T12:00:00Z",
          reason: "Confirmado",
          toStatus: "RESOLVED"
        },
        {
          actionId: "action-2",
          actionType: "REMOVE_RECORDA",
          adminUsername: "moderador",
          createdAt: "2026-10-02T12:00:00Z",
          reason: "Conteúdo ofensivo",
          toStatus: null
        }
      ],
      reports: [
        {
          createdAt: "2026-10-01T12:00:00Z",
          description: null,
          reportId: "report-1",
          reporterUsername: "paulo",
          resolvedAt: "2026-10-03T12:00:00Z",
          status: "RESOLVED"
        }
      ],
      target: {
        recorda: {
          author: {
            avatarUrl: "/media/avatars/marina.jpg",
            deletedAt: null,
            status: "ACTIVE",
            userId: "user-1",
            username: "marina"
          },
          createdAt: "2026-09-30T12:00:00Z",
          deletedAt: "2026-10-02T12:00:00Z",
          description: "Legenda",
          mediaType: "VIDEO",
          mediaUrl: "/media/recordas/1.mp4",
          recordaId: "recorda/1",
          songArtist: "Dua Lipa",
          songCoverUrl: "https://cdn.example.com/cover.jpg",
          songTitle: "Levitating"
        },
        type: "RECORDA"
      }
    });
  });

  it("reads the detail of a reported profile", async () => {
    const response: AdminReportDetailResponse = {
      ...detailBase,
      target: {
        ...author,
        created_at: "2025-01-01T12:00:00Z",
        email: "marina@example.com",
        is_private: true,
        name: "Marina",
        status: "SUSPENDED"
      },
      target_type: "USER"
    };
    mockGet.mockResolvedValue(response);

    const detail = await adminService.getReportDetail("USER", "user-1");

    expect(mockGet).toHaveBeenCalledWith("/admin/reports/USER/user-1", { signal: undefined });
    expect(detail.target).toEqual({
      type: "USER",
      user: {
        avatarUrl: "/media/avatars/marina.jpg",
        createdAt: "2025-01-01T12:00:00Z",
        deletedAt: null,
        email: "marina@example.com",
        isPrivate: true,
        name: "Marina",
        status: "SUSPENDED",
        userId: "user-1",
        username: "marina"
      }
    });
  });

  it("changes the status of every report of a target with the admin reason", async () => {
    mockPatch.mockResolvedValue({ status: "DISMISSED", updated_count: 3 });

    const result = await adminService.updateReportStatus("RECORDA", "recorda/1", {
      reason: "Não viola as regras",
      status: "DISMISSED"
    });

    expect(mockPatch).toHaveBeenCalledWith("/admin/reports/RECORDA/recorda%2F1/status", {
      reason: "Não viola as regras",
      status: "DISMISSED"
    });
    expect(result).toEqual({ status: "DISMISSED", updatedCount: 3 });
  });

  it.each([404, 409])("preserves a %s error from the detail endpoints", async (status) => {
    const error = new ApiError("ERROR", "failure", status, null);
    mockGet.mockRejectedValue(error);
    mockPatch.mockRejectedValue(error);

    await expect(adminService.getReportDetail("USER", "user-1")).rejects.toBe(error);
    await expect(
      adminService.updateReportStatus("USER", "user-1", { reason: "x", status: "OPEN" })
    ).rejects.toBe(error);
  });
});

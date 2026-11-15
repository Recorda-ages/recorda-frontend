import {
  adminUsersServiceMock,
  resetAdminUsersMock
} from "@/features/admin/users/services/adminUsersService.mock";

const ADMIN = { role: "ADMIN" as const, user_id: "admin-test", username: "moderador" };
const BASE_FILTERS = { limit: 20, offset: 0 };

describe("adminUsersServiceMock", () => {
  beforeEach(() => resetAdminUsersMock());

  it("filters by username, name, email and status, and returns the filtered total", async () => {
    await expect(
      adminUsersServiceMock.listUsers({ ...BASE_FILTERS, q: " MARINA " })
    ).resolves.toMatchObject({
      items: [expect.objectContaining({ username: "marina" })],
      total: 1
    });
    await expect(
      adminUsersServiceMock.listUsers({ ...BASE_FILTERS, q: "@email.com", status: "ACTIVE" })
    ).resolves.toMatchObject({ total: 5 });
    await expect(
      adminUsersServiceMock.listUsers({ ...BASE_FILTERS, q: "nao-existe" })
    ).resolves.toEqual({ items: [], total: 0 });
  });

  it("slices by offset and limit while retaining the full result count", async () => {
    const page = await adminUsersServiceMock.listUsers({ limit: 2, offset: 2 });

    expect(page.total).toBe(6);
    expect(page.items.map((user) => user.username)).toEqual(["marina", "lucas"]);
  });

  it("returns report groups and action history with the detail fixture", async () => {
    const detail = await adminUsersServiceMock.getUserDetail(
      "00000000-0000-4000-8000-000000001088"
    );

    expect(detail).toMatchObject({
      actions: [{ action_type: "SUSPEND_USER", admin_username: "admin" }],
      reports_received: [
        { report_count: 2, target_type: "USER" },
        { report_count: 2, target_type: "RECORDA" }
      ],
      status: "SUSPENDED"
    });
    expect(detail.reports_received.reduce((total, group) => total + group.report_count, 0)).toBe(4);
  });

  it("supports moderation against the same local user store and preserves history", async () => {
    const userId = "00000000-0000-4000-8000-000000001042";

    await adminUsersServiceMock.suspendUser(userId, ADMIN, {
      reason: "Violação das regras",
      resolve_open_reports: false
    });

    await expect(adminUsersServiceMock.getUserDetail(userId)).resolves.toMatchObject({
      actions: [
        expect.objectContaining({ action_type: "SUSPEND_USER", reason: "Violação das regras" })
      ],
      status: "SUSPENDED"
    });
    await expect(
      adminUsersServiceMock.listUsers({ ...BASE_FILTERS, status: "SUSPENDED" })
    ).resolves.toMatchObject({ total: 2 });
  });

  it("does not make an HTTP request and returns an abort error for a cancelled query", async () => {
    const controller = new AbortController();
    controller.abort();

    await expect(
      adminUsersServiceMock.listUsers(BASE_FILTERS, controller.signal)
    ).rejects.toMatchObject({
      name: "AbortError"
    });
    await expect(adminUsersServiceMock.getUserDetail("missing-user")).rejects.toThrow(
      "Usuário não encontrado."
    );
  });
});

import {
  adminServiceMock,
  resetAdminServiceMock
} from "@/features/admin/services/adminService.mock";

describe("adminServiceMock", () => {
  beforeEach(() => resetAdminServiceMock());

  it("returns isolated report data and filters it by status and target", async () => {
    const firstRead = await adminServiceMock.listReportGroups({
      status: "OPEN",
      targetType: "RECORDA"
    });

    expect(firstRead.items.length).toBeGreaterThan(0);
    expect(firstRead.items).toEqual(
      expect.arrayContaining([expect.objectContaining({ status: "OPEN", targetType: "RECORDA" })])
    );

    firstRead.items[0].targetLabel = "mutated by caller";
    const secondRead = await adminServiceMock.listReportGroups({
      status: "OPEN",
      targetType: "RECORDA"
    });
    expect(secondRead.items[0].targetLabel).not.toBe("mutated by caller");
  });

  it("searches users and filters their status", async () => {
    const result = await adminServiceMock.listUsers({ query: "marina", status: "ACTIVE" });

    expect(result.items).toEqual([
      expect.objectContaining({ status: "ACTIVE", username: "marina" })
    ]);
  });

  it("searches report groups by target username or content", async () => {
    const byUsername = await adminServiceMock.listReportGroups({ query: "MARINA" });
    const byContent = await adminServiceMock.listReportGroups({ query: "usuário dois" });

    expect(byUsername.items).toEqual([
      expect.objectContaining({ targetUsername: "marina", targetType: "RECORDA" })
    ]);
    expect(byContent.items).toEqual([
      expect.objectContaining({ targetUsername: "usuario2", targetType: "USER" })
    ]);
  });

  it("lists only open groups when no status is given, like the API", async () => {
    const page = await adminServiceMock.listReportGroups();

    expect(page.items.length).toBeGreaterThan(0);
    expect(page.items.every((group) => group.status === "OPEN")).toBe(true);
    expect(page.total).toBe(page.items.length);
  });

  it("orders groups by the latest report in both directions", async () => {
    const newest = await adminServiceMock.listReportGroups({ order: "desc" });
    const oldest = await adminServiceMock.listReportGroups({ order: "asc" });
    const dates = newest.items.map((group) => group.latestReportedAt);

    expect(dates).toEqual([...dates].sort().reverse());
    expect(oldest.items.map((group) => group.targetId)).toEqual(
      newest.items.map((group) => group.targetId).reverse()
    );
  });

  it("keeps the full total while paginating", async () => {
    const all = await adminServiceMock.listReportGroups();
    const firstPage = await adminServiceMock.listReportGroups({ limit: 1 });

    expect(firstPage.items).toHaveLength(1);
    expect(firstPage.total).toBe(all.total);
    expect(firstPage.nextCursor).toBe("1");
  });

  it("honors an already aborted query", async () => {
    const controller = new AbortController();
    controller.abort();

    await expect(adminServiceMock.listUsers({}, controller.signal)).rejects.toMatchObject({
      name: "AbortError"
    });
  });

  it("has a detail for every listed report group", async () => {
    const statuses = ["OPEN", "RESOLVED", "DISMISSED"] as const;

    for (const status of statuses) {
      const page = await adminServiceMock.listReportGroups({ status });
      for (const group of page.items) {
        const detail = await adminServiceMock.getReportDetail(group.targetType, group.targetId);
        expect(detail.target.type).toBe(group.targetType);
        expect(detail.reports.filter((report) => report.status === status)).toHaveLength(
          group.openReportCount
        );
      }
    }
  });

  it("answers 404 for a target without reports", async () => {
    await expect(adminServiceMock.getReportDetail("USER", "user-x")).rejects.toMatchObject({
      status: 404
    });
  });

  it("resolves the open reports and moves the group between the list filters", async () => {
    const result = await adminServiceMock.updateReportStatus("RECORDA", "recorda-1042", {
      reason: "Confirmado",
      status: "RESOLVED"
    });

    expect(result).toEqual({ status: "RESOLVED", updatedCount: 3 });
    const detail = await adminServiceMock.getReportDetail("RECORDA", "recorda-1042");
    expect(detail.reports.every((report) => report.status === "RESOLVED")).toBe(true);
    expect(detail.reports.every((report) => report.resolvedAt !== null)).toBe(true);
    expect(detail.actions[0]).toMatchObject({
      actionType: "CHANGE_REPORT_STATUS",
      adminUsername: "admin",
      reason: "Confirmado",
      toStatus: "RESOLVED"
    });

    const open = await adminServiceMock.listReportGroups({ status: "OPEN" });
    const resolved = await adminServiceMock.listReportGroups({ status: "RESOLVED" });
    expect(open.items.map((group) => group.targetId)).not.toContain("recorda-1042");
    expect(resolved.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          openReportCount: 3,
          status: "RESOLVED",
          targetId: "recorda-1042"
        })
      ])
    );
  });

  it("reopens closed reports", async () => {
    const result = await adminServiceMock.updateReportStatus("USER", "user-1201", {
      reason: "Novo contexto",
      status: "OPEN"
    });

    expect(result).toEqual({ status: "OPEN", updatedCount: 3 });
    const detail = await adminServiceMock.getReportDetail("USER", "user-1201");
    expect(detail.reports.every((report) => report.resolvedAt === null)).toBe(true);
    const open = await adminServiceMock.listReportGroups({ status: "OPEN" });
    expect(open.items.map((group) => group.targetId)).toContain("user-1201");
  });

  it("answers 409 when there is no report in the status being changed", async () => {
    await expect(
      adminServiceMock.updateReportStatus("RECORDA", "recorda-1300", {
        reason: "Repetido",
        status: "DISMISSED"
      })
    ).rejects.toMatchObject({ status: 409 });
  });

  it("isolates the detail returned to callers and restores the fixtures on reset", async () => {
    const detail = await adminServiceMock.getReportDetail("RECORDA", "recorda-1042");
    detail.reports[0].status = "DISMISSED";
    await adminServiceMock.updateReportStatus("USER", "user-1088", {
      reason: "Confirmado",
      status: "DISMISSED"
    });

    resetAdminServiceMock();

    const marina = await adminServiceMock.getReportDetail("RECORDA", "recorda-1042");
    const usuario2 = await adminServiceMock.getReportDetail("USER", "user-1088");
    expect(marina.reports[0].status).toBe("OPEN");
    expect(usuario2.reports.every((report) => report.status === "OPEN")).toBe(true);
    expect(usuario2.actions).toHaveLength(1);
  });
});

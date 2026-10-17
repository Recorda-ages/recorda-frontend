import { adminServiceMock } from "@/features/admin/services/adminService.mock";

describe("adminServiceMock", () => {
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
    expect(adminServiceMock.supportsReportSearch).toBe(true);

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
});

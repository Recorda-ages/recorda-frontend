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
    const byUsername = await adminServiceMock.listReportGroups({ query: "MARINA" });
    const byContent = await adminServiceMock.listReportGroups({ query: "perfil denunciado" });

    expect(byUsername.items).toEqual([
      expect.objectContaining({ targetUsername: "marina", targetType: "RECORDA" })
    ]);
    expect(byContent.items).toEqual([
      expect.objectContaining({ targetUsername: "usuario2", targetType: "USER" })
    ]);
  });

  it("honors an already aborted query", async () => {
    const controller = new AbortController();
    controller.abort();

    await expect(adminServiceMock.listUsers({}, controller.signal)).rejects.toMatchObject({
      name: "AbortError"
    });
  });
});

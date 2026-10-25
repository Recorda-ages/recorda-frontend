import {
  adminModerationService,
  adminUserService
} from "@/features/admin/services/adminUserService";
import { authApiClient } from "@/services/api";
jest.mock("@/services/api", () => ({ authApiClient: { get: jest.fn(), post: jest.fn() } }));
const admin = { role: "ADMIN" as const, user_id: "admin", username: "admin" };
beforeEach(() => jest.clearAllMocks());
it("sends search, status and offset pagination to the real admin route", async () => {
  const signal = new AbortController().signal;
  await adminUserService.list(
    { q: "ana & lu", status: "SUSPENDED", limit: 20, offset: 40 },
    signal
  );
  expect(authApiClient.get).toHaveBeenCalledWith(
    "/admin/users?q=ana+%26+lu&status=SUSPENDED&limit=20&offset=40",
    { signal }
  );
});
it.each(["suspendUser", "reactivateUser"] as const)(
  "%s adapts the status response by reloading detail",
  async (method) => {
    const detail = { user_id: "user-1", status: method === "suspendUser" ? "SUSPENDED" : "ACTIVE" };
    jest.mocked(authApiClient.post).mockResolvedValue({ status_code: 200, ...detail });
    jest.mocked(authApiClient.get).mockResolvedValue(detail);
    const payload = { reason: "A reason" };
    const result = await adminModerationService[method]("user-1", admin, payload);
    expect(authApiClient.post).toHaveBeenCalledWith(
      `/admin/users/user-1/${method === "suspendUser" ? "suspend" : "reactivate"}`,
      payload
    );
    expect(authApiClient.get).toHaveBeenCalledWith("/admin/users/user-1", { signal: undefined });
    expect(result).toEqual({ user: detail, detail });
  }
);
it("does not requery a failed moderation action", async () => {
  jest.mocked(authApiClient.post).mockRejectedValue(new Error("forbidden"));
  await expect(
    adminModerationService.suspendUser("user-1", admin, { reason: "Reason" })
  ).rejects.toThrow("forbidden");
  expect(authApiClient.get).not.toHaveBeenCalled();
});

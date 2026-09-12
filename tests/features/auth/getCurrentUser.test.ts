import { getCurrentUser } from "@/features/auth/api/getCurrentUser";
import { apiClient } from "@/services/api/client";

jest.mock("@/services/api/client", () => ({
  apiClient: { get: jest.fn() }
}));

describe("getCurrentUser", () => {
  it("requests /auth/me with the bearer token and abort signal", async () => {
    const signal = new AbortController().signal;
    const user = { account_type: "common", id: 1, username: "gabriel" };
    (apiClient.get as jest.Mock).mockResolvedValueOnce(user);

    await expect(getCurrentUser("token", signal)).resolves.toEqual(user);
    expect(apiClient.get).toHaveBeenCalledWith("/auth/me", {
      headers: { Authorization: "Bearer token" },
      signal
    });
  });
});

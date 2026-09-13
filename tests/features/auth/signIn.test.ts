import { signInUser } from "@/features/auth/api/signIn";
import { apiClient } from "@/services/api/client";

jest.mock("@/services/api/client", () => ({
  apiClient: {
    post: jest.fn()
  }
}));

describe("signInUser API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("calls the login endpoint with username and password", async () => {
    const mockResponse = {
      access_token: "jwt-login-token",
      token_type: "bearer",
      user: {
        account_type: "common",
        id: 1,
        username: "eduardo"
      }
    };

    (apiClient.post as jest.Mock).mockResolvedValueOnce(mockResponse);

    const result = await signInUser({
      password: "senha123",
      username: "eduardo"
    });

    expect(apiClient.post).toHaveBeenCalledWith("/auth/login", {
      password: "senha123",
      username: "eduardo"
    });
    expect(result).toEqual(mockResponse);
  });

  it("propagates API failures without a local authentication fallback", async () => {
    (apiClient.post as jest.Mock).mockRejectedValueOnce(new Error("API unavailable"));

    await expect(
      signInUser({
        password: "senha123",
        username: "admin"
      })
    ).rejects.toThrow("API unavailable");
  });
});

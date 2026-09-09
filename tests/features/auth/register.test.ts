import { registerUser } from "@/features/auth/api/register";
import { apiClient } from "@/services/api/client";
import { ApiError } from "@/services/api/errors";

jest.mock("@/services/api/client", () => ({
  apiClient: {
    post: jest.fn()
  }
}));

describe("registerUser API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("calls apiClient.post with the registration payload and returns response", async () => {
    const mockResponse = {
      access_token: "mock-token",
      token_type: "bearer",
      user: {
        account_type: "common",
        id: 1,
        username: "eduardo"
      }
    };

    (apiClient.post as jest.Mock).mockResolvedValueOnce(mockResponse);

    const result = await registerUser({
      email: "eduardo@example.com",
      name: "Eduardo",
      password: "password123",
      username: "eduardo"
    });

    expect(apiClient.post).toHaveBeenCalledWith("/auth/register", {
      email: "eduardo@example.com",
      name: "Eduardo",
      password: "password123",
      username: "eduardo"
    });
    expect(result).toEqual(mockResponse);
  });

  it("falls back to mock response in development when API returns 404", async () => {
    (apiClient.post as jest.Mock).mockRejectedValueOnce(
      new ApiError("NOT_FOUND", "Endpoint not found", 404, null)
    );

    const result = await registerUser({
      email: "test@example.com",
      name: "Test User",
      password: "password123",
      username: "testuser"
    });

    expect(result.access_token).toContain("mock_jwt_token_");
    expect(result.user.username).toBe("testuser");
  });

  it("throws conflict error in dev mock when username is 'duplicado'", async () => {
    (apiClient.post as jest.Mock).mockRejectedValueOnce(
      new ApiError("NOT_FOUND", "Endpoint not found", 404, null)
    );

    await expect(
      registerUser({
        email: "test@example.com",
        name: "Test User",
        password: "password123",
        username: "duplicado"
      })
    ).rejects.toThrow(ApiError);
  });

  it("throws conflict error in dev mock when email is 'duplicado@example.com'", async () => {
    (apiClient.post as jest.Mock).mockRejectedValueOnce(
      new ApiError("NOT_FOUND", "Endpoint not found", 404, null)
    );

    await expect(
      registerUser({
        email: "duplicado@example.com",
        name: "Test User",
        password: "password123",
        username: "testuser"
      })
    ).rejects.toThrow(ApiError);
  });

  it("throws 500 error in dev mock when email is 'erro@example.com'", async () => {
    (apiClient.post as jest.Mock).mockRejectedValueOnce(
      new ApiError("NOT_FOUND", "Endpoint not found", 404, null)
    );

    await expect(
      registerUser({
        email: "erro@example.com",
        name: "Test User",
        password: "password123",
        username: "testuser"
      })
    ).rejects.toThrow(ApiError);
  });

  it("rethrows unhandled errors if not dev fallback", async () => {
    (apiClient.post as jest.Mock).mockRejectedValueOnce(new Error("Unexpected error"));

    await expect(
      registerUser({
        email: "test@example.com",
        name: "Test",
        password: "password123",
        username: "test"
      })
    ).rejects.toThrow("Unexpected error");
  });
});

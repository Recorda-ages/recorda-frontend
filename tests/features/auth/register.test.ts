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
        role: "USER",
        user_id: "user-1",
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

  it("propagates ApiError when registration fails", async () => {
    const error = new ApiError("CONFLICT", "O nome de usuário já está em uso.", 409, {
      fields: [{ field: "username", message: "Este usuário já está cadastrado." }]
    });
    (apiClient.post as jest.Mock).mockRejectedValueOnce(error);

    await expect(
      registerUser({
        email: "test@example.com",
        name: "Test User",
        password: "password123",
        username: "duplicado"
      })
    ).rejects.toThrow(error);
  });

  it("rethrows unhandled errors", async () => {
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

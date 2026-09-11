import { requestPasswordRecovery } from "@/features/auth/api/passwordRecovery";
import { apiClient } from "@/services/api/client";

jest.mock("@/services/api/client", () => ({
  apiClient: {
    post: jest.fn()
  }
}));

describe("requestPasswordRecovery API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("posts the reset password payload expected by the backend", async () => {
    (apiClient.post as jest.Mock).mockResolvedValueOnce({
      message: "Senha redefinida com sucesso"
    });

    const response = await requestPasswordRecovery({
      email: " ana@example.com ",
      newPassword: "nova-senha-123"
    });

    expect(apiClient.post).toHaveBeenCalledWith("/auth/reset-password", {
      email: "ana@example.com",
      new_password: "nova-senha-123"
    });
    expect(response).toEqual({ message: "Senha redefinida com sucesso" });
  });

  it("propagates backend errors for the screen to display a generic message", async () => {
    const error = new Error("backend detail");
    (apiClient.post as jest.Mock).mockRejectedValueOnce(error);

    await expect(
      requestPasswordRecovery({
        email: "missing@example.com",
        newPassword: "nova-senha-123"
      })
    ).rejects.toBe(error);
  });
});

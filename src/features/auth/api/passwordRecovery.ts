import { apiClient } from "@/services/api/client";

export type PasswordRecoveryRequest = {
  email: string;
  newPassword: string;
};

export type PasswordRecoveryResponse = {
  message: string;
};

export async function requestPasswordRecovery(
  request: PasswordRecoveryRequest
): Promise<PasswordRecoveryResponse> {
  return apiClient.post<PasswordRecoveryResponse>("/auth/reset-password", {
    email: request.email.trim(),
    new_password: request.newPassword
  });
}

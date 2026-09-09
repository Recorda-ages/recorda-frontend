import { apiClient } from "@/services/api/client";
import { ApiError } from "@/services/api/errors";

export const AUTH_TOKEN_KEY = "auth_token";

export type RegisterRequest = {
  email: string;
  name: string;
  password: string;
  username: string;
};

export type UserBasicResponse = {
  account_type: string;
  id: number;
  username: string;
};

export type RegisterResponse = {
  access_token: string;
  token_type: string;
  user: UserBasicResponse;
};

export async function registerUser(payload: RegisterRequest): Promise<RegisterResponse> {
  try {
    const response = await apiClient.post<RegisterResponse>("/auth/register", payload);
    return response;
  } catch (error) {
    if (
      __DEV__ &&
      error instanceof ApiError &&
      (error.status === 404 || error.status === 501 || error.code === "NETWORK_ERROR")
    ) {
      if (payload.username.toLowerCase() === "duplicado") {
        throw new ApiError("CONFLICT", "O nome de usuário já está em uso.", 409, {
          fields: [{ field: "username", message: "Este usuário já está cadastrado." }]
        });
      }
      if (payload.email.toLowerCase() === "duplicado@example.com") {
        throw new ApiError("CONFLICT", "O email já está em uso.", 409, {
          fields: [{ field: "email", message: "Este email já está cadastrado." }]
        });
      }
      if (payload.email.toLowerCase() === "erro@example.com") {
        throw new ApiError("INTERNAL_SERVER_ERROR", "Erro no servidor simulado.", 500, null);
      }

      return {
        access_token: `mock_jwt_token_${Date.now()}`,
        token_type: "bearer",
        user: {
          account_type: "common",
          id: 1,
          username: payload.username
        }
      };
    }

    throw error;
  }
}

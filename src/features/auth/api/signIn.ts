import { apiClient } from "@/services/api/client";
import { ApiError } from "@/services/api/errors";

export type SignInRequest = {
  password: string;
  username: string;
};

export type UserBasicResponse = {
  account_type: string;
  id: number;
  username: string;
};

export type SignInResponse = {
  access_token: string;
  token_type: string;
  user: UserBasicResponse;
};

export async function signInUser(payload: SignInRequest): Promise<SignInResponse> {
  try {
    const response = await apiClient.post<SignInResponse>("/auth/login", payload);
    return response;
  } catch (error) {
    if (
      __DEV__ &&
      error instanceof ApiError &&
      (error.status === 404 || error.status === 501 || error.code === "NETWORK_ERROR")
    ) {
      if (payload.username.toLowerCase() === "invalido") {
        throw new ApiError("UNAUTHORIZED", "Usuário ou senha inválidos.", 401, null);
      }

      const isAdmin = payload.username.toLowerCase() === "admin";

      return {
        access_token: `mock_jwt_token_${Date.now()}`,
        token_type: "bearer",
        user: {
          account_type: isAdmin ? "admin" : "common",
          id: isAdmin ? 999 : 1,
          username: payload.username
        }
      };
    }

    throw error;
  }
}
import { apiClient } from "@/services/api/client";

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
  onboarding_completed?: boolean;
  username: string;
};

export type RegisterResponse = {
  access_token: string;
  token_type: string;
  user: UserBasicResponse;
};

export async function registerUser(payload: RegisterRequest): Promise<RegisterResponse> {
  return apiClient.post<RegisterResponse>("/auth/register", payload);
}

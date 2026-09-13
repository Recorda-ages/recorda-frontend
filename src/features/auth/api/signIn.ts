import { apiClient } from "@/services/api/client";

export type SignInRequest = {
  password: string;
  username: string;
};

export type UserBasicResponse = {
  account_type: string;
  id: number;
  onboarding_completed?: boolean;
  username: string;
};

export type SignInResponse = {
  access_token: string;
  token_type: string;
  user: UserBasicResponse;
};

export async function signInUser(payload: SignInRequest): Promise<SignInResponse> {
  return apiClient.post<SignInResponse>("/auth/login", payload);
}

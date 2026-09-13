import { apiClient } from "@/services/api/client";

import type { AuthSessionResponse } from "./types";

export type { UserBasicResponse } from "./types";

export type SignInRequest = {
  password: string;
  username: string;
};

export type SignInResponse = AuthSessionResponse;

export async function signInUser(payload: SignInRequest): Promise<SignInResponse> {
  return apiClient.post<SignInResponse>("/auth/login", payload);
}

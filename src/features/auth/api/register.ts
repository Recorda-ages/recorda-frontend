import { apiClient } from "@/services/api/client";

import type { AuthSessionResponse } from "./types";

export type { UserBasicResponse } from "./types";

export type RegisterRequest = {
  email: string;
  name: string;
  password: string;
  username: string;
};

export type RegisterResponse = AuthSessionResponse;

export async function registerUser(payload: RegisterRequest): Promise<RegisterResponse> {
  return apiClient.post<RegisterResponse>("/auth/register", payload);
}

import { useMutation } from "@tanstack/react-query";

import { secureStorage } from "@/services/storage";

import {
  AUTH_TOKEN_KEY,
  registerUser,
  type RegisterRequest,
  type RegisterResponse
} from "../api/register";

export function useSignUpMutation() {
  return useMutation<RegisterResponse, Error, RegisterRequest>({
    mutationFn: async (payload: RegisterRequest) => {
      const response = await registerUser(payload);
      if (response?.access_token) {
        await secureStorage.setItem(AUTH_TOKEN_KEY, response.access_token);
      }
      return response;
    }
  });
}

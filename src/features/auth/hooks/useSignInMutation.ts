import { useMutation } from "@tanstack/react-query";

import { secureStorage } from "@/services/storage";

import { signInUser, type SignInRequest, type SignInResponse } from "../api/signIn";

export const AUTH_TOKEN_KEY = "auth_token";
export const ACCOUNT_TYPE_KEY = "account_type";

export function useSignInMutation() {
  return useMutation<SignInResponse, Error, SignInRequest>({
    mutationFn: async (payload: SignInRequest) => {
      const response = await signInUser(payload);

      if (response?.access_token) {
        await secureStorage.setItem(AUTH_TOKEN_KEY, response.access_token);
        await secureStorage.setItem(ACCOUNT_TYPE_KEY, response.user.account_type);
      }

      return response;
    }
  });
}
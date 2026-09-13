import { useMutation } from "@tanstack/react-query";

import { registerUser, type RegisterRequest, type RegisterResponse } from "../api/register";
import { saveSession } from "../session";

export function useSignUpMutation() {
  return useMutation<RegisterResponse, Error, RegisterRequest>({
    mutationFn: async (payload: RegisterRequest) => {
      const response = await registerUser(payload);
      await saveSession(response);
      return response;
    }
  });
}

import { useMutation } from "@tanstack/react-query";

import { signInUser, type SignInRequest, type SignInResponse } from "../api/signIn";
import { saveSession } from "../session";

export function useSignInMutation() {
  return useMutation<SignInResponse, Error, SignInRequest>({
    mutationFn: async (payload: SignInRequest) => {
      const response = await signInUser(payload);
      await saveSession(response);
      return response;
    }
  });
}

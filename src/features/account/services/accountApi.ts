import { authApiClient } from "@/services/api";

export async function deleteOwnAccount() {
  await authApiClient.delete<null>("/users/me");
}

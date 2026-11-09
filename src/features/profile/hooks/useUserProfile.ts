import { useProfile } from "./useProfile";

/**
 * Another user's profile. `enabled` lets the screen skip the request when the route points
 * at the signed-in user, who is sent to "Profile" instead.
 */
export function useUserProfile(userId: string, enabled = true) {
  return useProfile(userId, enabled);
}

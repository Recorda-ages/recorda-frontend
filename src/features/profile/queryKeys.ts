/**
 * A profile as seen by the signed-in user. The own profile also uses the real `user_id`,
 * never "me", so opening oneself from anywhere hits the same cache entry.
 *
 * Invalidating this key also refreshes the profile's Recordas grid, which sits under it.
 */
export const profileQueryKey = (userId: string) => ["profile", userId] as const;

/** Paginated Recordas grid of a profile (`GET /users/{id}/recordas`). */
export const profileRecordasQueryKey = (userId: string) =>
  [...profileQueryKey(userId), "recordas"] as const;

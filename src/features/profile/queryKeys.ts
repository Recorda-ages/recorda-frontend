/** A profile as seen by the signed-in user (#255). Follow mutations invalidate it. */
export const profileQueryKey = (userId: string) => ["profile", userId] as const;

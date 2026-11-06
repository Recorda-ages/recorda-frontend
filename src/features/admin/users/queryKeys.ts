export const ADMIN_USERS_QUERY_KEY = ["admin", "users"] as const;

export const adminUserDetailQueryKey = (userId: string, adminId?: string) =>
  [...ADMIN_USERS_QUERY_KEY, "detail", adminId, userId] as const;

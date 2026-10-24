import { type InfiniteData, useInfiniteQuery } from "@tanstack/react-query";

import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { ADMIN_ROLE } from "@/features/auth/session";

import { ADMIN_USERS_QUERY_KEY } from "../queryKeys";
import { adminUsersServiceMock } from "../services/adminUsersService.mock";
import type { AdminUserStatus, AdminUsersPage } from "../../types";

export const ADMIN_USERS_PAGE_SIZE = 20;

export function useAdminUsers(query: string, status: AdminUserStatus | undefined) {
  const user = useCurrentUser();

  return useInfiniteQuery<
    AdminUsersPage,
    Error,
    InfiniteData<AdminUsersPage>,
    readonly unknown[],
    number
  >({
    enabled: user?.role === ADMIN_ROLE,
    getNextPageParam: (lastPage, pages) => {
      const loaded = pages.reduce((count, page) => count + page.items.length, 0);
      return loaded < lastPage.total ? loaded : undefined;
    },
    initialPageParam: 0,
    queryFn: ({ pageParam, signal }) =>
      adminUsersServiceMock.listUsers(
        {
          limit: ADMIN_USERS_PAGE_SIZE,
          offset: pageParam,
          q: query || undefined,
          status
        },
        signal
      ),
    queryKey: [...ADMIN_USERS_QUERY_KEY, user?.user_id, query, status],
    retry: (count) => count < 1,
    staleTime: 0
  });
}

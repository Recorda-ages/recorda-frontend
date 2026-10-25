import { useQuery } from "@tanstack/react-query";

import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { ADMIN_ROLE } from "@/features/auth/session";

import { adminUsersServiceMock } from "../services/adminUsersService.mock";
import type { AdminUserDetail } from "../../types";

import { adminUserDetailQueryKey } from "../queryKeys";

export function useAdminUserDetail(userId: string) {
  const user = useCurrentUser();

  return useQuery<AdminUserDetail>({
    enabled: user?.role === ADMIN_ROLE && userId.length > 0,
    queryFn: ({ signal }) => adminUsersServiceMock.getUserDetail(userId, signal),
    queryKey: adminUserDetailQueryKey(userId, user?.user_id),
    retry: (count) => count < 1,
    staleTime: 0
  });
}

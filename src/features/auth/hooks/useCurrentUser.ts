import { hashKey, useQueryClient } from "@tanstack/react-query";
import { useCallback, useSyncExternalStore } from "react";

import { AUTH_ME_QUERY_KEY, type CurrentUser } from "../api/getCurrentUser";

export function useCurrentUser() {
  const client = useQueryClient();
  const subscribe = useCallback(
    (notify: () => void) =>
      client.getQueryCache().subscribe((event) => {
        if (event.query.queryHash === hashKey(AUTH_ME_QUERY_KEY)) notify();
      }),
    [client]
  );
  const getSnapshot = useCallback(
    () => client.getQueryData<CurrentUser>(AUTH_ME_QUERY_KEY),
    [client]
  );

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

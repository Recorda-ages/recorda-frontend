import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react-native";
import type { ReactNode } from "react";

import { AUTH_ME_QUERY_KEY } from "@/features/auth/api/getCurrentUser";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";

function renderWithClient<T>(client: QueryClient, hook: () => T) {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return renderHook(hook, { wrapper });
}

it("follows the signed-in user until it is removed", () => {
  const client = new QueryClient();
  client.setQueryData(AUTH_ME_QUERY_KEY, { user_id: "user-1" });
  const { result } = renderWithClient(client, useCurrentUser);

  act(() => {
    client.setQueryData(AUTH_ME_QUERY_KEY, { user_id: "user-2" });
  });
  expect(result.current).toEqual({ user_id: "user-2" });

  act(() => {
    client.removeQueries({ queryKey: AUTH_ME_QUERY_KEY });
  });
  expect(result.current).toBeUndefined();
  act(() => client.clear());
});

it("ignores queries created while rendering after an account switch", () => {
  const consoleError = jest.spyOn(console, "error").mockImplementation(() => undefined);
  const client = new QueryClient();
  client.setQueryData(AUTH_ME_QUERY_KEY, { user_id: "user-1" });
  // A per-user query, built during the render triggered by the switch itself.
  renderWithClient(client, () => {
    const user = useCurrentUser();
    return useQuery({
      queryFn: () => new Promise<null>(() => undefined),
      queryKey: ["per-user", user?.user_id]
    });
  });

  act(() => {
    client.setQueryData(AUTH_ME_QUERY_KEY, { user_id: "user-2" });
  });

  const renderPhaseUpdates = consoleError.mock.calls.filter(([message]) =>
    String(message).includes("Cannot update a component")
  );
  expect(renderPhaseUpdates).toEqual([]);
  consoleError.mockRestore();
  act(() => client.clear());
});

import { QueryClient, QueryClientProvider, notifyManager } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import type { PropsWithChildren } from "react";

import { AUTH_ME_QUERY_KEY } from "@/features/auth/api/getCurrentUser";
import { useSettings } from "@/features/settings/hooks/useSettings";
import { SETTINGS_QUERY_KEY } from "@/features/settings/queryKeys";
import * as service from "@/features/settings/services/settingsService";
import type { SettingsUpdateResponse } from "@/features/settings/types";

notifyManager.setScheduler((cb) => cb());
let client: QueryClient;
const original = { is_private: true, language: "pt-BR" };
function setup() {
  client = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity, retry: false } } });
  client.setQueryData(AUTH_ME_QUERY_KEY, { user_id: "a" });
  jest.spyOn(service, "getSettings").mockResolvedValue(original);
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return renderHook(() => useSettings(), { wrapper });
}
afterEach(() => {
  client.clear();
  jest.restoreAllMocks();
});

it.each([true, false])(
  "does not write stale success/failure into another session (success=%s)",
  async (success) => {
    const { result } = setup();
    await waitFor(() => expect(result.current.settings.isSuccess).toBe(true));
    let resolve!: (response: SettingsUpdateResponse) => void;
    let reject!: (error: Error) => void;
    jest.spyOn(service, "updateSettings").mockImplementation(
      () =>
        new Promise((r, fail) => {
          resolve = r;
          reject = fail;
        })
    );
    const invalidate = jest.spyOn(client, "invalidateQueries");
    let mutation!: Promise<SettingsUpdateResponse>;
    act(() => {
      mutation = result.current.update.mutateAsync({ is_private: false });
    });
    const checked = success ? mutation : expect(mutation).rejects.toThrow("offline");
    await waitFor(() => expect(service.updateSettings).toHaveBeenCalled());
    const nextSettings = { is_private: false, language: "es" };
    act(() => {
      client.removeQueries({ queryKey: AUTH_ME_QUERY_KEY });
      client.setQueryData(AUTH_ME_QUERY_KEY, { user_id: "b" });
      client.setQueryData(SETTINGS_QUERY_KEY, nextSettings);
    });
    await act(async () => {
      if (success) resolve({ ...original, accepted_requests: 5 });
      else reject(new Error("offline"));
      await checked;
    });
    expect(client.getQueryData(SETTINGS_QUERY_KEY)).toEqual(nextSettings);
    expect(invalidate).not.toHaveBeenCalled();
  }
);

it("cancels the mutation if the session changes while cancelling a read", async () => {
  const { result } = setup();
  await waitFor(() => expect(result.current.settings.isSuccess).toBe(true));
  const patch = jest.spyOn(service, "updateSettings");
  let finish!: () => void;
  jest.spyOn(client, "cancelQueries").mockImplementation(
    () =>
      new Promise((r) => {
        finish = r;
      })
  );
  let mutation!: Promise<SettingsUpdateResponse>;
  act(() => {
    mutation = result.current.update.mutateAsync({ is_private: false });
  });
  const checked = expect(mutation).rejects.toThrow("Settings session changed");
  await waitFor(() => expect(client.cancelQueries).toHaveBeenCalled());
  act(() => client.removeQueries({ queryKey: AUTH_ME_QUERY_KEY }));
  await act(async () => {
    finish();
    await checked;
  });
  expect(patch).not.toHaveBeenCalled();
  expect(client.getQueryData(SETTINGS_QUERY_KEY)).toEqual(original);
});

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { AUTH_ME_QUERY_KEY } from "@/features/auth/api/getCurrentUser";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";

import { SETTINGS_QUERY_KEY } from "../queryKeys";
import { getSettings, updateSettings } from "../services/settingsService";
import type { SettingsUpdate, UserSettings } from "../types";

export function useSettings() {
  const queryClient = useQueryClient();
  const user = useCurrentUser();
  const settings = useQuery({
    enabled: Boolean(user?.user_id),
    queryKey: SETTINGS_QUERY_KEY,
    queryFn: ({ signal }) => getSettings(signal),
    refetchOnMount: "always"
  });
  const currentSession = () =>
    queryClient.getQueryCache().find({ queryKey: AUTH_ME_QUERY_KEY, exact: true });

  const update = useMutation({
    mutationFn: updateSettings,
    retry: false,
    onMutate: async (partial: SettingsUpdate) => {
      const session = currentSession();
      await queryClient.cancelQueries({ queryKey: SETTINGS_QUERY_KEY });
      if (session !== currentSession()) throw new Error("Settings session changed");
      const previous = queryClient.getQueryData<UserSettings>(SETTINGS_QUERY_KEY);
      queryClient.setQueryData<UserSettings>(SETTINGS_QUERY_KEY, (data) =>
        data ? { ...data, ...partial } : data
      );
      return { previous, session };
    },
    onError: (_error, _partial, context) => {
      if (context?.previous && context.session === currentSession()) {
        queryClient.setQueryData(SETTINGS_QUERY_KEY, context.previous);
      }
    },
    onSuccess: (data, _partial, context) => {
      if (!context || context.session !== currentSession()) return;
      queryClient.setQueryData<UserSettings>(SETTINGS_QUERY_KEY, {
        is_private: data.is_private,
        language: data.language
      });
      for (const queryKey of [["profile"], ["feed"], ["notifications"]]) {
        void queryClient.invalidateQueries({ queryKey });
      }
    }
  });

  return { settings, update };
}

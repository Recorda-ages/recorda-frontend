import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

import { AUTH_ME_QUERY_KEY, type CurrentUser } from "@/features/auth/api/getCurrentUser";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { SETTINGS_QUERY_KEY } from "@/features/settings/queryKeys";
import type { UserSettings } from "@/features/settings/types";
import type { AppLanguage } from "@/i18n";

import { chooseLanguage } from "../languagePreference";

export function useChangeLanguage() {
  const client = useQueryClient();
  const userId = useCurrentUser()?.user_id;

  return useCallback(
    async (language: AppLanguage) => {
      const synced = await chooseLanguage(language, userId);

      client.setQueryData<CurrentUser>(AUTH_ME_QUERY_KEY, (user) =>
        user ? { ...user, language } : user
      );

      if (synced) {
        client.setQueryData<UserSettings>(SETTINGS_QUERY_KEY, (settings) =>
          settings ? { ...settings, language } : settings
        );
      }
    },
    [client, userId]
  );
}

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { useToast } from "@/components/ui/ToastProvider";
import { getSessionGeneration } from "@/services/api/sessionLifecycle";

import { profileQueryKey } from "../queryKeys";
import { profileService } from "../services/profileService";
import type { ProfileRead } from "../types";

const INVALIDATE_ON_AVATAR_CHANGE = [["feed"], ["notifications"], ["users"]];

type AvatarUploadContext = {
  generation: number;
  previousAvatarUrl: string | null;
};

/**
 * Optimistic avatar upload (US28).
 *
 * onMutate: patches the profile cache with the local URI so the avatar
 * changes immediately. onError: rolls back to the previous URL and shows
 * a "Tentar de novo" toast. onSuccess: writes the server URL and
 * invalidates feed, notifications and user-search caches.
 */
export function useUploadAvatarMutation(userId: string) {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (localUri: string) => profileService.uploadAvatar(localUri),

    onError: (_error, _localUri, context) => {
      if (!context || context.generation !== getSessionGeneration()) return;

      queryClient.setQueryData<ProfileRead>(profileQueryKey(userId), (current) => {
        if (!current) return current;
        return { ...current, profile_picture_url: context.previousAvatarUrl };
      });

      showToast(t("profile.avatarUploadError"));
    },

    onMutate: async (localUri: string): Promise<AvatarUploadContext> => {
      const generation = getSessionGeneration();
      await queryClient.cancelQueries({ queryKey: profileQueryKey(userId) });

      if (generation !== getSessionGeneration()) throw new Error("Session ended");

      const current = queryClient.getQueryData<ProfileRead>(profileQueryKey(userId));
      const previousAvatarUrl = current?.profile_picture_url ?? null;

      queryClient.setQueryData<ProfileRead>(profileQueryKey(userId), (data) => {
        if (!data) return data;
        return { ...data, profile_picture_url: localUri };
      });

      return { generation, previousAvatarUrl };
    },

    onSuccess: (response, _localUri, context) => {
      if (!context || context.generation !== getSessionGeneration()) return;

      queryClient.setQueryData<ProfileRead>(profileQueryKey(userId), (data) => {
        if (!data) return data;
        return { ...data, profile_picture_url: response.profile_picture_url };
      });

      INVALIDATE_ON_AVATAR_CHANGE.forEach((key) => {
        void queryClient.invalidateQueries({ queryKey: key });
      });
    }
  });
}

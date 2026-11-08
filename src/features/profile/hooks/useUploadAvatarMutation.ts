import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Alert } from "react-native";

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
 * an alert with "Tentar de novo", which resends the same photo. onSuccess: writes the server URL and
 * invalidates feed, notifications and user-search caches.
 */
export function useUploadAvatarMutation(userId: string) {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const mutation = useMutation({
    mutationFn: (localUri: string) => profileService.uploadAvatar(localUri),

    onError: (_error, localUri, context) => {
      if (!context || context.generation !== getSessionGeneration()) return;

      queryClient.setQueryData<ProfileRead>(profileQueryKey(userId), (current) => {
        if (!current) return current;
        return { ...current, profile_picture_url: context.previousAvatarUrl };
      });

      Alert.alert(t("profile.avatarUploadError"), undefined, [
        { style: "cancel", text: t("profile.avatarPermissionCancel") },
        {
          // The alert can outlive the session; never resend a photo into another account.
          onPress: () => {
            if (context.generation === getSessionGeneration()) mutation.mutate(localUri);
          },
          text: t("profile.retry")
        }
      ]);
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

  return mutation;
}

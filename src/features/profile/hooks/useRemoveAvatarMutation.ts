import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { useToast } from "@/components/ui/ToastProvider";
import { getSessionGeneration } from "@/services/api/sessionLifecycle";

import { profileQueryKey } from "../queryKeys";
import { profileService } from "../services/profileService";
import type { ProfileRead } from "../types";

const INVALIDATE_ON_AVATAR_CHANGE = [["feed"], ["notifications"], ["users"]];

type RemoveAvatarContext = {
  generation: number;
  previousAvatarUrl: string | null;
};

/**
 * Removes the avatar optimistically (US28 D-05). Confirmation is handled in the UI
 * by RemoveAvatarDialog; this hook only performs the deletion and rollback.
 */
export function useRemoveAvatarMutation(userId: string) {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: () => profileService.deleteAvatar(),

    onError: (_error, _vars, context) => {
      if (!context || context.generation !== getSessionGeneration()) return;
      queryClient.setQueryData<ProfileRead>(profileQueryKey(userId), (current) => {
        if (!current) return current;
        return { ...current, profile_picture_url: context.previousAvatarUrl };
      });
      showToast(t("profile.avatarRemoveError"));
    },

    onMutate: async (): Promise<RemoveAvatarContext> => {
      const generation = getSessionGeneration();
      await queryClient.cancelQueries({ queryKey: profileQueryKey(userId) });
      if (generation !== getSessionGeneration()) throw new Error("Session ended");

      const current = queryClient.getQueryData<ProfileRead>(profileQueryKey(userId));
      const previousAvatarUrl = current?.profile_picture_url ?? null;

      queryClient.setQueryData<ProfileRead>(profileQueryKey(userId), (data) => {
        if (!data) return data;
        return { ...data, profile_picture_url: null };
      });

      return { generation, previousAvatarUrl };
    },

    onSuccess: (_response, _vars, context) => {
      if (!context || context.generation !== getSessionGeneration()) return;
      INVALIDATE_ON_AVATAR_CHANGE.forEach((key) => {
        void queryClient.invalidateQueries({ queryKey: key });
      });
    }
  });
}

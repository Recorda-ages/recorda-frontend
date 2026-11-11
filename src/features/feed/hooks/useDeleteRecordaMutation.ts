import { useMutation, useQueryClient } from "@tanstack/react-query";

import { invalidateMemoryCalendar } from "@/features/memories-calendar/queryKeys";
import { profileQueryKey } from "@/features/profile/queryKeys";
import { getSessionGeneration } from "@/services/api/sessionLifecycle";

import { recordaCommentsQueryKey, recordaDetailsQueryKey } from "../queryKeys";
import { feedService } from "../services/feedService";
import { useFeed } from "../state/FeedContext";

export type DeleteRecordaVariables = Readonly<{
  ownerId: string | undefined;
  recordaId: string;
}>;

export function useDeleteRecordaMutation(onDeleted?: () => void) {
  const queryClient = useQueryClient();
  const { deletePost } = useFeed();

  return useMutation({
    mutationFn: ({ recordaId }: DeleteRecordaVariables) => feedService.deleteRecorda(recordaId),
    onMutate: () => ({ generation: getSessionGeneration() }),
    onSuccess: (_result, { ownerId, recordaId }, context) => {
      deletePost(recordaId);
      queryClient.removeQueries({ queryKey: recordaDetailsQueryKey(recordaId) });
      queryClient.removeQueries({ queryKey: recordaCommentsQueryKey(recordaId) });
      void queryClient.invalidateQueries({ queryKey: ["feed"] });
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
      void invalidateMemoryCalendar(queryClient);
      void queryClient.invalidateQueries({ queryKey: ["user-metrics"] });
      void queryClient.invalidateQueries({ queryKey: ["memories-retrospective"] });
      if (ownerId && context?.generation === getSessionGeneration()) {
        void queryClient.invalidateQueries({ queryKey: profileQueryKey(ownerId) });
      }
      onDeleted?.();
    }
  });
}

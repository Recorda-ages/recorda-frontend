import { useMutation, useQueryClient } from "@tanstack/react-query";

import { removeFollower } from "../api/friendsApi";

export function useRemoveFollower(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (followerId: string) => removeFollower(followerId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["friends"] });
      void queryClient.invalidateQueries({ queryKey: ["users"] });
      void queryClient.invalidateQueries({ queryKey: ["feed"] });
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    }
  });
}

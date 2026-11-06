import { useEffect } from "react";
import { useNavigation } from "@react-navigation/native";
import { ApiError } from "@/services/api/errors";
import { useQuery } from "@tanstack/react-query";

import { recordaDetailsQueryKey } from "../queryKeys";
import { feedService } from "../services/feedService";

export function useRecordaDetails(recordaId: string, enabled: boolean) {
  const navigation = useNavigation();
  const query = useQuery({
    enabled,
    retry: (count, error) =>
      !(error instanceof ApiError && [401, 403, 404].includes(error.status)) && count < 1,
    staleTime: 0,
    refetchOnMount: "always",
    queryFn: ({ signal }) => feedService.getRecordaById(recordaId, signal),
    queryKey: recordaDetailsQueryKey(recordaId)
  });
  const { refetch } = query;
  useEffect(
    () =>
      navigation.addListener?.("focus", () => {
        if (enabled) void refetch();
      }),
    [enabled, navigation, refetch]
  );
  return query;
}

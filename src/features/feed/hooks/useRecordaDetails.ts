import { useQuery } from "@tanstack/react-query";

import { recordaDetailsQueryKey } from "../queryKeys";
import { feedService } from "../services/feedService";

export function useRecordaDetails(recordaId: string, enabled: boolean) {
  return useQuery({
    enabled,
    queryFn: ({ signal }) => feedService.getRecordaById(recordaId, signal),
    queryKey: recordaDetailsQueryKey(recordaId)
  });
}

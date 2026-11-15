import { useQuery } from "@tanstack/react-query";

import { musicService } from "../services/musicService";

export function usePopularArtists() {
  return useQuery({
    queryFn: ({ signal }) => musicService.getPopularArtists(signal),
    queryKey: ["music", "artists", "popular"],
    staleTime: 0
  });
}

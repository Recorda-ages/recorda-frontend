import { useQuery } from "@tanstack/react-query";
import { musicService } from "../services/musicService";

export function useArtistSearch(q: string) {
  return useQuery({
    queryKey: ["music", "artists", q],
    queryFn: () => musicService.searchArtists(q),
    enabled: q.trim().length > 0
  });
}

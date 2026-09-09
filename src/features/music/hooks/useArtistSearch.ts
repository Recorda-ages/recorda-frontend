import { useQuery } from "@tanstack/react-query";
import { musicService } from "../services/musicService";

export function useArtistSearch(q: string) {
  const query = q.trim();

  return useQuery({
    enabled: query.length > 0,
    queryFn: () => musicService.searchArtists(query),
    queryKey: ["music", "artists", query],
    staleTime: 0
  });
}

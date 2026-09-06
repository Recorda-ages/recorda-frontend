import { useQuery } from "@tanstack/react-query";
import { musicService } from "../services/musicService";

export function useGenres() {
  return useQuery({
    queryKey: ["music", "genres"],
    queryFn: () => musicService.getGenres(),
  });
}

import { apiClient } from "./client";
import { Artist } from "@/types/artist";

export interface DeezerArtistResponse {
  id: number;
  name: string;
  picture_url: string | null;
}

/**
 * Busca artistas utilizando a rota integrada com a API do Deezer no backend.
 * Rota: GET /api/v1/music/artists/search?q={query}
 * Sem mocks: propaga o erro exato caso ocorra falha na requisição.
 */
export async function searchArtists(query: string): Promise<Artist[]> {
  const trimmed = query.trim();
  if (!trimmed) {
    return [];
  }

  const response = await apiClient.get<DeezerArtistResponse[]>(
    `/music/artists/search?q=${encodeURIComponent(trimmed)}`
  );

  return (response ?? []).map((item) => ({
    id: String(item.id),
    name: item.name,
    imageUrl: item.picture_url ?? undefined
  }));
}

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { userSearchService } from "../services/userSearchService";

export function useUserSearch(q: string) {
  const query = q.trim();

  return useQuery({
    // O backend devolve `[]` para `q` vazio sem tocar o banco; não vale a
    // requisição. Sem texto de busca a tela mostra outro estado.
    enabled: query.length > 0,
    placeholderData: keepPreviousData,
    queryFn: ({ signal }) => userSearchService.searchUsers(query, signal),
    queryKey: ["users", "search", query],
    staleTime: 0
  });
}

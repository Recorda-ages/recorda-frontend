import { apiClient } from "@/services/api";

import type { Genre } from "../types";

export function getGenres() {
  return apiClient.get<Genre[]>("/music/genres");
}

export const RECORDA_DETAILS_QUERY_KEY = ["recorda", "details"] as const;

export const recordaDetailsQueryKey = (recordaId: string) =>
  [...RECORDA_DETAILS_QUERY_KEY, recordaId] as const;

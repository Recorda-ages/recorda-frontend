export const RECORDA_DETAILS_QUERY_KEY = ["recorda", "details"] as const;
export const RECORDA_COMMENTS_QUERY_KEY = ["recorda", "comments"] as const;

export const recordaDetailsQueryKey = (recordaId: string) =>
  [...RECORDA_DETAILS_QUERY_KEY, recordaId] as const;

export const recordaCommentsQueryKey = (recordaId: string) =>
  [...RECORDA_COMMENTS_QUERY_KEY, recordaId] as const;

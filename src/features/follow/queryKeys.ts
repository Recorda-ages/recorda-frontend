/**
 * Suggested profiles skip people already followed, so following/unfollowing affects them.
 * Deliberately outside the ["users"] prefix: follows invalidate that prefix, and a refetch
 * would drop a just-followed suggestion before its check mark is seen.
 */
export const USER_SUGGESTIONS_QUERY_KEY = ["suggestions", "users"] as const;

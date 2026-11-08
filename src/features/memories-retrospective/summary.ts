import type { RetrospectiveSummary } from "./components/RetrospectiveSummaryPoster";
import type { RetrospectiveDetailsResponse } from "./types";

/**
 * Names the period in the user's language ("2025", "outubro de 2026", "October 2026"),
 * because the API label is always in Portuguese ("Ano de 2025").
 */
export function formatRetrospectivePeriod(
  details: Pick<RetrospectiveDetailsResponse, "month" | "period_type" | "year">,
  language: string
): string {
  if (details.period_type === "YEARLY" || details.month === null) return String(details.year);

  return new Intl.DateTimeFormat(language, {
    month: "long",
    timeZone: "UTC",
    year: "numeric"
  }).format(new Date(Date.UTC(details.year, details.month - 1, 1)));
}

/** Reduces the retrospective details to the highlights shown on the summary poster. */
export function toRetrospectiveSummary(
  details: RetrospectiveDetailsResponse,
  language: string
): RetrospectiveSummary {
  return {
    activeDays: details.active_days,
    commentsReceived: details.engagement.comments_received,
    featuredSongTitle: details.featured_song?.song_title ?? null,
    likesReceived: details.engagement.likes_received,
    maxStreak: details.max_streak,
    periodLabel: formatRetrospectivePeriod(details, language),
    topArtistName: details.top_artists[0]?.artist_name ?? null,
    topGenreName: details.top_genres[0]?.genre_name ?? null,
    topTaggedUsername: details.tagged_users[0]?.username ?? null,
    totalRecordas: details.total_recordas
  };
}

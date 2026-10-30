import type { ProfileMetricsResponse } from "../types";

export const profileMetricsMock = {
  period: "30d",
  top_artist: { artist_name: "Liniker", memory_count: 12, image_url: null },
  top_genres: [
    { genre_name: "MPB", count: 15, percentage: 50 },
    { genre_name: "R&B", count: 9, percentage: 30 },
    { genre_name: "Pop", count: 6, percentage: 20 }
  ],
  streak: { current_streak_days: 14, last_post_date: "2026-10-29" }
} satisfies ProfileMetricsResponse;

export const emptyProfileMetricsMock: ProfileMetricsResponse = {
  period: "30d",
  top_artist: null,
  top_genres: [],
  streak: { current_streak_days: 0, last_post_date: null }
};

export const userMetricsServiceMock = {
  // shortcut: fixed sample totals for every period; replace when real period fixtures are available.
  getProfileMetrics: async (period: string): Promise<ProfileMetricsResponse> => ({
    ...profileMetricsMock,
    period,
    top_artist: { ...profileMetricsMock.top_artist },
    top_genres: profileMetricsMock.top_genres.map((genre) => ({ ...genre })),
    streak: { ...profileMetricsMock.streak }
  })
};

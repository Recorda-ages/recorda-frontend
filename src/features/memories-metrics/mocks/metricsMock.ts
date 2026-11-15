import type { ProfileMetricsResponse, UserMetricsService } from "../types";

export const profileMetricsMock = {
  period: "30d",
  total_recordas: 30,
  top_artist: { artist_name: "Liniker", memory_count: 12, image_url: null },
  top_artists: [
    { artist_name: "Liniker", memory_count: 12, image_url: null },
    { artist_name: "Djavan", memory_count: 9, image_url: null },
    { artist_name: "Anitta", memory_count: 9, image_url: null }
  ],
  top_genres: [
    { genre_name: "MPB", count: 15, percentage: 50 },
    { genre_name: "R&B", count: 9, percentage: 30 },
    { genre_name: "Pop", count: 6, percentage: 20 }
  ],
  monthly_distribution: [
    { year: 2026, month: 9, count: 8 },
    { year: 2026, month: 10, count: 22 }
  ],
  streak: { current_streak_days: 14, last_post_date: "2026-10-29" }
} satisfies ProfileMetricsResponse;

export const emptyProfileMetricsMock: ProfileMetricsResponse = {
  period: "30d",
  total_recordas: 0,
  top_artist: null,
  top_artists: [],
  top_genres: [],
  monthly_distribution: [],
  streak: { current_streak_days: 0, last_post_date: null }
};

export const userMetricsServiceMock: UserMetricsService = {
  getProfileMetrics: (period) =>
    Promise.resolve({
      ...profileMetricsMock,
      period,
      top_artist: { ...profileMetricsMock.top_artist },
      top_artists: profileMetricsMock.top_artists.map((artist) => ({ ...artist })),
      top_genres: profileMetricsMock.top_genres.map((genre) => ({ ...genre })),
      monthly_distribution: profileMetricsMock.monthly_distribution.map((month) => ({ ...month })),
      streak: { ...profileMetricsMock.streak }
    })
};

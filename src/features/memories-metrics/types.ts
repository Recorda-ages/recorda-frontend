export type TopArtistMetric = {
  artist_name: string;
  memory_count: number;
  image_url: string | null;
};

export type TopGenreItem = {
  genre_name: string;
  count: number;
  percentage: number;
};

export type DailyStreakMetric = {
  current_streak_days: number;
  last_post_date: string | null;
};

export type MonthlyCountMetric = {
  year: number;
  month: number;
  count: number;
};

export type ProfileMetricsResponse = {
  period: string;
  total_recordas: number;
  top_artist: TopArtistMetric | null;
  top_artists: TopArtistMetric[];
  top_genres: TopGenreItem[];
  monthly_distribution: MonthlyCountMetric[];
  streak: DailyStreakMetric;
};

export type UserMetricsService = {
  getProfileMetrics: (
    period: string,
    signal?: AbortSignal,
    userId?: string
  ) => Promise<ProfileMetricsResponse>;
};

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

export type ProfileMetricsResponse = {
  period: string;
  top_artist: TopArtistMetric | null;
  top_genres: TopGenreItem[];
  streak: DailyStreakMetric;
};

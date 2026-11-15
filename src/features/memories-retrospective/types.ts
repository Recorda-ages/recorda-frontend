export type RetrospectivePeriodType = "MONTHLY" | "YEARLY";

export type RetrospectivePeriod = {
  period_type: RetrospectivePeriodType;
  year: number;
  month: number | null;
  label: string;
  total_memories: number;
  is_preview: boolean;
};

export type RetrospectivePeriodSelection = Pick<
  RetrospectivePeriod,
  "month" | "period_type" | "year"
>;

export type AvailableRetrospectivesResponse = {
  periods: RetrospectivePeriod[];
};

export type RetrospectiveTopArtist = {
  artist_name: string;
  memory_count: number;
  image_url: string | null;
};

export type RetrospectiveTopGenre = {
  genre_name: string;
  count: number;
  percentage: number;
};

export type RetrospectiveTaggedUser = {
  user_id: string;
  username: string;
  profile_picture_url: string | null;
  tag_count: number;
};

export type RetrospectiveEngagement = {
  likes_received: number;
  comments_received: number;
};

export type RetrospectiveFeaturedSong = {
  deezer_track_id: string;
  song_title: string;
  song_artist_name: string;
  song_cover_url: string | null;
  song_preview_url: string | null;
  memory_count: number;
};

export type RetrospectiveDetailsResponse = {
  period_type: RetrospectivePeriodType;
  year: number;
  month: number | null;
  label: string;
  is_preview: boolean;
  total_recordas: number;
  active_days: number;
  top_artists: RetrospectiveTopArtist[];
  top_genres: RetrospectiveTopGenre[];
  tagged_users: RetrospectiveTaggedUser[];
  engagement: RetrospectiveEngagement;
  max_streak: number;
  featured_song: RetrospectiveFeaturedSong | null;
};

export type RetrospectiveService = {
  getAvailablePeriods: (signal?: AbortSignal) => Promise<AvailableRetrospectivesResponse>;
  getRetrospective: (
    period: RetrospectivePeriodSelection,
    signal?: AbortSignal
  ) => Promise<RetrospectiveDetailsResponse | null>;
};

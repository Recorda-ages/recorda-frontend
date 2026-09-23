export type FeedTab = "geral" | "following";

export type MediaType = "PHOTO" | "VIDEO";

export type FeedAuthor = {
  profile_picture_url: string | null;
  user_id: string;
  username: string;
};

export type FeedItem = {
  author: FeedAuthor;
  created_at: string;
  description: string | null;
  is_liked: boolean;
  likes_count: number;
  media_type: MediaType;
  media_url: string;
  recorda_id: string;
  song_artist_name: string;
  song_cover_url: string;
  song_preview_url: string | null;
  song_title: string;
};

export type FeedPage = {
  items: FeedItem[];
  next_cursor: string | null;
};

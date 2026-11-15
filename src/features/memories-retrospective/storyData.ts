import type { RetrospectiveDetailsResponse } from "./types";

/**
 * Formato dos dados consumidos pelos slides do Story Viewer.
 * Construído a partir de `RetrospectiveDetailsResponse` (FE.01 #288) via `toRetrospectiveStory`.
 */
export type RetrospectiveStory = {
  total_recordas: number;
  top_artists: { name: string; recordas_count: number }[];
  top_genres: { name: string; percentage: number }[];
  tagged_users: {
    user_id: string;
    username: string;
    avatar_url: string | null;
    tags_count: number;
  }[];
  engagement: { likes: number; comments: number };
  max_streak: number;
  featured_song: {
    title: string;
    artist_name: string;
    cover_url: string;
    preview_url: string | null;
  } | null;
};

/** Converte a resposta canônica da API de retrospectiva (#288) para o modelo de slides do Story Viewer. */
export function toRetrospectiveStory(details: RetrospectiveDetailsResponse): RetrospectiveStory {
  return {
    engagement: {
      comments: details.engagement.comments_received,
      likes: details.engagement.likes_received
    },
    featured_song: details.featured_song
      ? {
          artist_name: details.featured_song.song_artist_name,
          cover_url: details.featured_song.song_cover_url ?? "",
          preview_url: details.featured_song.song_preview_url,
          title: details.featured_song.song_title
        }
      : null,
    max_streak: details.max_streak,
    tagged_users: details.tagged_users.map((user) => ({
      avatar_url: user.profile_picture_url,
      tags_count: user.tag_count,
      user_id: user.user_id,
      username: user.username
    })),
    top_artists: details.top_artists.map((artist) => ({
      name: artist.artist_name,
      recordas_count: artist.memory_count
    })),
    top_genres: details.top_genres.map((genre) => ({
      name: genre.genre_name,
      percentage: genre.percentage
    })),
    total_recordas: details.total_recordas
  };
}

export const retrospectiveStoryMock: RetrospectiveStory = {
  total_recordas: 28,
  top_artists: [
    { name: "Daft Punk", recordas_count: 6 },
    { name: "The Beatles", recordas_count: 4 },
    { name: "Paramore", recordas_count: 3 },
    { name: "Billy Joel", recordas_count: 2 },
    { name: "Muse", recordas_count: 2 }
  ],
  top_genres: [
    { name: "Rock", percentage: 46 },
    { name: "Pop", percentage: 29 },
    { name: "Eletrônica", percentage: 15 },
    { name: "Jazz", percentage: 10 }
  ],
  tagged_users: [
    { user_id: "mock-pedro", username: "pedro", avatar_url: null, tags_count: 7 },
    { user_id: "mock-marina", username: "marina", avatar_url: null, tags_count: 5 },
    { user_id: "mock-joao", username: "joao", avatar_url: null, tags_count: 2 }
  ],
  engagement: { likes: 214, comments: 37 },
  max_streak: 12,
  featured_song: {
    title: "Harder, Better, Faster, Stronger",
    artist_name: "Daft Punk",
    cover_url:
      "https://cdn-images.dzcdn.net/images/cover/5718f7c81c27e0b2417e2a4c45224f8a/500x500-000000-80-0-0.jpg",
    preview_url: "/api/v1/music/tracks/3135556/preview"
  }
};

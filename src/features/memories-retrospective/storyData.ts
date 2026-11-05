/**
 * Dados do Story Viewer enquanto a FE.01 (#288) não entra na dev.
 *
 * ponytail: tipo e fixture locais e provisórios. Quando a #288 publicar `types.ts`,
 * `mocks/retrospectiveMock.ts` e os hooks, este arquivo sai e a tela passa a usá-los.
 * Os nomes dos campos seguem o contrato descrito na #288.
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

export const retrospectiveStoryMock: RetrospectiveStory = {
  total_recordas: 28,
  top_artists: [
    { name: "Billy Joel", recordas_count: 6 },
    { name: "The Beatles", recordas_count: 4 },
    { name: "Paramore", recordas_count: 3 },
    { name: "Daft Punk", recordas_count: 2 },
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
    title: "Vienna",
    artist_name: "Billy Joel",
    cover_url: "https://picsum.photos/seed/vienna/300/300",
    preview_url: "/api/v1/music/tracks/3135556/preview"
  }
};

import type { FeedPost } from "../types";

const unsplash = (id: string, width: number) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=70`;

export const mockFeedPosts: FeedPost[] = [
  {
    author: {
      avatarUrl: unsplash("photo-1500648767791-00dcc994a43e", 120),
      username: "lucas_almeida",
      id: "demo-lucas"
    },
    comments: [
      { id: "c1", text: "Show I-N-C-R-I-V-E-L!", username: "lucas_almeida" },
      { id: "c2", text: "Estava d+!", username: "jane_smith" }
    ],
    description: "Show I-N-C-R-I-V-E-L!",
    id: "post-1",
    likedBy: {
      avatarUrl: unsplash("photo-1506794778202-cad84cf45f1d", 60),
      username: "michael_jackson"
    },
    likesCount: 12,
    mediaUrl: unsplash("photo-1501386761578-eac5c94b800a", 900),
    publishedAt: "01 de janeiro",
    song: { artistName: "The American Dawn", title: "The Edge" },
    tabs: ["following", "forYou"]
  },
  {
    author: {
      avatarUrl: unsplash("photo-1531384441138-2736e62e0919", 120),
      username: "john_doe",
      id: "demo-john"
    },
    comments: [{ id: "c3", text: "Que vista!", username: "ana.souza" }],
    description: "Fim de tarde perfeito",
    id: "post-2",
    likedBy: {
      avatarUrl: unsplash("photo-1494790108377-be9c29b29330", 60),
      username: "ana.souza"
    },
    likesCount: 48,
    mediaUrl: unsplash("photo-1507525428034-b723cf961d3e", 900),
    publishedAt: "28 de dezembro",
    song: { artistName: "Imagine Dragons", title: "Take me to the beach" },
    tabs: ["following"]
  },
  {
    author: {
      avatarUrl: unsplash("photo-1494790108377-be9c29b29330", 120),
      username: "ana.souza",
      id: "demo-ana"
    },
    comments: [
      { id: "c4", text: "Saudade desse dia", username: "lucas_almeida" },
      { id: "c5", text: "Bora de novo?", username: "john_doe" }
    ],
    description: "Primeira vez no festival",
    id: "post-3",
    likedBy: {
      avatarUrl: unsplash("photo-1500648767791-00dcc994a43e", 60),
      username: "lucas_almeida"
    },
    likesCount: 105,
    mediaUrl: unsplash("photo-1470229722913-7c0e2dbbafd3", 900),
    publishedAt: "15 de dezembro",
    song: { artistName: "Tribalistas", title: "Velha Infância" },
    tabs: ["forYou"]
  },
  {
    author: {
      avatarUrl: unsplash("photo-1506794778202-cad84cf45f1d", 120),
      username: "michael_jackson",
      id: "demo-michael"
    },
    comments: [],
    description: "Estrada e trilha sonora",
    id: "post-4",
    likedBy: {
      avatarUrl: unsplash("photo-1531384441138-2736e62e0919", 60),
      username: "john_doe"
    },
    likesCount: 7,
    mediaUrl: unsplash("photo-1469854523086-cc02fe5d8800", 900),
    publishedAt: "02 de dezembro",
    song: { artistName: "Legião Urbana", title: "Tempo Perdido" },
    tabs: ["following", "forYou"]
  }
];

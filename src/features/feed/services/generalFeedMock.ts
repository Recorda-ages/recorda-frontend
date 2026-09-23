// =============================================================================
// TEMP — RUNTIME SCAFFOLDING ONLY (T-E4.US15.FE.01 / #164)
//
// GET /feed/general does not exist in the backend yet. This file stands in for
// it so the "Para Você" tab can be built and reviewed end to end. It is
// consumed ONLY by feedService.getGeneralFeed; no component or hook knows it exists.
//
// - Each page below represents an already-mixed server result. The real endpoint
//   decides ordering/mixing; the frontend must never merge Following + Discovery.
// - The cursor/pagination shape (`next_cursor`, opaque string, `?cursor=`) is COPIED
//   from /feed/following as an ASSUMPTION. It MUST be validated against the real
//   /feed/general contract before integration.
//
// REMOVAL: delete this file and replace the body of feedService.getGeneralFeed
// with the real authenticated GET /feed/general call.
// =============================================================================
import type { FeedPage } from "../types";

const SECOND_PAGE_CURSOR = "mock-general-cursor-2";

const FIRST_PAGE: FeedPage = {
  items: [
    {
      author: {
        profile_picture_url:
          "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=70",
        user_id: "mock-general-user-1",
        username: "lucas_almeida"
      },
      created_at: "2026-09-23T15:10:00Z",
      description: "Show I-N-C-R-I-V-E-L!",
      is_liked: true,
      likes_count: 24,
      media_type: "PHOTO",
      media_url:
        "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=900&q=70",
      recorda_id: "mock-general-1",
      song_artist_name: "The American Dawn",
      song_cover_url: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=200",
      song_preview_url: null,
      song_title: "The Edge"
    },
    {
      author: {
        profile_picture_url:
          "https://images.unsplash.com/photo-1531384441138-2736e62e0919?auto=format&fit=crop&w=120&q=70",
        user_id: "mock-general-user-2",
        username: "marina.costa"
      },
      created_at: "2026-09-23T11:42:00Z",
      description: null,
      is_liked: false,
      likes_count: 0,
      media_type: "VIDEO",
      media_url:
        "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      recorda_id: "mock-general-2",
      song_artist_name: "Legião Urbana",
      song_cover_url: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=200",
      song_preview_url: null,
      song_title: "Tempo Perdido"
    },
    {
      author: {
        profile_picture_url: null,
        user_id: "mock-general-user-3",
        username: "ana.souza"
      },
      created_at: "2026-09-22T20:05:00Z",
      description: "Primeira vez no festival",
      is_liked: false,
      likes_count: 1,
      media_type: "PHOTO",
      media_url:
        "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=900&q=70",
      recorda_id: "mock-general-3",
      song_artist_name: "Tribalistas",
      song_cover_url: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=200",
      song_preview_url: null,
      song_title: "Velha Infância"
    },
    {
      author: {
        profile_picture_url:
          "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=120&q=70",
        user_id: "mock-general-user-4",
        username: "rafa_santos"
      },
      created_at: "2026-09-22T09:30:00Z",
      description: null,
      is_liked: true,
      likes_count: 130,
      media_type: "PHOTO",
      media_url:
        "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=70",
      recorda_id: "mock-general-4",
      song_artist_name: "Imagine Dragons",
      song_cover_url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=200",
      song_preview_url: null,
      song_title: "Take Me to the Beach"
    }
  ],
  next_cursor: SECOND_PAGE_CURSOR
};

const SECOND_PAGE: FeedPage = {
  items: [
    {
      author: {
        profile_picture_url: null,
        user_id: "mock-general-user-5",
        username: "jane_smith"
      },
      created_at: "2026-09-21T18:15:00Z",
      description: null,
      is_liked: false,
      likes_count: 7,
      media_type: "PHOTO",
      media_url:
        "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=900&q=70",
      recorda_id: "mock-general-5",
      song_artist_name: "The National",
      song_cover_url: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=200",
      song_preview_url: null,
      song_title: "Fake Empire"
    },
    {
      author: {
        profile_picture_url:
          "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=70",
        user_id: "mock-general-user-6",
        username: "carol.mendes"
      },
      created_at: "2026-09-20T22:00:00Z",
      description: "Estrada e trilha sonora",
      is_liked: true,
      likes_count: 58,
      media_type: "VIDEO",
      media_url:
        "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      recorda_id: "mock-general-6",
      song_artist_name: "Djavan",
      song_cover_url: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=200",
      song_preview_url: null,
      song_title: "Oceano"
    },
    {
      author: {
        profile_picture_url:
          "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=70",
        user_id: "mock-general-user-7",
        username: "john_doe"
      },
      created_at: "2026-09-19T13:20:00Z",
      description: "Fim de tarde perfeito",
      is_liked: false,
      likes_count: 3,
      media_type: "PHOTO",
      media_url:
        "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=70",
      recorda_id: "mock-general-7",
      song_artist_name: "Los Hermanos",
      song_cover_url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=200",
      song_preview_url: null,
      song_title: "Anna Júlia"
    }
  ],
  next_cursor: null
};

export function getMockGeneralFeedPage(cursor: string | null): FeedPage {
  if (cursor === null) {
    return FIRST_PAGE;
  }

  if (cursor === SECOND_PAGE_CURSOR) {
    return SECOND_PAGE;
  }

  throw new Error(`Unknown mock general feed cursor: ${cursor}`);
}

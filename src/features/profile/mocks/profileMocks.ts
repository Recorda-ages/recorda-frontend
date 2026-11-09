import type { ProfileRead, RecordaGridPage } from "../types";

/**
 * Contract C-2 sample data, so the profile screens and components can run without the back.
 * Not wired into any screen.
 */
export const mockOpenProfile: ProfileRead = {
  can_view_content: true,
  counts: { followers: 42, following: 18, recordas: 2 },
  favorite_song: {
    artist_name: "Gilberto Gil",
    cover_url: "https://cdn-images.dzcdn.net/images/cover/aquele-abraco.jpg",
    deezer_track_id: "1000001",
    preview_url: null,
    title: "Aquele Abraço"
  },
  is_private: false,
  name: "Ana Souza",
  profile_picture_url: null,
  relationship: { follow_id: null, follow_status: "nenhuma", is_self: false },
  streak: { current_days: 5, published_today: false },
  user_id: "mock-user-ana",
  username: "anasouza"
};

/** The signed-in user's own profile: `is_self` and the counters always visible. */
export const mockOwnProfile: ProfileRead = {
  ...mockOpenProfile,
  name: "Natalia Costa",
  relationship: { follow_id: null, follow_status: "nenhuma", is_self: true },
  user_id: "mock-user-natalia",
  username: "nataliacosta"
};

/** A private account the viewer doesn't follow: no counters, no content. */
export const mockPrivateProfile: ProfileRead = {
  ...mockOpenProfile,
  can_view_content: false,
  counts: null,
  is_private: true,
  name: "Bruno Lima",
  streak: null,
  user_id: "mock-user-bruno",
  username: "brunolima"
};

/** First and only page of a grid: one photo and one video. */
export const mockRecordaGridPage: RecordaGridPage = {
  items: [
    {
      created_at: "2026-11-02T18:30:00Z",
      media_type: "PHOTO",
      media_url: "/api/v1/recordas/media/mock-photo.jpg",
      recorda_id: "mock-recorda-photo",
      song_artist_name: "Gilberto Gil",
      song_cover_url: "https://cdn-images.dzcdn.net/images/cover/aquele-abraco.jpg",
      song_title: "Aquele Abraço"
    },
    {
      created_at: "2026-11-01T09:15:00Z",
      media_type: "VIDEO",
      media_url: "/api/v1/recordas/media/mock-video.mp4",
      recorda_id: "mock-recorda-video",
      song_artist_name: "Gal Costa",
      song_cover_url: "https://cdn-images.dzcdn.net/images/cover/baby.jpg",
      song_title: "Baby"
    }
  ],
  next_cursor: null
};

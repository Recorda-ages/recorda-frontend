import type { FeedItem } from "@/features/feed/types";
import type { RecordaViewData } from "@/features/recorda-view/types";

export const CURRENT_USER_ID = "john-doe";

export const recordaViewMock: RecordaViewData = {
  author: {
    avatarUrl: "https://i.pravatar.cc/160?img=12",
    id: "john-doe",
    username: "john_doe"
  },
  comments: [
    {
      authorId: "john-doe",
      id: "comment-1",
      text: "Fui no melhor show da minha vida hoje!",
      username: "john_doe"
    },
    {
      authorId: "jane-smith",
      id: "comment-2",
      text: "Eu também fui!",
      username: "jane_smith"
    }
  ],
  description: "Fui no melhor show da minha vida hoje!",
  id: "recorda-mock-1",
  mediaUrl:
    "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1200&q=85",
  song: {
    artistName: "Imagine Dragons",
    lyrics: [
      "People-pleasin' planet",
      "Got a million people saying how to plan it",
      "I can no longer stand it",
      "Gonna spend my days tellin' them to can it",
      "Each and to their own"
    ],
    title: "Take me to the beach"
  }
};

export const generalFeedMock: FeedItem = {
  author: {
    profile_picture_url: recordaViewMock.author.avatarUrl,
    user_id: recordaViewMock.author.id,
    username: recordaViewMock.author.username
  },
  created_at: "2026-09-25T12:00:00Z",
  description: recordaViewMock.description,
  is_liked: false,
  likes_count: 128,
  media_type: "PHOTO",
  media_url: recordaViewMock.mediaUrl,
  recorda_id: recordaViewMock.id,
  song_artist_name: recordaViewMock.song.artistName,
  song_cover_url: "",
  song_preview_url: null,
  song_title: recordaViewMock.song.title
};

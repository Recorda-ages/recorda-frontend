import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { Pressable, Text } from "react-native";

import { useRecordaLikeMutation } from "@/features/feed/hooks/useRecordaLikeMutation";
import { recordaDetailsQueryKey } from "@/features/feed/queryKeys";
import { feedService } from "@/features/feed/services/feedService";
import type { FeedItem, FeedPage, RecordaDetailResponse } from "@/features/feed/types";

const recordaId = "11111111-1111-4111-8111-111111111111";
let queryClient: QueryClient | undefined;

const FEED_ITEM: FeedItem = {
  author: { profile_picture_url: null, user_id: "user-1", username: "ana" },
  created_at: "2026-01-01T12:00:00Z",
  description: null,
  is_liked: false,
  likes_count: 4,
  media_type: "PHOTO",
  media_url: "/media.jpg",
  recorda_id: recordaId,
  song_artist_name: "Artist",
  song_cover_url: "",
  song_preview_url: null,
  song_title: "Song"
};

const FEED_PAGE: FeedPage = { items: [FEED_ITEM], next_cursor: null };
const FEED_CACHE = { pages: [FEED_PAGE], pageParams: [null] };

function MutationButton() {
  const mutation = useRecordaLikeMutation();

  return (
    <Pressable onPress={() => void mutation.mutateAsync({ isLiked: true, recordaId })}>
      <Text>Like</Text>
    </Pressable>
  );
}

describe("useRecordaLikeMutation", () => {
  afterEach(() => {
    queryClient?.clear();
    queryClient = undefined;
    jest.restoreAllMocks();
  });

  it("updates both feed caches and the detail cache with the server response", async () => {
    queryClient = new QueryClient({
      defaultOptions: {
        mutations: { gcTime: Infinity },
        queries: { gcTime: Infinity, retry: false }
      }
    });
    const setRecordaLike = jest
      .spyOn(feedService, "setRecordaLike")
      .mockResolvedValue({ is_liked: true, likes_count: 5 });
    const detail = {
      author: { avatar_url: null, user_id: "user-1", username: "ana" },
      created_at: FEED_ITEM.created_at,
      deezer_track_id: "track-1",
      description: null,
      is_liked: false,
      likes_count: 4,
      media_type: "PHOTO",
      media_url: FEED_ITEM.media_url,
      recorda_id: recordaId,
      song_artist_name: "Artist",
      song_cover_url: "",
      song_preview_url: null,
      song_title: "Song"
    } satisfies RecordaDetailResponse;
    queryClient.setQueryData(["feed", "general"], FEED_CACHE);
    queryClient.setQueryData(["feed", "following"], FEED_CACHE);
    queryClient.setQueryData(recordaDetailsQueryKey(recordaId), detail);

    render(
      <QueryClientProvider client={queryClient}>
        <MutationButton />
      </QueryClientProvider>
    );
    fireEvent.press(screen.getByText("Like"));

    await waitFor(() => {
      expect(setRecordaLike).toHaveBeenCalledWith(recordaId, true);
      expect(
        queryClient?.getQueryData<typeof FEED_CACHE>(["feed", "general"])?.pages[0].items[0]
      ).toMatchObject({ is_liked: true, likes_count: 5 });
    });
    for (const feed of ["general", "following"]) {
      const data = queryClient.getQueryData<typeof FEED_CACHE>(["feed", feed]);
      expect(data?.pages[0].items[0]).toMatchObject({ is_liked: true, likes_count: 5 });
    }
    expect(
      queryClient.getQueryData<RecordaDetailResponse>(recordaDetailsQueryKey(recordaId))
    ).toMatchObject({
      is_liked: true,
      likes_count: 5
    });
  });
});

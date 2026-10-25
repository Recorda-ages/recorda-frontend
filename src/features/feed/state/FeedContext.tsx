import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";

import { onPrivateStateReset } from "@/services/api/sessionLifecycle";
import { i18n } from "@/i18n";
import { resolveApiAssetUrl } from "@/services/api";

import type { FeedItem, FeedPost, RecordaDetailResponse } from "../types";
import { formatFeedDate } from "../utils/formatFeedDate";

type FeedState = {
  posts: FeedPost[];
  likedIds: string[];
  deletedIds: string[];
  openFeedItem: (item: FeedItem) => void;
  setLikeState: (id: string, liked: boolean, likesCount?: number) => void;
  deletePost: (id: string) => void;
};

const FeedContext = createContext<FeedState | null>(null);

export function recordaDetailToFeedItem(detail: RecordaDetailResponse): FeedItem {
  return {
    author: {
      profile_picture_url: detail.author.avatar_url,
      user_id: detail.author.user_id,
      username: detail.author.username
    },
    created_at: detail.created_at,
    description: detail.description,
    is_liked: detail.is_liked,
    likes_count: detail.likes_count,
    media_type: detail.media_type,
    media_url: detail.media_url,
    recorda_id: detail.recorda_id,
    song_artist_name: detail.song_artist_name,
    song_cover_url: detail.song_cover_url,
    song_preview_url: detail.song_preview_url,
    song_title: detail.song_title
  };
}

export function feedItemToFeedPost(item: FeedItem): FeedPost {
  return {
    author: {
      id: item.author.user_id,
      avatarUrl: item.author.profile_picture_url
        ? resolveApiAssetUrl(item.author.profile_picture_url)
        : "",
      username: item.author.username
    },
    comments: [],
    createdAt: item.created_at,
    description: item.description ?? "",
    id: item.recorda_id,
    likedBy: { avatarUrl: "", username: "" },
    likesCount: item.likes_count - (item.is_liked ? 1 : 0),
    mediaType: item.media_type,
    mediaUrl: resolveApiAssetUrl(item.media_url),
    previewUrl: item.song_preview_url,
    // Same format as the feed card, in the app's language rather than the device's.
    publishedAt: formatFeedDate(item.created_at, i18n.language),
    song: {
      artistName: item.song_artist_name,
      coverUrl: item.song_cover_url || null,
      title: item.song_title
    },
    tabs: ["following"]
  };
}

export function FeedProvider({ children }: PropsWithChildren) {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [likedIds, setLikedIds] = useState<string[]>([]);
  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  useEffect(
    () =>
      onPrivateStateReset(() => {
        setPosts([]);
        setLikedIds([]);
        setDeletedIds([]);
      }),
    []
  );

  const openFeedItem = useCallback((item: FeedItem) => {
    const post = feedItemToFeedPost(item);
    setPosts((current) => {
      const existing = current.find((candidate) => candidate.id === post.id);
      return existing
        ? current.map((candidate) =>
            candidate.id === post.id ? { ...post, comments: existing.comments } : candidate
          )
        : [...current, post];
    });
    setLikedIds((current) =>
      item.is_liked
        ? current.includes(post.id)
          ? current
          : [...current, post.id]
        : current.filter((value) => value !== post.id)
    );
  }, []);

  const setLikeState = useCallback((id: string, liked: boolean, likesCount?: number) => {
    setLikedIds((current) =>
      liked
        ? current.includes(id)
          ? current
          : [...current, id]
        : current.filter((value) => value !== id)
    );

    if (likesCount !== undefined) {
      setPosts((current) =>
        current.map((post) =>
          post.id === id ? { ...post, likesCount: likesCount - (liked ? 1 : 0) } : post
        )
      );
    }
  }, []);

  const deletePost = useCallback((id: string) => {
    setPosts((current) => current.filter((post) => post.id !== id));
    setDeletedIds((current) => (current.includes(id) ? current : [...current, id]));
  }, []);

  const value = useMemo(
    () => ({
      posts,
      likedIds,
      deletedIds,
      openFeedItem,
      setLikeState,
      deletePost
    }),
    [posts, likedIds, deletedIds, openFeedItem, setLikeState, deletePost]
  );

  return <FeedContext.Provider value={value}>{children}</FeedContext.Provider>;
}

export function useFeed() {
  const value = useContext(FeedContext);
  if (!value) throw new Error("useFeed must be used within FeedProvider");
  return value;
}

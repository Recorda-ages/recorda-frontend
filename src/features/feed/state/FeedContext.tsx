import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";

import { queryClient } from "@/app/providers/queryClient";
import { AUTH_ME_QUERY_KEY } from "@/features/auth/api/getCurrentUser";
import type { UserBasicResponse } from "@/features/auth/api/types";
import { resolveApiAssetUrl } from "@/services/api";

import { mockFeedPosts } from "../mocks/feedPosts";
import type { FeedItem, FeedPost, RecordaDetailResponse } from "../types";

// Fallback identity for the local preview without an authenticated session.
export const demoFeedUser = { id: "demo-lucas", username: "lucas_almeida" };

type FeedState = {
  posts: FeedPost[];
  likedIds: string[];
  currentUser: typeof demoFeedUser;
  deletedIds: string[];
  openFeedItem: (item: FeedItem) => void;
  toggleLike: (id: string) => void;
  setLikeState: (id: string, liked: boolean, likesCount?: number) => void;
  addComment: (id: string, text: string) => void;
  deletePost: (id: string) => void;
};

const FeedContext = createContext<FeedState | null>(null);

const STANDALONE_FEED_SESSION = "standalone";

function getFeedSessionId() {
  return (
    queryClient.getQueryData<UserBasicResponse>(AUTH_ME_QUERY_KEY)?.user_id ??
    STANDALONE_FEED_SESSION
  );
}

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
    description: item.description ?? "",
    id: item.recorda_id,
    likedBy: { avatarUrl: "", username: "" },
    likesCount: item.likes_count - (item.is_liked ? 1 : 0),
    mediaType: item.media_type,
    mediaUrl: resolveApiAssetUrl(item.media_url),
    previewUrl: item.song_preview_url,
    publishedAt: new Date(item.created_at).toLocaleDateString(undefined, {
      day: "2-digit",
      month: "long"
    }),
    song: { artistName: item.song_artist_name, title: item.song_title },
    tabs: ["following"]
  };
}

export function FeedProvider({ children }: PropsWithChildren) {
  const [posts, setPosts] = useState(mockFeedPosts);
  const [likedIds, setLikedIds] = useState<string[]>([]);
  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const nextComment = useRef(0);
  const feedSessionId = useRef(getFeedSessionId());

  useEffect(() => {
    return queryClient.getQueryCache().subscribe((event) => {
      const [scope, resource] = event.query.queryKey;

      if (scope === AUTH_ME_QUERY_KEY[0] && resource === AUTH_ME_QUERY_KEY[1]) {
        const nextSessionId = getFeedSessionId();

        if (feedSessionId.current === nextSessionId) {
          return;
        }

        feedSessionId.current = nextSessionId;
        nextComment.current = 0;
        setPosts(mockFeedPosts);
        setLikedIds([]);
        setDeletedIds([]);
      }
    });
  }, []);

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

  const toggleLike = useCallback((id: string) => {
    setLikedIds((ids) => (ids.includes(id) ? ids.filter((value) => value !== id) : [...ids, id]));
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

  const addComment = useCallback((id: string, value: string) => {
    const text = value.trim();
    if (!text) return;
    const comment = {
      id: `local-comment-${++nextComment.current}`,
      text,
      username:
        queryClient.getQueryData<UserBasicResponse>(AUTH_ME_QUERY_KEY)?.username ??
        demoFeedUser.username,
      avatarUrl: null,
      createdAt: new Date().toISOString()
    };
    setPosts((current) =>
      current.map((post) =>
        post.id === id ? { ...post, comments: [...post.comments, comment] } : post
      )
    );
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
      currentUser: demoFeedUser,
      openFeedItem,
      toggleLike,
      setLikeState,
      addComment,
      deletePost
    }),
    [posts, likedIds, deletedIds, openFeedItem, toggleLike, setLikeState, addComment, deletePost]
  );

  return <FeedContext.Provider value={value}>{children}</FeedContext.Provider>;
}

export function useFeed() {
  const value = useContext(FeedContext);
  if (!value) throw new Error("useFeed must be used within FeedProvider");
  return value;
}

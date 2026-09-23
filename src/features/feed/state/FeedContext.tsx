import { createContext, type PropsWithChildren, useContext, useRef, useState } from "react";

import { queryClient } from "@/app/providers/queryClient";
import { AUTH_ME_QUERY_KEY } from "@/features/auth/api/getCurrentUser";
import type { UserBasicResponse } from "@/features/auth/api/types";
import { resolveApiAssetUrl } from "@/services/api";

import { mockFeedPosts } from "../mocks/feedPosts";
import type { FeedItem, FeedPost } from "../types";

// Fallback identity for the local preview without an authenticated session.
export const demoFeedUser = { id: "demo-lucas", username: "lucas_almeida" };

type FeedState = {
  posts: FeedPost[];
  likedIds: string[];
  currentUser: typeof demoFeedUser;
  deletedIds: string[];
  openFeedItem: (item: FeedItem) => void;
  toggleLike: (id: string) => void;
  addComment: (id: string, text: string) => void;
  deletePost: (id: string) => void;
};

const FeedContext = createContext<FeedState | null>(null);

export function FeedProvider({ children }: PropsWithChildren) {
  const [posts, setPosts] = useState(mockFeedPosts);
  const [likedIds, setLikedIds] = useState<string[]>([]);
  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const nextComment = useRef(0);

  const openFeedItem = (item: FeedItem) => {
    const post: FeedPost = {
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
      publishedAt: new Date(item.created_at).toLocaleDateString(undefined, {
        day: "2-digit",
        month: "long"
      }),
      song: { artistName: item.song_artist_name, title: item.song_title },
      tabs: ["following"]
    };
    setPosts((current) =>
      current.some((existing) => existing.id === post.id) ? current : [...current, post]
    );
    if (item.is_liked && !posts.some((existing) => existing.id === post.id)) {
      setLikedIds((current) => (current.includes(post.id) ? current : [...current, post.id]));
    }
  };

  const toggleLike = (id: string) => {
    setLikedIds((ids) => (ids.includes(id) ? ids.filter((value) => value !== id) : [...ids, id]));
  };

  const addComment = (id: string, value: string) => {
    const text = value.trim();
    if (!text) return;
    const comment = {
      id: `local-comment-${++nextComment.current}`,
      text,
      username:
        queryClient.getQueryData<UserBasicResponse>(AUTH_ME_QUERY_KEY)?.username ??
        demoFeedUser.username
    };
    setPosts((current) =>
      current.map((post) =>
        post.id === id ? { ...post, comments: [...post.comments, comment] } : post
      )
    );
  };

  const deletePost = (id: string) => {
    setPosts((current) => current.filter((post) => post.id !== id));
    setDeletedIds((current) => [...current, id]);
  };

  return (
    <FeedContext.Provider
      value={{
        posts,
        likedIds,
        deletedIds,
        currentUser: demoFeedUser,
        openFeedItem,
        toggleLike,
        addComment,
        deletePost
      }}
    >
      {children}
    </FeedContext.Provider>
  );
}

export function useFeed() {
  const value = useContext(FeedContext);
  if (!value) throw new Error("useFeed must be used within FeedProvider");
  return value;
}

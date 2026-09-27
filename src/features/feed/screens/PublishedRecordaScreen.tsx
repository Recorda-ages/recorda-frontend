import { type RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import type { RootStackParamList } from "@/app/navigation/RootNavigator";
import { AppText, Button, ErrorState, Loading } from "@/components/ui";
import { AUTH_ME_QUERY_KEY } from "@/features/auth/api/getCurrentUser";
import type { UserBasicResponse } from "@/features/auth/api/types";
import { colors, spacing } from "@/theme";
import { resolveApiAssetUrl } from "@/services/api";

import { RecordaDetailView } from "../components/RecordaDetailView";
import { useRecordaLikeMutation } from "../hooks/useRecordaLikeMutation";
import { useRecordaDetails } from "../hooks/useRecordaDetails";
import { recordaCommentsQueryKey, recordaDetailsQueryKey } from "../queryKeys";
import { feedService } from "../services/feedService";
import { feedItemToFeedPost, recordaDetailToFeedItem, useFeed } from "../state/FeedContext";
import type { FeedComment, RecordaCommentResponse } from "../types";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function toFeedComment(comment: RecordaCommentResponse): FeedComment {
  return {
    id: comment.comment_id,
    text: comment.content,
    username: comment.username,
    avatarUrl: comment.avatar_url ? resolveApiAssetUrl(comment.avatar_url) : null,
    createdAt: comment.created_at
  };
}

export function PublishedRecordaScreen() {
  const queryClient = useQueryClient();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { params } = useRoute<RouteProp<RootStackParamList, "PublishedRecorda">>();
  const {
    posts,
    likedIds,
    currentUser,
    deletedIds,
    openFeedItem,
    toggleLike,
    setLikeState,
    addComment,
    deletePost
  } = useFeed();
  const { t } = useTranslation();
  const snapshot = posts.find((item) => item.id === params.postId);
  const isLocallyDeleted = deletedIds.includes(params.postId);
  const isApiRecorda = UUID_PATTERN.test(params.postId);
  const recorda = useRecordaDetails(params.postId, !snapshot && !isLocallyDeleted);
  const likeMutation = useRecordaLikeMutation();
  const comments = useQuery({
    enabled: isApiRecorda && !isLocallyDeleted,
    queryKey: recordaCommentsQueryKey(params.postId),
    queryFn: ({ signal }) => feedService.getComments(params.postId, signal)
  });
  const createComment = useMutation({
    mutationFn: (content: string) => feedService.createComment(params.postId, content),
    onSuccess: (created) => {
      queryClient.setQueryData<RecordaCommentResponse[]>(
        recordaCommentsQueryKey(params.postId),
        (current = []) => [...current, created]
      );
    }
  });
  const removeRecorda = useMutation({
    mutationFn: () => feedService.deleteRecorda(params.postId),
    onSuccess: () => {
      deletePost(params.postId);
      queryClient.removeQueries({ queryKey: recordaDetailsQueryKey(params.postId) });
      queryClient.removeQueries({ queryKey: recordaCommentsQueryKey(params.postId) });
      void queryClient.invalidateQueries({ queryKey: ["feed"] });
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
      navigation.goBack();
    }
  });
  const remoteItem = recorda.data ? recordaDetailToFeedItem(recorda.data) : undefined;
  const remotePost = remoteItem ? feedItemToFeedPost(remoteItem) : undefined;
  const post = isLocallyDeleted ? undefined : (snapshot ?? remotePost);
  const visiblePost =
    post && isApiRecorda ? { ...post, comments: (comments.data ?? []).map(toFeedComment) } : post;
  const authenticatedUser = queryClient.getQueryData<UserBasicResponse>(AUTH_ME_QUERY_KEY);
  const isOwnPost = post?.author.id === (authenticatedUser?.user_id ?? currentUser.id);
  const isLiked = remoteItem?.is_liked ?? likedIds.includes(post?.id ?? params.postId);

  const handleLike = () => {
    if (likeMutation.isPending) return;

    if (!isApiRecorda) {
      toggleLike(params.postId);
      return;
    }

    const nextLiked = !isLiked;
    const previousCount = remoteItem?.likes_count ?? (post?.likesCount ?? 0) + (isLiked ? 1 : 0);
    setLikeState(params.postId, nextLiked, previousCount + (nextLiked ? 1 : -1));
    likeMutation.mutate(
      { isLiked: nextLiked, recordaId: params.postId },
      {
        onError: () => setLikeState(params.postId, isLiked, previousCount),
        onSuccess: (state) => setLikeState(params.postId, state.is_liked, state.likes_count)
      }
    );
  };

  useEffect(() => {
    if (!snapshot && !isLocallyDeleted && remoteItem) {
      openFeedItem(remoteItem);
    }
  }, [isLocallyDeleted, openFeedItem, remoteItem, snapshot]);

  if (!post && recorda.isPending && !isLocallyDeleted) {
    return (
      <SafeAreaView style={styles.empty}>
        <Loading label={t("feed.loading")} />
      </SafeAreaView>
    );
  }

  if (!post && recorda.isError && !isLocallyDeleted) {
    return (
      <SafeAreaView style={styles.empty}>
        <View style={styles.feedback}>
          <ErrorState message={t("feed.loadError")} />
          <Button
            label={t("feed.retry")}
            onPress={() => void recorda.refetch()}
            variant="secondary"
          />
        </View>
        <Button label={t("publishedRecorda.back")} onPress={() => navigation.goBack()} />
      </SafeAreaView>
    );
  }

  if (!post) {
    return (
      <SafeAreaView style={styles.empty}>
        <AppText style={styles.text}>{t("publishedRecorda.unavailable")}</AppText>
        <Button label={t("publishedRecorda.back")} onPress={() => navigation.goBack()} />
      </SafeAreaView>
    );
  }

  // Navigation only reads the post. Playback must remain owned by the shared
  // player when that feature is integrated, with no seek/play on screen mount.
  return (
    <RecordaDetailView
      post={visiblePost ?? post}
      commentsLoading={isApiRecorda && comments.isPending}
      commentsError={isApiRecorda && comments.isError}
      commentSubmitError={createComment.isError}
      deleteError={removeRecorda.isError}
      deleteSubmitting={removeRecorda.isPending}
      commentSubmitting={createComment.isPending}
      onRetryComments={() => void comments.refetch()}
      liked={isLiked}
      likeSubmitting={likeMutation.isPending}
      isOwnPost={isOwnPost}
      onBack={() => navigation.goBack()}
      onLike={handleLike}
      onComment={async (text) => {
        if (isApiRecorda) {
          await createComment.mutateAsync(text);
        } else {
          addComment(post.id, text);
        }
      }}
      onDelete={() => {
        if (!isOwnPost) return;
        if (isApiRecorda) {
          removeRecorda.mutate();
        } else {
          deletePost(post.id);
          navigation.goBack();
        }
      }}
      onReport={() => navigation.navigate("RecordaReport", { postId: post.id })}
      onShare={() =>
        navigation.navigate("ShareCard", {
          artistName: post.song.artistName,
          coverUrl: remoteItem?.song_cover_url || null,
          mediaUri: post.mediaUrl,
          mediaType: post.mediaType === "VIDEO" ? "video" : "photo",
          songTitle: post.song.title
        })
      }
      onTabPress={(tab) => {
        if (tab === "feed") navigation.goBack();
        else navigation.navigate(tab === "camera" ? "Camera" : "Profile");
      }}
    />
  );
}

const styles = StyleSheet.create({
  empty: {
    flex: 1,
    backgroundColor: colors.neutrals[900],
    justifyContent: "center",
    padding: spacing[6],
    gap: spacing[4]
  },
  feedback: {
    gap: spacing[3]
  },
  text: { color: colors.neutrals[100] }
});

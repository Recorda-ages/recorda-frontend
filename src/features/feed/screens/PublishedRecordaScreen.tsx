import { type RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import type { RootStackParamList } from "@/app/navigation/RootNavigator";
import { AppText, Button, ErrorState, Loading } from "@/components/ui";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { getSessionGeneration } from "@/services/api/sessionLifecycle";
import { useReportDialog } from "@/features/moderation";
import { colors, spacing } from "@/theme";
import { DeleteCommentDialog } from "@/features/recorda-view/components/DeleteCommentDialog";
import { ApiError, resolveApiAssetUrl } from "@/services/api";

import { RecordaDetailView } from "../components/RecordaDetailView";
import { useRecordaLikeMutation } from "../hooks/useRecordaLikeMutation";
import { useRecordaDetails } from "../hooks/useRecordaDetails";
import { recordaCommentsQueryKey, recordaDetailsQueryKey } from "../queryKeys";
import { feedService } from "../services/feedService";
import { useFeedAudioActions } from "../state/FeedAudioContext";
import { feedItemToFeedPost, recordaDetailToFeedItem, useFeed } from "../state/FeedContext";
import type { FeedComment, RecordaCommentResponse } from "../types";

function toFeedComment(comment: RecordaCommentResponse): FeedComment {
  return {
    id: comment.comment_id,
    userId: comment.user_id,
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
  const { posts, likedIds, deletedIds, openFeedItem, setLikeState, deletePost } = useFeed();
  const { setActivePreview } = useFeedAudioActions();
  const { t } = useTranslation();
  const { openReport, reportDialog } = useReportDialog();
  const snapshot = posts.find((item) => item.id === params.postId);
  const isLocallyDeleted = deletedIds.includes(params.postId);
  const recorda = useRecordaDetails(params.postId, !isLocallyDeleted);
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);
  const likeMutation = useRecordaLikeMutation();
  const comments = useQuery({
    enabled: !isLocallyDeleted,
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
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    }
  });
  const removeComment = useMutation({
    mutationFn: (commentId: string) => feedService.deleteComment(commentId),
    onSuccess: (_result, commentId) => {
      queryClient.setQueryData<RecordaCommentResponse[]>(
        recordaCommentsQueryKey(params.postId),
        (current) => current?.filter((item) => item.comment_id !== commentId)
      );
      setCommentToDelete(null);
      void queryClient.invalidateQueries({ queryKey: recordaCommentsQueryKey(params.postId) });
      void queryClient.invalidateQueries({ queryKey: ["feed"] });
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
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
  const inaccessible =
    recorda.error instanceof ApiError && [403, 404].includes(recorda.error.status);
  const post = isLocallyDeleted || inaccessible ? undefined : (remotePost ?? snapshot);
  const visiblePost = post ? { ...post, comments: (comments.data ?? []).map(toFeedComment) } : post;
  const authenticatedUser = useCurrentUser();
  const isOwnPost = post?.author.id === authenticatedUser?.user_id;
  const isLiked = remoteItem?.is_liked ?? likedIds.includes(post?.id ?? params.postId);

  const handleLike = () => {
    if (likeMutation.isPending) return;

    const generation = getSessionGeneration();
    const nextLiked = !isLiked;
    const previousCount = remoteItem?.likes_count ?? (post?.likesCount ?? 0) + (isLiked ? 1 : 0);
    setLikeState(params.postId, nextLiked, previousCount + (nextLiked ? 1 : -1));
    likeMutation.mutate(
      { isLiked: nextLiked, recordaId: params.postId },
      {
        onError: () => {
          if (generation === getSessionGeneration())
            setLikeState(params.postId, isLiked, previousCount);
        },
        onSuccess: (state) => {
          if (generation === getSessionGeneration())
            setLikeState(params.postId, state.is_liked, state.likes_count);
        }
      }
    );
  };

  useEffect(() => {
    if (!isLocallyDeleted && recorda.data) {
      openFeedItem(recordaDetailToFeedItem(recorda.data));
    }
  }, [isLocallyDeleted, openFeedItem, recorda.data]);

  useEffect(() => {
    if (post) {
      setActivePreview(post.id, post.previewUrl ?? null, {
        waitForMedia: post.mediaType === "VIDEO"
      });
    } else {
      setActivePreview(params.postId, null);
    }
  }, [params.postId, post, setActivePreview]);

  if (!post && recorda.isPending && !isLocallyDeleted) {
    return (
      <SafeAreaView style={styles.empty}>
        <Loading label={t("feed.loading")} />
      </SafeAreaView>
    );
  }

  if (!post && recorda.isError && !isLocallyDeleted && !inaccessible) {
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
    <>
      <RecordaDetailView
        post={visiblePost ?? post}
        commentsLoading={comments.isPending}
        commentsError={comments.isError}
        commentSubmitError={createComment.isError}
        deleteError={removeRecorda.isError}
        deleteSubmitting={removeRecorda.isPending}
        commentSubmitting={createComment.isPending}
        canDeleteComment={(comment) =>
          !!authenticatedUser && (isOwnPost || comment.userId === authenticatedUser.user_id)
        }
        onDeleteComment={(commentId) => {
          removeComment.reset();
          setCommentToDelete(commentId);
        }}
        commentDeleteError={removeComment.isError}
        onRetryComments={() => void comments.refetch()}
        liked={isLiked}
        likeSubmitting={likeMutation.isPending}
        isOwnPost={isOwnPost}
        onBack={() => navigation.goBack()}
        onLike={handleLike}
        onComment={async (text) => {
          await createComment.mutateAsync(text);
        }}
        onDelete={() => {
          if (!isOwnPost) return;
          removeRecorda.mutate();
        }}
        onReport={() => openReport({ recordaId: post.id, type: "RECORDA" })}
        onShare={() =>
          navigation.navigate("ShareCard", {
            artistName: post.song.artistName,
            coverUrl: post.song.coverUrl || remoteItem?.song_cover_url || null,
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
      <DeleteCommentDialog
        visible={!!commentToDelete}
        submitting={removeComment.isPending}
        error={removeComment.isError}
        onCancel={() => {
          if (!removeComment.isPending) setCommentToDelete(null);
        }}
        onConfirm={() => {
          if (commentToDelete && !removeComment.isPending) removeComment.mutate(commentToDelete);
        }}
      />
      {reportDialog}
    </>
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

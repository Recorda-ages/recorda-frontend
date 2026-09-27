import { type RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import type { RootStackParamList } from "@/app/navigation/RootNavigator";
import { queryClient } from "@/app/providers/queryClient";
import { AppText, Button, ErrorState, Loading } from "@/components/ui";
import { AUTH_ME_QUERY_KEY } from "@/features/auth/api/getCurrentUser";
import type { UserBasicResponse } from "@/features/auth/api/types";
import { colors, spacing } from "@/theme";

import { RecordaDetailView } from "../components/RecordaDetailView";
import { useRecordaDetails } from "../hooks/useRecordaDetails";
import { feedItemToFeedPost, recordaDetailToFeedItem, useFeed } from "../state/FeedContext";

export function PublishedRecordaScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { params } = useRoute<RouteProp<RootStackParamList, "PublishedRecorda">>();
  const {
    posts,
    likedIds,
    currentUser,
    deletedIds,
    openFeedItem,
    toggleLike,
    addComment,
    deletePost
  } = useFeed();
  const { t } = useTranslation();
  const snapshot = posts.find((item) => item.id === params.postId);
  const isLocallyDeleted = deletedIds.includes(params.postId);
  const recorda = useRecordaDetails(params.postId, !snapshot && !isLocallyDeleted);
  const remoteItem = recorda.data ? recordaDetailToFeedItem(recorda.data) : undefined;
  const remotePost = remoteItem ? feedItemToFeedPost(remoteItem) : undefined;
  const post = isLocallyDeleted ? undefined : (snapshot ?? remotePost);
  const authenticatedUser = queryClient.getQueryData<UserBasicResponse>(AUTH_ME_QUERY_KEY);
  const isOwnPost = post?.author.id === (authenticatedUser?.user_id ?? currentUser.id);

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
      post={post}
      liked={likedIds.includes(post.id)}
      isOwnPost={isOwnPost}
      onBack={() => navigation.goBack()}
      onLike={() => toggleLike(post.id)}
      onComment={(text) => addComment(post.id, text)}
      onDelete={() => {
        if (!isOwnPost) return;
        deletePost(post.id);
        navigation.goBack();
      }}
      onReport={() => navigation.navigate("RecordaReport", { postId: post.id })}
      onShare={() => navigation.navigate("RecordaShare", { postId: post.id })}
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

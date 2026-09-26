import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { useCallback, useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import type { RootStackParamList } from "@/app/navigation/RootNavigator";
import { CURRENT_USER_ID, recordaViewMock } from "@/mocks/recordaMock";
import { colors, spacing } from "@/theme";
import { BottomTabBar, type BottomTab } from "@/features/feed/components/BottomTabBar";

import { CommentItem } from "../components/CommentItem";
import { DeleteCommentDialog } from "../components/DeleteCommentDialog";
import { RecordaMediaCard } from "../components/RecordaMediaCard";
import { RecordaViewHeader } from "../components/RecordaViewHeader";
import type { RecordaComment, RecordaViewData } from "../types";

const getCommentKey = (comment: RecordaComment) => comment.id;

function canDeleteComment(
  currentUserId: string,
  commentAuthorId: string,
  recordaAuthorId: string
): boolean {
  return currentUserId === commentAuthorId || currentUserId === recordaAuthorId;
}

type RecordaViewScreenProps = {
  currentUserId?: string;
  data?: RecordaViewData;
};

export function RecordaViewScreen({
  currentUserId = CURRENT_USER_ID,
  data = recordaViewMock
}: Readonly<RecordaViewScreenProps> = {}) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [comments, setComments] = useState(data.comments);
  const [pendingDeletionCommentId, setPendingDeletionCommentId] = useState<string | null>(null);

  const handleCommentDeleteRequest = useCallback((commentId: string) => {
    setPendingDeletionCommentId(commentId);
  }, []);

  const handleCancelDeletion = useCallback(() => {
    setPendingDeletionCommentId(null);
  }, []);

  const handleConfirmDeletion = useCallback(() => {
    setComments((currentComments) =>
      currentComments.filter((comment) => comment.id !== pendingDeletionCommentId)
    );
    setPendingDeletionCommentId(null);
  }, [pendingDeletionCommentId]);

  const handleTabBarPress = useCallback(
    (tab: BottomTab) => {
      if (tab === "camera") {
        navigation.navigate("Camera");
      }

      if (tab === "profile") {
        navigation.navigate("Profile");
      }
    },
    [navigation]
  );

  const renderComment = useCallback(
    ({ item }: { item: RecordaComment }) => (
      <CommentItem
        canDelete={canDeleteComment(currentUserId, item.authorId, data.author.id)}
        commentId={item.id}
        onDeleteRequest={handleCommentDeleteRequest}
        text={item.text}
        username={item.username}
      />
    ),
    [currentUserId, data.author.id, handleCommentDeleteRequest]
  );

  return (
    <View style={styles.screen} testID="recorda-view-screen">
      <StatusBar style="light" />
      <SafeAreaView edges={["top"]} style={styles.safeArea}>
        <RecordaViewHeader onBack={() => navigation.goBack()} />
        <FlatList
          contentContainerStyle={styles.content}
          data={comments}
          keyExtractor={getCommentKey}
          ListHeaderComponent={
            <RecordaMediaCard
              artistName={data.song.artistName}
              avatarUrl={data.author.avatarUrl}
              lyrics={data.song.lyrics}
              mediaUrl={data.mediaUrl}
              songTitle={data.song.title}
              username={data.author.username}
            />
          }
          renderItem={renderComment}
          showsVerticalScrollIndicator={false}
          testID="recorda-comments-list"
        />
      </SafeAreaView>
      <BottomTabBar activeTab="feed" onPress={handleTabBarPress} />
      <DeleteCommentDialog
        onCancel={handleCancelDeletion}
        onConfirm={handleConfirmDeletion}
        visible={pendingDeletionCommentId !== null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing[3],
    paddingBottom: spacing[4]
  },
  safeArea: {
    flex: 1
  },
  screen: {
    backgroundColor: colors.neutrals[900],
    flex: 1
  }
});

import { memo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Icon } from "react-native-paper";
import { useTranslation } from "react-i18next";

import { AppText } from "@/components/ui";
import { colors, fontFamily, spacing } from "@/theme";

type CommentItemProps = {
  canDelete: boolean;
  commentId: string;
  onDeleteRequest: (commentId: string) => void;
  text: string;
  username: string;
};

export const CommentItem = memo(function CommentItem({
  canDelete,
  commentId,
  onDeleteRequest,
  text,
  username
}: Readonly<CommentItemProps>) {
  const { t } = useTranslation();

  const handleDeleteRequest = () => {
    onDeleteRequest(commentId);
  };

  return (
    <View style={styles.row} testID={`recorda-comment-${commentId}`}>
      <AppText style={styles.comment}>
        <AppText style={styles.username}>{username}</AppText> {text}
      </AppText>
      {canDelete ? (
        <Pressable
          accessibilityLabel={t("recordaView.deleteComment")}
          accessibilityRole="button"
          hitSlop={8}
          onPress={handleDeleteRequest}
          style={({ pressed }) => (pressed ? styles.pressed : null)}
          testID={`delete-comment-${commentId}`}
        >
          <Icon color={colors.neutrals[300]} size={22} source="dots-horizontal" />
        </Pressable>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  comment: {
    color: colors.neutrals[200],
    flex: 1,
    fontSize: 16,
    lineHeight: 23
  },
  pressed: {
    opacity: 0.72
  },
  row: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing[2],
    paddingHorizontal: spacing[4]
  },
  username: {
    color: colors.neutrals[100],
    fontFamily: fontFamily.primary.bold
  }
});

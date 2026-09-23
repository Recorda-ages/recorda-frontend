import { Image } from "expo-image";
import { Pressable, StyleSheet, View } from "react-native";
import { Icon } from "react-native-paper";

import { AppText } from "@/components/ui";
import { FollowButton } from "@/features/follow";
import { resolveApiAssetUrl } from "@/services/api";
import { colors, spacing } from "@/theme";

import type { UserSearchResultItem } from "../types";

type UserSearchResultRowProps = {
  item: UserSearchResultItem;
  onPress: (userId: string) => void;
};

export function UserSearchResultRow({ item, onPress }: UserSearchResultRowProps) {
  const avatarUrl = item.avatar_url ? resolveApiAssetUrl(item.avatar_url) : null;

  return (
    <Pressable
      accessibilityLabel={item.username}
      accessibilityRole="button"
      onPress={() => onPress(item.user_id)}
      style={styles.row}
      testID={`user-search-result-${item.user_id}`}
    >
      {avatarUrl ? (
        <Image source={avatarUrl} style={styles.avatar} testID={`user-avatar-${item.user_id}`} />
      ) : (
        <View
          style={[styles.avatar, styles.avatarFallback]}
          testID={`user-avatar-fallback-${item.user_id}`}
        >
          <Icon color={colors.neutrals[400]} size={20} source="account" />
        </View>
      )}

      <AppText numberOfLines={1} style={styles.username}>
        {item.username}
      </AppText>

      <FollowButton status={item.follow_status} userId={item.user_id} username={item.username} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  avatar: {
    borderRadius: 20,
    height: 40,
    width: 40
  },
  avatarFallback: {
    alignItems: "center",
    backgroundColor: colors.neutrals[800],
    justifyContent: "center"
  },
  row: {
    alignItems: "center",
    borderBottomColor: colors.neutrals[800],
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: spacing[3],
    paddingVertical: spacing[3]
  },
  username: {
    color: colors.neutrals[100],
    flex: 1,
    fontWeight: "600"
  }
});

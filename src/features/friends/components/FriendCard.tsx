import { Image, Pressable, StyleSheet, View } from "react-native";

import { colors, radius, spacing } from "@/theme";
import { AppText } from "@/components/ui";
import type { FriendProfile } from "../types";

type FriendCardProps = {
  profile: FriendProfile;
  onPress: (profile: FriendProfile) => void;
  onRemove: (profile: FriendProfile) => void;
};

export function FriendCard({ profile, onPress, onRemove }: FriendCardProps) {
  return (
    <Pressable onPress={() => onPress(profile)} style={styles.container}>
      {profile.avatarUrl ? (
        <Image source={{ uri: profile.avatarUrl }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarPlaceholder]} />
      )}

      <AppText style={styles.name} variant="body1">
        {profile.displayName}
      </AppText>

      <Pressable
        hitSlop={8}
        onPress={(e) => {
          e.stopPropagation();
          onRemove(profile);
        }}
        style={styles.removeButton}
      >
        <AppText style={styles.removeLabel} variant="buttonSmall">
          Remover
        </AppText>
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  avatar: {
    borderRadius: radius.full,
    height: 44,
    width: 44
  },
  avatarPlaceholder: {
    backgroundColor: colors.neutrals[700]
  },
  container: {
    alignItems: "center",
    borderBottomColor: colors.neutrals[400],
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: spacing[3],
    paddingVertical: spacing[3]
  },
  name: {
    color: colors.neutrals[100],
    flex: 1
  },
  removeButton: {
    backgroundColor: colors.error[300],
    borderRadius: radius.sm,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2]
  },
  removeLabel: {
    color: colors.neutrals[100]
  }
});

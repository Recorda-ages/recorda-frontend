import { useState } from "react";
import { Image, Modal, Pressable, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { AppText } from "@/components/ui";
import { useAuthImageSource } from "@/services/api";
import { colors, radius, spacing } from "@/theme";

import type { FriendProfile } from "../types";

type FriendCardProps = {
  profile: FriendProfile;
  showRemove?: boolean;
  onPress: (profile: FriendProfile) => void;
  onRemove: (profile: FriendProfile) => void;
};

export function FriendCard({
  profile,
  showRemove = false,
  onPress,
  onRemove
}: Readonly<FriendCardProps>) {
  const { t } = useTranslation();
  const [confirmVisible, setConfirmVisible] = useState(false);
  const avatarSource = useAuthImageSource(profile.avatarUrl);

  return (
    <>
      <Pressable onPress={() => onPress(profile)} style={styles.container}>
        {avatarSource ? (
          <Image source={avatarSource} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]} />
        )}

        <View style={styles.identity}>
          <AppText style={styles.name} variant="body1">
            {profile.displayName}
          </AppText>
          <AppText style={styles.username} variant="caption">
            @{profile.username}
          </AppText>
        </View>

        {showRemove && (
          <Pressable
            hitSlop={8}
            onPress={(e) => {
              e.stopPropagation();
              setConfirmVisible(true);
            }}
            style={styles.removeButton}
          >
            <AppText style={styles.removeLabel} variant="buttonSmall">
              {t("friends.remove")}
            </AppText>
          </Pressable>
        )}
      </Pressable>

      <Modal
        animationType="fade"
        onRequestClose={() => setConfirmVisible(false)}
        statusBarTranslucent
        transparent
        visible={confirmVisible}
      >
        <Pressable onPress={() => setConfirmVisible(false)} style={styles.overlay}>
          <Pressable style={styles.card}>
            <AppText style={styles.cardTitle} variant="body1">
              {t("friends.removeTitle")}
            </AppText>
            <AppText style={styles.cardBody} variant="body2">
              {t("friends.removeMessage", { name: profile.displayName })}
            </AppText>
            <View style={styles.cardActions}>
              <Pressable onPress={() => setConfirmVisible(false)} style={styles.cancelButton}>
                <AppText style={styles.cancelLabel} variant="buttonSmall">
                  {t("friends.cancel")}
                </AppText>
              </Pressable>
              <Pressable
                onPress={() => {
                  setConfirmVisible(false);
                  onRemove(profile);
                }}
                style={styles.confirmButton}
              >
                <AppText style={styles.confirmLabel} variant="buttonSmall">
                  {t("friends.remove")}
                </AppText>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
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
  cancelButton: {
    borderColor: colors.neutrals[400],
    borderRadius: radius.sm,
    borderWidth: 1,
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing[2]
  },
  cancelLabel: {
    color: colors.neutrals[200]
  },
  card: {
    backgroundColor: colors.neutrals[800],
    borderRadius: radius.md,
    gap: spacing[4],
    marginHorizontal: spacing[6],
    padding: spacing[5]
  },
  cardActions: {
    flexDirection: "row",
    gap: spacing[3]
  },
  cardBody: {
    color: colors.neutrals[300]
  },
  cardBodyBold: {
    color: colors.neutrals[100],
    fontWeight: "600"
  },
  cardTitle: {
    color: colors.neutrals[100],
    fontWeight: "600"
  },
  confirmButton: {
    backgroundColor: colors.error[300],
    borderRadius: radius.sm,
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing[2]
  },
  confirmLabel: {
    color: colors.neutrals[100]
  },
  container: {
    alignItems: "center",
    borderBottomColor: colors.neutrals[400],
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: spacing[3],
    paddingVertical: spacing[3]
  },
  identity: {
    flex: 1
  },
  name: {
    color: colors.neutrals[100],
    fontWeight: "600"
  },
  overlay: {
    backgroundColor: "rgba(0,0,0,0.6)",
    flex: 1,
    justifyContent: "center"
  },
  removeButton: {
    backgroundColor: colors.error[300],
    borderRadius: radius.sm,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2]
  },
  removeLabel: {
    color: colors.neutrals[100]
  },
  username: {
    color: colors.neutrals[400]
  }
});

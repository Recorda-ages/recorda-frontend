import { useState } from "react";
import { Image, Modal, Pressable, StyleSheet, View } from "react-native";

import { colors, radius, spacing } from "@/theme";
import { AppText } from "@/components/ui";
import type { FriendProfile } from "../types";

type FriendCardProps = {
  profile: FriendProfile;
  showRemove?: boolean;
  onPress: (profile: FriendProfile) => void;
  onRemove: (profile: FriendProfile) => void;
};

export function FriendCard({ profile, showRemove = false, onPress, onRemove }: FriendCardProps) {
  const [confirmVisible, setConfirmVisible] = useState(false);

  return (
    <>
      <Pressable onPress={() => onPress(profile)} style={styles.container}>
        {profile.avatarUrl ? (
          <Image source={{ uri: profile.avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]} />
        )}

        <AppText style={styles.name} variant="body1">
          {profile.displayName}
        </AppText>

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
              Remover
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
              Remover seguidor
            </AppText>
            <AppText style={styles.cardBody} variant="body2">
              Tem certeza que deseja remover{" "}
              <AppText style={styles.cardBodyBold} variant="body2">
                {profile.displayName}
              </AppText>{" "}
              dos seus seguidores?
            </AppText>
            <View style={styles.cardActions}>
              <Pressable onPress={() => setConfirmVisible(false)} style={styles.cancelButton}>
                <AppText style={styles.cancelLabel} variant="buttonSmall">
                  Cancelar
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
                  Remover
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
  name: {
    color: colors.neutrals[100],
    flex: 1
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
  }
});

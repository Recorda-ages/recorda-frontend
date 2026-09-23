import { useTranslation } from "react-i18next";
import { Alert, Pressable, StyleSheet, View } from "react-native";
import { Icon } from "react-native-paper";

import { AppText } from "@/components/ui";
import { colors, radius, spacing } from "@/theme";

import { useFollowMutation } from "../hooks/useFollowMutation";
import type { FollowStatus } from "../types";

type FollowButtonProps = {
  status: FollowStatus;
  userId: string;
  username: string;
};

export function FollowButton({ status, userId, username }: FollowButtonProps) {
  const { t } = useTranslation();
  const mutation = useFollowMutation();
  const isFollowing = status === "seguindo";
  const isRequested = status === "solicitado";

  const runUnfollow = () => mutation.mutate({ action: "unfollow", userId });

  // O `Pressable` da linha que envolve este botão não dispara junto: no React
  // Native o pressable interno vence o responder do toque.
  const handlePress = () => {
    if (isFollowing) {
      // Deixar de seguir exige confirmação; cancelar uma solicitação, não.
      Alert.alert(t("follow.unfollowTitle"), t("follow.unfollowMessage", { username }), [
        { style: "cancel", text: t("follow.unfollowCancel") },
        { onPress: runUnfollow, style: "destructive", text: t("follow.unfollowConfirm") }
      ]);
      return;
    }

    if (isRequested) {
      runUnfollow();
      return;
    }

    mutation.mutate({ action: "follow", userId });
  };

  return (
    <Pressable
      accessibilityLabel={t(followLabelKeys[status].accessibility, { username })}
      accessibilityRole="button"
      accessibilityState={{ busy: mutation.isPending, disabled: mutation.isPending }}
      disabled={mutation.isPending}
      hitSlop={8}
      onPress={handlePress}
      style={[styles.button, isFollowing || isRequested ? styles.outlined : styles.filled]}
      testID={`follow-button-${userId}`}
    >
      <View style={styles.content}>
        <AppText
          style={isFollowing || isRequested ? styles.outlinedLabel : styles.filledLabel}
          variant="buttonSmall"
        >
          {t(followLabelKeys[status].label)}
        </AppText>
        {status === "nenhuma" ? (
          <Icon color={colors.neutrals[900]} size={14} source="plus" />
        ) : null}
      </View>
    </Pressable>
  );
}

const followLabelKeys: Record<FollowStatus, { accessibility: string; label: string }> = {
  nenhuma: { accessibility: "follow.followA11y", label: "follow.follow" },
  seguindo: { accessibility: "follow.followingA11y", label: "follow.following" },
  solicitado: { accessibility: "follow.requestedA11y", label: "follow.requested" }
};

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    borderRadius: radius.md,
    justifyContent: "center",
    minHeight: 32,
    minWidth: 96,
    paddingHorizontal: spacing[3]
  },
  content: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing[1]
  },
  filled: {
    backgroundColor: colors.primary[500]
  },
  filledLabel: {
    color: colors.neutrals[900]
  },
  outlined: {
    borderColor: colors.primary[500],
    borderWidth: 1
  },
  outlinedLabel: {
    color: colors.primary[500]
  }
});

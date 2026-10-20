import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import { Icon } from "react-native-paper";

import { AppText } from "@/components/ui";
import { colors, radius, spacing } from "@/theme";

import { useFollowMutation } from "../hooks/useFollowMutation";
import type { FollowStatus } from "../types";

import { UnfollowDialog } from "./UnfollowDialog";

type FollowButtonProps = Readonly<{
  /**
   * Visual only. `compact` (default) fits list rows; `block` fills the width, as on the
   * profile screen. Behavior is the same in both.
   */
  size?: "compact" | "block";
  status: FollowStatus;
  userId: string;
  username: string;
}>;

export function FollowButton({ size = "compact", status, userId, username }: FollowButtonProps) {
  const { t } = useTranslation();
  const mutation = useFollowMutation();
  const isFollowing = status === "seguindo";
  const isRequested = status === "solicitado";
  const isBlock = size === "block";
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const runUnfollow = () => mutation.mutate({ action: "unfollow", userId });

  // The dialog stays open, with confirm disabled, until the request settles: a second tap
  // can't send a second unfollow. Errors keep going through useFollowMutation.
  const confirmUnfollow = () => {
    if (mutation.isPending) return;
    mutation.mutate({ action: "unfollow", userId }, { onSettled: () => setIsConfirmOpen(false) });
  };

  const handlePress = () => {
    if (isFollowing) {
      // Deixar de seguir exige confirmação; cancelar uma solicitação, não.
      setIsConfirmOpen(true);
      return;
    }

    if (isRequested) {
      runUnfollow();
      return;
    }

    mutation.mutate({ action: "follow", userId });
  };

  return (
    <>
      <Pressable
        accessibilityLabel={t(followLabelKeys[status].accessibility, { username })}
        accessibilityRole="button"
        accessibilityState={{ busy: mutation.isPending, disabled: mutation.isPending }}
        disabled={mutation.isPending}
        hitSlop={8}
        onPress={handlePress}
        style={[
          styles.button,
          isFollowing || isRequested ? styles.outlined : styles.filled,
          isBlock && styles.block,
          isBlock && (isFollowing || isRequested) && styles.blockOutlined
        ]}
        testID={`follow-button-${userId}`}
      >
        <View style={styles.content}>
          <AppText
            style={isFollowing || isRequested ? styles.outlinedLabel : styles.filledLabel}
            variant={isBlock ? "buttonLarge" : "buttonSmall"}
          >
            {t(followLabelKeys[status].label)}
          </AppText>
          {status === "nenhuma" && !isBlock ? (
            <Icon
              color={colors.neutrals[900]}
              size={14}
              source="plus"
              testID={`follow-button-plus-${userId}`}
            />
          ) : null}
        </View>
      </Pressable>
      <UnfollowDialog
        onCancel={() => setIsConfirmOpen(false)}
        onConfirm={confirmUnfollow}
        pending={mutation.isPending}
        username={username}
        visible={isConfirmOpen}
      />
    </>
  );
}

const followLabelKeys: Record<FollowStatus, { accessibility: string; label: string }> = {
  nenhuma: { accessibility: "follow.followA11y", label: "follow.follow" },
  seguindo: { accessibility: "follow.followingA11y", label: "follow.following" },
  solicitado: { accessibility: "follow.requestedA11y", label: "follow.requested" }
};

const styles = StyleSheet.create({
  block: {
    alignSelf: "stretch",
    borderRadius: radius.full,
    minHeight: 44
  },
  blockOutlined: {
    backgroundColor: colors.neutrals[800]
  },
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

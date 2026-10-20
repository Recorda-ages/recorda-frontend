import { Modal, Pressable, StyleSheet, View } from "react-native";
import { Icon } from "react-native-paper";
import { useTranslation } from "react-i18next";

import { AppText, destructiveDialogStyles } from "@/components/ui";
import { baseColors, colors, fontFamily, spacing } from "@/theme";

type UnfollowDialogProps = Readonly<{
  onCancel: () => void;
  onConfirm: () => void;
  /** While the unfollow is in flight the confirm button is disabled, so it can't repeat. */
  pending: boolean;
  username: string;
  visible: boolean;
}>;

/** Confirmation before unfollowing, on the shared destructive dialog layout. */
export function UnfollowDialog({
  onCancel,
  onConfirm,
  pending,
  username,
  visible
}: UnfollowDialogProps) {
  const { t } = useTranslation();

  return (
    <Modal
      animationType="fade"
      onRequestClose={onCancel}
      statusBarTranslucent
      transparent
      visible={visible}
    >
      <View style={styles.backdrop}>
        <View accessibilityViewIsModal style={styles.dialog} testID="unfollow-dialog">
          <View style={styles.iconBox}>
            <Icon color={baseColors.white} size={32} source="close" />
          </View>
          <View style={styles.copy}>
            <AppText accessibilityRole="header" style={styles.title} variant="headline4">
              {t("follow.unfollowTitle")}
            </AppText>
            <AppText style={styles.message} variant="body2">
              {t("follow.unfollowMessage", { username })}
            </AppText>
          </View>
          <View style={styles.actions}>
            <Pressable
              accessibilityLabel={t("follow.unfollowCancel")}
              accessibilityRole="button"
              onPress={onCancel}
              style={({ pressed }) => [
                styles.button,
                styles.buttonSpacing,
                styles.cancelButton,
                pressed ? styles.pressed : null
              ]}
            >
              <AppText style={styles.cancelLabel} variant="buttonSmall">
                {t("follow.unfollowCancel")}
              </AppText>
            </Pressable>
            <Pressable
              accessibilityLabel={t("follow.unfollowConfirm")}
              accessibilityRole="button"
              accessibilityState={{ busy: pending, disabled: pending }}
              disabled={pending}
              onPress={onConfirm}
              style={({ pressed }) => [
                styles.button,
                styles.buttonSpacing,
                styles.confirmButton,
                pressed ? styles.pressed : null,
                pending ? styles.pending : null
              ]}
            >
              <AppText style={styles.confirmLabel} variant="buttonSmall">
                {t("follow.unfollowConfirm")}
              </AppText>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = {
  ...destructiveDialogStyles,
  ...StyleSheet.create({
    buttonSpacing: {
      paddingHorizontal: spacing[3]
    },
    confirmButton: {
      backgroundColor: colors.error[300]
    },
    confirmLabel: {
      color: baseColors.white
    },
    copy: {
      alignItems: "center",
      gap: spacing[2]
    },
    // Bold but quieter than the title: smaller and muted.
    message: {
      color: colors.neutrals[400],
      fontFamily: fontFamily.display.semiBold,
      lineHeight: 18,
      textAlign: "center"
    },
    pending: {
      opacity: 0.6
    },
    title: {
      color: colors.neutrals[100],
      fontFamily: fontFamily.display.semiBold,
      textAlign: "center"
    }
  })
};

import { ActivityIndicator, Modal, Pressable, StyleSheet, View } from "react-native";
import { Icon } from "react-native-paper";
import { useTranslation } from "react-i18next";

import { AppText, destructiveDialogStyles } from "@/components/ui";
import { baseColors, colors, fontFamily, spacing } from "@/theme";

type RemoveAvatarDialogProps = {
  removing: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  visible: boolean;
};

/** Confirmation dialog for removing the profile photo (US28 D-05). */
export function RemoveAvatarDialog({
  removing,
  onCancel,
  onConfirm,
  visible
}: Readonly<RemoveAvatarDialogProps>) {
  const { t } = useTranslation();

  return (
    <Modal
      animationType="fade"
      onRequestClose={removing ? undefined : onCancel}
      statusBarTranslucent
      transparent
      visible={visible}
    >
      <View style={styles.backdrop}>
        <View accessibilityViewIsModal style={styles.dialog} testID="remove-avatar-dialog">
          <View style={styles.iconBox}>
            <Icon color={baseColors.white} size={28} source="trash-can-outline" />
          </View>
          <View style={styles.copy}>
            <AppText style={styles.title} variant="headline3">
              {t("profile.removeAvatarTitle")}
            </AppText>
            <AppText style={styles.message}>{t("profile.removeAvatarMessage")}</AppText>
          </View>
          <View style={styles.actions}>
            <Pressable
              accessibilityLabel={t("profile.removeAvatarCancel")}
              accessibilityRole="button"
              accessibilityState={{ disabled: removing }}
              disabled={removing}
              onPress={onCancel}
              style={({ pressed }) => [
                styles.button,
                styles.cancelButton,
                pressed ? styles.pressed : null
              ]}
              testID="remove-avatar-cancel"
            >
              <AppText style={styles.cancelLabel} variant="buttonSmall">
                {t("profile.removeAvatarCancel")}
              </AppText>
            </Pressable>
            <Pressable
              accessibilityLabel={t("profile.removeAvatarConfirm")}
              accessibilityRole="button"
              accessibilityState={{ busy: removing, disabled: removing }}
              disabled={removing}
              onPress={onConfirm}
              style={({ pressed }) => [
                styles.button,
                styles.confirmButton,
                pressed ? styles.pressed : null
              ]}
              testID="remove-avatar-confirm"
            >
              {removing ? (
                <ActivityIndicator color={baseColors.white} />
              ) : (
                <AppText style={styles.confirmLabel} variant="buttonSmall">
                  {t("profile.removeAvatarConfirm")}
                </AppText>
              )}
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
    message: {
      color: colors.neutrals[300],
      fontSize: 12,
      lineHeight: 18,
      textAlign: "center"
    },
    title: {
      color: colors.neutrals[100],
      fontFamily: fontFamily.primary.semiBold,
      fontSize: 20,
      textAlign: "center"
    }
  })
};

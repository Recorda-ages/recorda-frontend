import { ActivityIndicator, Modal, Pressable, StyleSheet, View } from "react-native";
import { Icon } from "react-native-paper";
import { useTranslation } from "react-i18next";

import { AppText, destructiveDialogStyles } from "@/components/ui";
import { baseColors, colors, fontFamily, spacing } from "@/theme";

type DeleteAccountDialogProps = {
  deleting: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: () => void;
  visible: boolean;
};

export function DeleteAccountDialog({
  deleting,
  error,
  onCancel,
  onConfirm,
  visible
}: Readonly<DeleteAccountDialogProps>) {
  const { t } = useTranslation();

  return (
    <Modal
      animationType="fade"
      onRequestClose={deleting ? undefined : onCancel}
      statusBarTranslucent
      transparent
      visible={visible}
    >
      <View style={styles.backdrop}>
        <View accessibilityViewIsModal style={styles.dialog} testID="delete-account-dialog">
          <View style={styles.iconBox}>
            <Icon color={baseColors.white} size={28} source="trash-can-outline" />
          </View>
          <View style={styles.copy}>
            <AppText style={styles.title} variant="headline3">
              {t("account.deleteDialog.title")}
            </AppText>
            <AppText style={styles.message}>{t("account.deleteDialog.message")}</AppText>
            {error ? (
              <AppText accessibilityRole="alert" style={styles.error}>
                {error}
              </AppText>
            ) : null}
          </View>
          <View style={styles.actions}>
            <Pressable
              accessibilityLabel={t("account.deleteDialog.cancel")}
              accessibilityRole="button"
              accessibilityState={{ disabled: deleting }}
              disabled={deleting}
              onPress={onCancel}
              style={({ pressed }) => [
                styles.button,
                styles.cancelButton,
                pressed ? styles.pressed : null
              ]}
              testID="delete-account-cancel"
            >
              <AppText style={styles.cancelLabel} variant="buttonSmall">
                {t("account.deleteDialog.cancel")}
              </AppText>
            </Pressable>
            <Pressable
              accessibilityLabel={t("account.deleteDialog.confirm")}
              accessibilityRole="button"
              accessibilityState={{ busy: deleting, disabled: deleting }}
              disabled={deleting}
              onPress={onConfirm}
              style={({ pressed }) => [
                styles.button,
                styles.confirmButton,
                pressed ? styles.pressed : null
              ]}
              testID="delete-account-confirm"
            >
              {deleting ? (
                <ActivityIndicator color={baseColors.white} />
              ) : (
                <AppText style={styles.confirmLabel} variant="buttonSmall">
                  {t("account.deleteDialog.confirm")}
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
    error: {
      color: colors.error[200],
      fontSize: 12,
      lineHeight: 18,
      textAlign: "center"
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

import { Modal, Pressable, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Icon } from "react-native-paper";

import { AppText, destructiveDialogStyles } from "@/components/ui";
import { baseColors, colors, fontFamily, spacing } from "@/theme";

type Props = { onCancel: () => void; onConfirm: () => void };

export function SignOutDialog({ onCancel, onConfirm }: Readonly<Props>) {
  const { t } = useTranslation();

  return (
    <Modal animationType="fade" onRequestClose={onCancel} statusBarTranslucent transparent visible>
      <View style={styles.backdrop}>
        <View accessibilityViewIsModal style={styles.dialog}>
          <View style={styles.iconBox}>
            <Icon color={baseColors.white} size={28} source="logout" />
          </View>
          <View style={styles.copy}>
            <AppText style={styles.title}>{t("settings.confirm.signOut.title")}</AppText>
            <AppText style={styles.message}>{t("settings.confirm.signOut.message")}</AppText>
          </View>
          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              onPress={onCancel}
              style={({ pressed }) => [
                styles.button,
                styles.cancelButton,
                pressed && styles.pressed
              ]}
            >
              <AppText style={styles.cancelLabel} variant="buttonSmall">
                {t("settings.cancel")}
              </AppText>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={onConfirm}
              style={({ pressed }) => [
                styles.button,
                styles.confirmButton,
                pressed && styles.pressed
              ]}
            >
              <AppText style={styles.confirmLabel} variant="buttonSmall">
                {t("settings.signOut")}
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
    confirmButton: { backgroundColor: colors.error[300] },
    confirmLabel: { color: baseColors.white },
    copy: { alignItems: "center", gap: spacing[2] },
    title: {
      color: colors.neutrals[100],
      fontFamily: fontFamily.primary.semiBold,
      fontSize: 20,
      textAlign: "center"
    },
    message: { color: colors.neutrals[300], fontSize: 12, lineHeight: 18, textAlign: "center" }
  })
};

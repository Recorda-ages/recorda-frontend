import { Modal, Pressable, StyleSheet, View } from "react-native";
import { Icon } from "react-native-paper";
import { useTranslation } from "react-i18next";

import { AppText } from "@/components/ui";
import { baseColors, colors, fontFamily, radius, spacing } from "@/theme";

type DeleteCommentDialogProps = {
  onCancel: () => void;
  onConfirm: () => void;
  visible: boolean;
};

export function DeleteCommentDialog({
  onCancel,
  onConfirm,
  visible
}: Readonly<DeleteCommentDialogProps>) {
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
        <View accessibilityViewIsModal style={styles.dialog}>
          <View style={styles.iconBox}>
            <Icon color={baseColors.white} size={28} source="trash-can-outline" />
          </View>
          <View style={styles.copy}>
            <AppText style={styles.title} variant="headline3">
              {t("recordaView.deleteDialog.title")}
            </AppText>
            <AppText style={styles.message}>{t("recordaView.deleteDialog.message")}</AppText>
          </View>
          <View style={styles.actions}>
            <Pressable
              accessibilityLabel={t("recordaView.deleteDialog.cancel")}
              accessibilityRole="button"
              onPress={onCancel}
              style={({ pressed }) => [
                styles.button,
                styles.cancelButton,
                pressed ? styles.pressed : null
              ]}
            >
              <AppText style={styles.cancelLabel} variant="buttonSmall">
                {t("recordaView.deleteDialog.cancel")}
              </AppText>
            </Pressable>
            <Pressable
              accessibilityLabel={t("recordaView.deleteDialog.confirm")}
              accessibilityRole="button"
              onPress={onConfirm}
              style={({ pressed }) => [
                styles.button,
                styles.confirmButton,
                pressed ? styles.pressed : null
              ]}
            >
              <AppText style={styles.confirmLabel} variant="buttonSmall">
                {t("recordaView.deleteDialog.confirm")}
              </AppText>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: "row",
    gap: spacing[3],
    width: "100%"
  },
  backdrop: {
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.74)",
    flex: 1,
    justifyContent: "center",
    padding: spacing[6]
  },
  button: {
    alignItems: "center",
    borderCurve: "continuous",
    borderRadius: radius.xl,
    flex: 1,
    justifyContent: "center",
    minHeight: 48
  },
  cancelButton: {
    backgroundColor: colors.neutrals[600],
    borderColor: colors.neutrals[400],
    borderWidth: 1
  },
  cancelLabel: {
    color: colors.neutrals[100]
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
  dialog: {
    alignItems: "center",
    backgroundColor: colors.neutrals[800],
    borderCurve: "continuous",
    borderRadius: 32,
    gap: spacing[4],
    maxWidth: 520,
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[5],
    width: "100%"
  },
  iconBox: {
    alignItems: "center",
    backgroundColor: colors.error[300],
    borderCurve: "continuous",
    borderRadius: radius.xl,
    height: 56,
    justifyContent: "center",
    width: 56
  },
  message: {
    color: colors.neutrals[300],
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center"
  },
  pressed: {
    opacity: 0.82
  },
  title: {
    color: colors.neutrals[100],
    fontFamily: fontFamily.primary.semiBold,
    fontSize: 20,
    textAlign: "center"
  }
});

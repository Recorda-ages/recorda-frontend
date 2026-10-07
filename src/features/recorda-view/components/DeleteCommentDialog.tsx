import { Modal, Pressable, StyleSheet, View } from "react-native";
import { Icon } from "react-native-paper";
import { useTranslation } from "react-i18next";

import { AppText, destructiveDialogStyles } from "@/components/ui";
import { baseColors, colors, fontFamily, spacing } from "@/theme";

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

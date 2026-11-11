import { Modal, Pressable, View } from "react-native";
import { Icon } from "react-native-paper";
import { useTranslation } from "react-i18next";

import { AppText, destructiveDialogStyles } from "@/components/ui";
import { baseColors } from "@/theme";

type DeleteRecordaDialogProps = Readonly<{
  error?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  submitting?: boolean;
  visible: boolean;
}>;

export function DeleteRecordaDialog({
  error = false,
  onCancel,
  onConfirm,
  submitting = false,
  visible
}: DeleteRecordaDialogProps) {
  const { t } = useTranslation();

  return (
    <Modal
      animationType="fade"
      onRequestClose={() => {
        if (!submitting) onCancel();
      }}
      statusBarTranslucent
      transparent
      visible={visible}
    >
      <View style={styles.backdrop}>
        <View accessibilityViewIsModal style={styles.dialog} testID="delete-recorda-dialog">
          <View style={styles.iconBox}>
            <Icon color={baseColors.white} size={28} source="trash-can-outline" />
          </View>
          <View style={styles.copy}>
            <AppText style={styles.title} variant="headline3">
              {t("publishedRecorda.deleteTitle")}
            </AppText>
            <AppText style={styles.message}>{t("publishedRecorda.deleteMessage")}</AppText>
          </View>
          {error ? (
            <AppText style={styles.message}>{t("publishedRecorda.deleteError")}</AppText>
          ) : null}
          <View style={styles.actions}>
            <Pressable
              accessibilityLabel={t("recordaView.deleteDialog.cancel")}
              accessibilityRole="button"
              disabled={submitting}
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
              accessibilityLabel={t("publishedRecorda.delete")}
              accessibilityRole="button"
              disabled={submitting}
              onPress={onConfirm}
              style={({ pressed }) => [
                styles.button,
                styles.confirmButton,
                pressed ? styles.pressed : null
              ]}
              testID="delete-recorda-confirm"
            >
              <AppText style={styles.confirmLabel} variant="buttonSmall">
                {t("publishedRecorda.delete")}
              </AppText>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = destructiveDialogStyles;

import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View
} from "react-native";
import { useTranslation } from "react-i18next";
import { Icon } from "react-native-paper";

import { AppText, destructiveDialogStyles, Input } from "@/components/ui";
import { baseColors, colors, fontFamily, spacing } from "@/theme";

export const ADMIN_REASON_MAX_LENGTH = 500;

export type ReasonDialogProps = {
  confirmLabel: string;
  error?: string;
  loading?: boolean;
  onCancel: () => void;
  onChangeReason: (reason: string) => void;
  onConfirm: () => void;
  reason: string;
  title: string;
  visible: boolean;
};

export function ReasonDialog({
  confirmLabel,
  error,
  loading = false,
  onCancel,
  onChangeReason,
  onConfirm,
  reason,
  title,
  visible
}: Readonly<ReasonDialogProps>) {
  const { t } = useTranslation();
  const confirmDisabled = loading || reason.trim() === "";

  const handleRequestClose = () => {
    if (!loading) {
      onCancel();
    }
  };

  return (
    <Modal
      animationType="fade"
      onRequestClose={handleRequestClose}
      statusBarTranslucent
      transparent
      visible={visible}
    >
      <Pressable accessible={false} onPress={Keyboard.dismiss} style={styles.backdrop}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.keyboardAvoiding}
        >
          <View accessibilityViewIsModal style={styles.dialog}>
            <View style={styles.iconBox}>
              <Icon color={baseColors.white} size={28} source="text-box-edit-outline" />
            </View>
            <AppText style={styles.title} variant="headline4">
              {title}
            </AppText>
            <View style={styles.field}>
              <Input
                accessibilityLabel={t("admin.reasonDialog.label")}
                editable={!loading}
                error={error}
                inputContainerStyle={styles.inputContainer}
                label={t("admin.reasonDialog.label")}
                maxLength={ADMIN_REASON_MAX_LENGTH}
                multiline
                onChangeText={onChangeReason}
                placeholder={t("admin.reasonDialog.placeholder")}
                style={styles.input}
                textAlignVertical="top"
                value={reason}
                variant="dark"
              />
              <AppText style={styles.counter} variant="caption">
                {t("admin.reasonDialog.counter", {
                  current: reason.length,
                  max: ADMIN_REASON_MAX_LENGTH
                })}
              </AppText>
            </View>
            <View style={styles.actions}>
              <Pressable
                accessibilityLabel={t("admin.reasonDialog.cancel")}
                accessibilityRole="button"
                accessibilityState={{ disabled: loading }}
                disabled={loading}
                onPress={onCancel}
                style={({ pressed }) => [
                  styles.button,
                  styles.cancelButton,
                  pressed ? styles.pressed : undefined
                ]}
              >
                <AppText style={styles.cancelLabel} variant="buttonLarge">
                  {t("admin.reasonDialog.cancel")}
                </AppText>
              </Pressable>
              <Pressable
                accessibilityLabel={confirmLabel}
                accessibilityRole="button"
                accessibilityState={{ busy: loading, disabled: confirmDisabled }}
                disabled={confirmDisabled}
                onPress={onConfirm}
                style={({ pressed }) => [
                  styles.button,
                  styles.confirmButton,
                  confirmDisabled ? styles.disabled : undefined,
                  pressed ? styles.pressed : undefined
                ]}
              >
                {loading ? (
                  <ActivityIndicator color={baseColors.white} />
                ) : (
                  <AppText style={styles.confirmLabel} variant="buttonLarge">
                    {confirmLabel}
                  </AppText>
                )}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Pressable>
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
    counter: {
      color: colors.neutrals[300],
      textAlign: "right"
    },
    disabled: {
      opacity: 0.56
    },
    field: {
      gap: spacing[1],
      width: "100%"
    },
    input: {
      minHeight: 72
    },
    inputContainer: {
      alignItems: "flex-start",
      minHeight: 96,
      paddingVertical: spacing[3]
    },
    keyboardAvoiding: {
      alignItems: "center",
      width: "100%"
    },
    title: {
      color: colors.neutrals[100],
      fontFamily: fontFamily.display.semiBold,
      textAlign: "center"
    }
  })
};

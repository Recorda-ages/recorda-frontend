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
import { Icon } from "react-native-paper";
import { useTranslation } from "react-i18next";

import { AppText, Input } from "@/components/ui";
import { baseColors, colors, fontFamily, radius, spacing } from "@/theme";

const DESCRIPTION_MAX_LENGTH = 500;

type ReportDialogProps = {
  description: string;
  hasError: boolean;
  onCancel: () => void;
  onChangeDescription: (description: string) => void;
  onSubmit: () => void;
  pending: boolean;
  visible: boolean;
};

/**
 * Modal de denúncia (US 40): descrição opcional e dois botões, sem lista de
 * motivos. Segue o padrão visual de `DeleteCommentDialog`.
 *
 * A apresentação é a mesma para Recorda e perfil — por isso o componente não
 * recebe o alvo. Quem escolhe o endpoint pelo `target.type` é o
 * `useReportDialog`, junto com a mutation.
 *
 * O componente é controlado — quem guarda o texto, o estado de envio e o
 * resultado é o `useReportDialog`, para que a mensagem de resultado sobreviva
 * ao fechamento do modal.
 */
export function ReportDialog({
  description,
  hasError,
  onCancel,
  onChangeDescription,
  onSubmit,
  pending,
  visible
}: Readonly<ReportDialogProps>) {
  const { t } = useTranslation();

  // Um envio em curso não pode ser interrompido pelo botão voltar do Android:
  // fechar aqui descartaria o texto de uma denúncia que talvez seja aceita.
  const handleRequestClose = () => {
    if (!pending) {
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
      {/* Tocar no backdrop apenas dispensa o teclado: fechar o modal é só pelos
          botões e pelo onRequestClose, para não descartar o texto sem intenção. */}
      <Pressable accessible={false} onPress={Keyboard.dismiss} style={styles.backdrop}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.keyboardAvoiding}
        >
          <View accessibilityViewIsModal style={styles.dialog}>
            <View style={styles.iconBox}>
              <Icon color={baseColors.white} size={28} source="message-alert-outline" />
            </View>
            <AppText style={styles.title} variant="headline4">
              {t("moderation.report.title")}
            </AppText>
            <View style={styles.field}>
              {/* A mensagem é o label visual do campo — e, por isso, também o
                  nome acessível dele. Placeholder não cumpre esse papel. */}
              <AppText style={styles.message} variant="body1">
                {t("moderation.report.message")}
              </AppText>
              <Input
                accessibilityLabel={t("moderation.report.message")}
                editable={!pending}
                inputContainerStyle={styles.inputContainer}
                maxLength={DESCRIPTION_MAX_LENGTH}
                multiline
                onChangeText={onChangeDescription}
                placeholder={t("moderation.report.descriptionPlaceholder")}
                style={styles.input}
                textAlignVertical="top"
                value={description}
                variant="dark"
              />
              <AppText style={styles.counter} variant="caption">
                {t("moderation.report.counter", {
                  current: description.length,
                  max: DESCRIPTION_MAX_LENGTH
                })}
              </AppText>
            </View>
            {hasError ? (
              <AppText accessibilityLiveRegion="polite" style={styles.error} variant="caption">
                {t("moderation.report.error.generic")}
              </AppText>
            ) : null}
            <View style={styles.actions}>
              <Pressable
                accessibilityLabel={t("moderation.report.cancel")}
                accessibilityRole="button"
                accessibilityState={{ disabled: pending }}
                disabled={pending}
                onPress={onCancel}
                style={({ pressed }) => [
                  styles.button,
                  styles.cancelButton,
                  pressed ? styles.pressed : null
                ]}
              >
                <AppText style={styles.cancelLabel} variant="buttonLarge">
                  {t("moderation.report.cancel")}
                </AppText>
              </Pressable>
              <Pressable
                accessibilityLabel={t("moderation.report.submit")}
                accessibilityRole="button"
                accessibilityState={{ busy: pending, disabled: pending }}
                disabled={pending}
                onPress={onSubmit}
                style={({ pressed }) => [
                  styles.button,
                  styles.submitButton,
                  pressed ? styles.pressed : null
                ]}
              >
                {pending ? (
                  <ActivityIndicator color={baseColors.white} />
                ) : (
                  <AppText style={styles.submitLabel} variant="buttonLarge">
                    {t("moderation.report.submit")}
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
  counter: {
    color: colors.neutrals[300],
    textAlign: "right"
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
  error: {
    color: colors.error[200],
    textAlign: "center"
  },
  field: {
    gap: spacing[1],
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
  message: {
    color: colors.neutrals[300],
    fontFamily: fontFamily.display.medium,
    // O espaço abaixo da mensagem é este valor somado ao `field.gap` (4px);
    marginBottom: spacing[3]
  },
  pressed: {
    opacity: 0.82
  },
  submitButton: {
    backgroundColor: colors.error[300]
  },
  submitLabel: {
    color: baseColors.white
  },
  title: {
    color: colors.neutrals[100],
    fontFamily: fontFamily.display.semiBold,
    marginBottom: spacing[2],
    textAlign: "center"
  }
});

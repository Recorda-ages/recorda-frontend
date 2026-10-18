import React, { useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Icon } from "react-native-paper";
import { useTranslation } from "react-i18next";
import { colors, withOpacity } from "@/theme";
import { AdminUserRow } from "../types";

export type ModerationActionType = "SUSPEND" | "REACTIVATE";

export type UserModerationFormSubmitData = {
  reason: string;
  resolve_open_reports?: boolean;
};

export type UserModerationFormProps = {
  action: ModerationActionType;
  errorMessage?: string | null;
  isLoading?: boolean;
  onCancel: () => void;
  onSubmit: (data: UserModerationFormSubmitData) => void;
  targetUser: AdminUserRow;
};

export const UserModerationForm: React.FC<UserModerationFormProps> = ({
  action,
  errorMessage,
  isLoading = false,
  onCancel,
  onSubmit,
  targetUser
}) => {
  const { t } = useTranslation();
  const isSuspend = action === "SUSPEND";
  const [reason, setReason] = useState("");
  const [resolveOpenReports, setResolveOpenReports] = useState(true);

  const trimmedReason = reason.trim();
  const isValidReason = trimmedReason.length >= 1 && trimmedReason.length <= 500;
  const isSubmitDisabled = isLoading || !isValidReason;
  let submitLabel = isSuspend
    ? t("moderation.account.confirmSuspend")
    : t("moderation.account.confirmReactivate");
  if (isLoading) submitLabel = t("moderation.account.submitting");

  const handleSubmit = () => {
    if (isSubmitDisabled) {
      return;
    }

    if (isSuspend) {
      onSubmit({
        reason: trimmedReason,
        resolve_open_reports: resolveOpenReports
      });
    } else {
      onSubmit({
        reason: trimmedReason
      });
    }
  };

  return (
    <View style={styles.container} testID="user-moderation-form">
      <Text style={styles.title}>
        {isSuspend ? t("moderation.account.suspendTitle") : t("moderation.account.reactivateTitle")}
      </Text>
      <Text style={styles.subtitle}>
        {t("moderation.account.userLabel")} <Text style={styles.bold}>{targetUser.username}</Text>
      </Text>

      {errorMessage ? (
        <View style={styles.errorContainer} testID="form-error-container">
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      ) : null}

      <Text style={styles.label}>{t("moderation.account.reasonLabel")}</Text>
      <TextInput
        accessibilityLabel={t("moderation.account.reasonInput")}
        editable={!isLoading}
        multiline
        numberOfLines={4}
        onChangeText={setReason}
        placeholder={t("moderation.account.reasonPlaceholder", { max: 500 })}
        placeholderTextColor="#888"
        style={styles.textInput}
        testID="moderation-reason-input"
        value={reason}
      />
      <View style={styles.counterContainer}>
        <Text
          style={[styles.counterText, trimmedReason.length > 500 && styles.counterError]}
          testID="moderation-char-counter"
        >
          {trimmedReason.length}/500
        </Text>
      </View>

      {isSuspend ? (
        <TouchableOpacity
          activeOpacity={0.7}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: resolveOpenReports, disabled: isLoading }}
          disabled={isLoading}
          onPress={(event) => {
            event?.stopPropagation();
            setResolveOpenReports((prev) => !prev);
          }}
          style={styles.checkboxRow}
          testID="resolve-reports-toggle"
        >
          <View
            style={[styles.checkbox, resolveOpenReports && styles.checkboxChecked]}
            testID="resolve-reports-checkbox"
          >
            {resolveOpenReports ? (
              <Icon color={colors.neutrals[900]} size={14} source="check" />
            ) : null}
          </View>
          <Text style={styles.checkboxLabel}>{t("moderation.account.resolveReports")}</Text>
        </TouchableOpacity>
      ) : null}

      <View style={styles.actionsRow}>
        <TouchableOpacity
          activeOpacity={0.7}
          accessibilityRole="button"
          disabled={isLoading}
          onPress={(event) => {
            event?.stopPropagation();
            onCancel();
          }}
          style={[styles.button, styles.cancelButton]}
          testID="moderation-cancel-button"
        >
          <Text style={styles.cancelButtonText}>{t("moderation.account.cancel")}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityState={{ disabled: isSubmitDisabled, busy: isLoading }}
          disabled={isSubmitDisabled}
          onPress={(event) => {
            event?.stopPropagation();
            handleSubmit();
          }}
          style={[
            styles.button,
            isSuspend ? styles.suspendButton : styles.reactivateButton,
            isSubmitDisabled && styles.disabledButton
          ]}
          testID="moderation-submit-button"
        >
          <Text style={styles.submitButtonText}>{submitLabel}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.neutrals[800],
    borderRadius: 12,
    padding: 16,
    width: "100%"
  },
  title: {
    color: colors.neutrals[100],
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4
  },
  subtitle: {
    color: colors.neutrals[200],
    fontSize: 14,
    marginBottom: 16
  },
  bold: {
    fontWeight: "bold"
  },
  errorContainer: {
    backgroundColor: withOpacity(colors.error[300], 0.15),
    borderColor: colors.error[300],
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
    padding: 10
  },
  errorText: {
    color: colors.error[200],
    fontSize: 13
  },
  label: {
    color: colors.neutrals[100],
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6
  },
  textInput: {
    backgroundColor: colors.neutrals[700],
    borderColor: colors.neutrals[600],
    borderRadius: 8,
    borderWidth: 1,
    color: colors.neutrals[100],
    fontSize: 14,
    minHeight: 90,
    padding: 12,
    textAlignVertical: "top"
  },
  counterContainer: {
    alignItems: "flex-end",
    marginTop: 4
  },
  counterText: {
    color: colors.neutrals[300],
    fontSize: 12
  },
  counterError: {
    color: colors.error[200]
  },
  checkboxRow: {
    alignItems: "center",
    flexDirection: "row",
    marginVertical: 12
  },
  checkbox: {
    alignItems: "center",
    borderColor: colors.neutrals[400],
    borderRadius: 4,
    borderWidth: 1,
    height: 20,
    justifyContent: "center",
    marginRight: 10,
    width: 20
  },
  checkboxChecked: {
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[500]
  },
  checkboxLabel: {
    color: colors.neutrals[100],
    flex: 1,
    fontSize: 13
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 16
  },
  button: {
    borderRadius: 8,
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 10
  },
  cancelButton: {
    backgroundColor: colors.neutrals[700],
    marginRight: 8
  },
  cancelButtonText: {
    color: colors.neutrals[100],
    fontSize: 14,
    fontWeight: "600"
  },
  suspendButton: {
    backgroundColor: colors.error[400]
  },
  reactivateButton: {
    backgroundColor: colors.success[400]
  },
  disabledButton: {
    opacity: 0.5
  },
  submitButtonText: {
    color: colors.neutrals[100],
    fontSize: 14,
    fontWeight: "bold"
  }
});

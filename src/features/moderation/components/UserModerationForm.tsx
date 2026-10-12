import React, { useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
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
  const isSuspend = action === "SUSPEND";
  const [reason, setReason] = useState("");
  const [resolveOpenReports, setResolveOpenReports] = useState(true);

  const trimmedReason = reason.trim();
  const isValidReason = trimmedReason.length >= 1 && trimmedReason.length <= 500;
  const isSubmitDisabled = isLoading || !isValidReason;

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
      <Text style={styles.title}>{isSuspend ? "Suspender Conta" : "Reativar Conta"}</Text>
      <Text style={styles.subtitle}>
        Usuário: <Text style={styles.bold}>{targetUser.username}</Text>
      </Text>

      {errorMessage ? (
        <View style={styles.errorContainer} testID="form-error-container">
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      ) : null}

      <Text style={styles.label}>Motivo (obrigatório):</Text>
      <TextInput
        editable={!isLoading}
        multiline
        numberOfLines={4}
        onChangeText={setReason}
        placeholder="Informe o motivo da ação (máx. 500 caracteres)..."
        placeholderTextColor="#888"
        style={styles.textInput}
        testID="moderation-reason-input"
        value={reason}
      />
      <View style={styles.counterContainer}>
        <Text
          style={[styles.counterText, reason.length > 500 && styles.counterError]}
          testID="moderation-char-counter"
        >
          {trimmedReason.length}/500
        </Text>
      </View>

      {isSuspend ? (
        <TouchableOpacity
          activeOpacity={0.7}
          disabled={isLoading}
          onPress={() => setResolveOpenReports((prev) => !prev)}
          style={styles.checkboxRow}
          testID="resolve-reports-toggle"
        >
          <View
            style={[styles.checkbox, resolveOpenReports && styles.checkboxChecked]}
            testID="resolve-reports-checkbox"
          >
            {resolveOpenReports ? <Text style={styles.checkmark}>✓</Text> : null}
          </View>
          <Text style={styles.checkboxLabel}>
            Marcar denúncias abertas do perfil como resolvidas
          </Text>
        </TouchableOpacity>
      ) : null}

      <View style={styles.actionsRow}>
        <TouchableOpacity
          activeOpacity={0.7}
          disabled={isLoading}
          onPress={onCancel}
          style={[styles.button, styles.cancelButton]}
          testID="moderation-cancel-button"
        >
          <Text style={styles.cancelButtonText}>Cancelar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          disabled={isSubmitDisabled}
          onPress={handleSubmit}
          style={[
            styles.button,
            isSuspend ? styles.suspendButton : styles.reactivateButton,
            isSubmitDisabled && styles.disabledButton
          ]}
          testID="moderation-submit-button"
        >
          <Text style={styles.submitButtonText}>
            {isLoading ? "Enviando..." : isSuspend ? "Confirmar Suspensão" : "Confirmar Reativação"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#1E1E1E",
    borderRadius: 12,
    padding: 16,
    width: "100%"
  },
  title: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4
  },
  subtitle: {
    color: "#CCCCCC",
    fontSize: 14,
    marginBottom: 16
  },
  bold: {
    fontWeight: "bold"
  },
  errorContainer: {
    backgroundColor: "rgba(255, 75, 75, 0.15)",
    borderColor: "#FF4B4B",
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
    padding: 10
  },
  errorText: {
    color: "#FF4B4B",
    fontSize: 13
  },
  label: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6
  },
  textInput: {
    backgroundColor: "#2C2C2E",
    borderColor: "#3A3A3C",
    borderRadius: 8,
    borderWidth: 1,
    color: "#FFFFFF",
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
    color: "#888888",
    fontSize: 12
  },
  counterError: {
    color: "#FF4B4B"
  },
  checkboxRow: {
    alignItems: "center",
    flexDirection: "row",
    marginVertical: 12
  },
  checkbox: {
    alignItems: "center",
    borderColor: "#666666",
    borderRadius: 4,
    borderWidth: 1,
    height: 20,
    justifyContent: "center",
    marginRight: 10,
    width: 20
  },
  checkboxChecked: {
    backgroundColor: "#6200EE",
    borderColor: "#6200EE"
  },
  checkmark: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold"
  },
  checkboxLabel: {
    color: "#E0E0E0",
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
    backgroundColor: "#3A3A3C",
    marginRight: 8
  },
  cancelButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600"
  },
  suspendButton: {
    backgroundColor: "#E53935"
  },
  reactivateButton: {
    backgroundColor: "#43A047"
  },
  disabledButton: {
    opacity: 0.5
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold"
  }
});

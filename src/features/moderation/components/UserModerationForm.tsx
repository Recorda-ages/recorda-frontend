import React, { useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { AdminUserRow } from "../types";

export type UserModerationFormSubmitData = {
  reason: string;
  resolve_open_reports?: boolean;
};

export type UserModerationFormProps = {
  action: "SUSPEND" | "REACTIVATE";
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
  const [reason, setReason] = useState("");
  const [resolveReports, setResolveReports] = useState(true);

  const trimmedLength = reason.trim().length;
  const isReasonValid = trimmedLength >= 1 && trimmedLength <= 500;
  const canSubmit = isReasonValid && !isLoading;

  const isSuspend = action === "SUSPEND";
  const title = isSuspend
    ? `Suspender conta de @${targetUser.username}`
    : `Reativar conta de @${targetUser.username}`;

  const handleSubmit = () => {
    if (!canSubmit) {
      return;
    }
    onSubmit({
      reason: reason.trim(),
      resolve_open_reports: isSuspend ? resolveReports : undefined
    });
  };

  return (
    <View style={styles.card} testID="user-moderation-form">
      <Text style={styles.title}>{title}</Text>

      <Text style={styles.label}>Motivo (obrigatório)</Text>
      <TextInput
        editable={!isLoading}
        maxLength={500}
        multiline
        numberOfLines={3}
        onChangeText={setReason}
        placeholder="Descreva o motivo desta ação administrativa..."
        placeholderTextColor="#777"
        style={styles.textArea}
        testID="moderation-reason-input"
        value={reason}
      />
      <View style={styles.counterRow}>
        <Text style={styles.counterText}>{trimmedLength}/500 caracteres</Text>
      </View>

      {isSuspend ? (
        <TouchableOpacity
          activeOpacity={0.8}
          disabled={isLoading}
          onPress={() => setResolveReports((prev) => !prev)}
          style={styles.checkboxRow}
          testID="resolve-reports-toggle"
        >
          <View style={[styles.checkbox, resolveReports && styles.checkboxActive]}>
            {resolveReports ? <Text style={styles.checkmark}>✓</Text> : null}
          </View>
          <Text style={styles.checkboxLabel}>
            Marcar denúncias abertas do perfil como resolvidas
          </Text>
        </TouchableOpacity>
      ) : null}

      {errorMessage ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      ) : null}

      <View style={styles.buttonRow}>
        <TouchableOpacity
          disabled={isLoading}
          onPress={onCancel}
          style={[styles.button, styles.cancelButton]}
          testID="moderation-cancel-button"
        >
          <Text style={styles.cancelButtonText}>Cancelar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          disabled={!canSubmit}
          onPress={handleSubmit}
          style={[
            styles.button,
            isSuspend ? styles.confirmSuspendButton : styles.confirmReactivateButton,
            !canSubmit && styles.disabledButton
          ]}
          testID="moderation-submit-button"
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.confirmButtonText}>
              {isSuspend ? "Confirmar Suspensão" : "Confirmar Reativação"}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#1E1E1E",
    borderColor: "#333333",
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    width: "100%"
  },
  title: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12
  },
  label: {
    color: "#CCCCCC",
    fontSize: 13,
    marginBottom: 6
  },
  textArea: {
    backgroundColor: "#121212",
    borderColor: "#444444",
    borderRadius: 8,
    borderWidth: 1,
    color: "#FFFFFF",
    fontSize: 14,
    minHeight: 80,
    padding: 10,
    textAlignVertical: "top"
  },
  counterRow: {
    alignItems: "flex-end",
    marginTop: 4
  },
  counterText: {
    color: "#888888",
    fontSize: 11
  },
  checkboxRow: {
    alignItems: "center",
    flexDirection: "row",
    marginTop: 12
  },
  checkbox: {
    alignItems: "center",
    borderColor: "#666666",
    borderRadius: 4,
    borderWidth: 1,
    height: 20,
    justifyContent: "center",
    marginRight: 8,
    width: 20
  },
  checkboxActive: {
    backgroundColor: "#E53935",
    borderColor: "#E53935"
  },
  checkmark: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold"
  },
  checkboxLabel: {
    color: "#DDDDDD",
    flex: 1,
    fontSize: 12
  },
  errorContainer: {
    backgroundColor: "rgba(229, 57, 53, 0.15)",
    borderColor: "#E53935",
    borderRadius: 6,
    borderWidth: 1,
    marginTop: 12,
    padding: 8
  },
  errorText: {
    color: "#FF8A80",
    fontSize: 12
  },
  buttonRow: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "flex-end",
    marginTop: 16
  },
  button: {
    alignItems: "center",
    borderRadius: 8,
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 10
  },
  cancelButton: {
    backgroundColor: "#333333"
  },
  cancelButtonText: {
    color: "#FFFFFF",
    fontSize: 13
  },
  confirmSuspendButton: {
    backgroundColor: "#E53935"
  },
  confirmReactivateButton: {
    backgroundColor: "#43A047"
  },
  confirmButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "bold"
  },
  disabledButton: {
    opacity: 0.5
  }
});

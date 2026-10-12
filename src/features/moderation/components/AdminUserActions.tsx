import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { AdminIdentity, AdminUserDetail, AdminUserRow } from "../types";
import {
  adminModerationMockService,
  AdminModerationError
} from "../services/adminModerationMockService";
import { UserModerationForm, UserModerationFormSubmitData } from "./UserModerationForm";

export type AdminUserActionsProps = {
  currentAdmin?: AdminIdentity | null;
  onMutationError?: (error: Error) => void;
  onMutationSuccess?: (result: { detail?: AdminUserDetail; user: AdminUserRow }) => void;
  targetUser: AdminUserRow;
};

export const AdminUserActions: React.FC<AdminUserActionsProps> = ({
  currentAdmin,
  onMutationError,
  onMutationSuccess,
  targetUser
}) => {
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!currentAdmin) {
    return null;
  }

  if (currentAdmin.user_id === targetUser.user_id) {
    return null;
  }

  const isTargetAdmin = targetUser.role === "ADMIN";
  const isTargetActive = targetUser.status === "ACTIVE";

  if (isTargetAdmin && isTargetActive) {
    return (
      <View style={styles.noticeContainer} testID="admin-action-notice">
        <Text style={styles.noticeText}>Não é permitido suspender outro administrador.</Text>
      </View>
    );
  }

  const actionType = isTargetActive ? "SUSPEND" : "REACTIVATE";

  const handleOpenForm = () => {
    setErrorMessage(null);
    setIsFormVisible(true);
  };

  const handleCloseForm = () => {
    if (!isLoading) {
      setIsFormVisible(false);
      setErrorMessage(null);
    }
  };

  const handleSubmit = async (data: UserModerationFormSubmitData) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      let result;
      if (actionType === "SUSPEND") {
        result = await adminModerationMockService.suspendUser(targetUser.user_id, currentAdmin, {
          reason: data.reason,
          resolve_open_reports: data.resolve_open_reports
        });
      } else {
        result = await adminModerationMockService.reactivateUser(targetUser.user_id, currentAdmin, {
          reason: data.reason
        });
      }

      setIsFormVisible(false);
      onMutationSuccess?.(result);
    } catch (err: unknown) {
      const message =
        err instanceof AdminModerationError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Erro inesperado ao realizar moderação.";
      setErrorMessage(message);
      if (err instanceof Error) {
        onMutationError?.(err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container} testID="admin-user-actions">
      {!isFormVisible ? (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleOpenForm}
          style={[
            styles.actionButton,
            isTargetActive ? styles.suspendButton : styles.reactivateButton
          ]}
          testID={isTargetActive ? "suspend-action-trigger" : "reactivate-action-trigger"}
        >
          <Text style={styles.actionButtonText}>
            {isTargetActive ? "Suspender Conta" : "Reativar Conta"}
          </Text>
        </TouchableOpacity>
      ) : (
        <UserModerationForm
          action={actionType}
          errorMessage={errorMessage}
          isLoading={isLoading}
          onCancel={handleCloseForm}
          onSubmit={handleSubmit}
          targetUser={targetUser}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    width: "100%"
  },
  actionButton: {
    alignItems: "center",
    borderRadius: 8,
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 10
  },
  suspendButton: {
    backgroundColor: "#E53935"
  },
  reactivateButton: {
    backgroundColor: "#43A047"
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold"
  },
  noticeContainer: {
    backgroundColor: "rgba(255, 193, 7, 0.15)",
    borderColor: "#FFC107",
    borderRadius: 8,
    borderWidth: 1,
    padding: 10
  },
  noticeText: {
    color: "#FFC107",
    fontSize: 13
  }
});

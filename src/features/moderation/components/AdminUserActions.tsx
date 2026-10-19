import React, { useRef, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTranslation } from "react-i18next";
import { colors, withOpacity } from "@/theme";
import {
  AdminIdentity,
  AdminModerationResult,
  AdminModerationService,
  AdminUserRow
} from "../types";
import { adminModerationMockService } from "../services/adminModerationMockService";
import { UserModerationForm, UserModerationFormSubmitData } from "./UserModerationForm";

export type AdminUserActionsProps = {
  currentAdmin?: AdminIdentity | null;
  moderationService?: AdminModerationService;
  onMutationError?: (error: Error) => void;
  onMutationSuccess?: (result: AdminModerationResult) => void;
  targetUser: AdminUserRow;
};

export function AdminUserActions(props: AdminUserActionsProps) {
  const { targetUser } = props;
  return <AdminUserActionsContent key={`${targetUser.user_id}:${targetUser.status}`} {...props} />;
}

const AdminUserActionsContent: React.FC<AdminUserActionsProps> = ({
  currentAdmin,
  moderationService = adminModerationMockService,
  onMutationError,
  onMutationSuccess,
  targetUser
}) => {
  const { t } = useTranslation();
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentStatus, setCurrentStatus] = useState(targetUser.status);
  const submitting = useRef(false);

  if (currentAdmin?.role !== "ADMIN") {
    return null;
  }

  if (currentAdmin.user_id === targetUser.user_id) {
    return null;
  }

  const isTargetAdmin = targetUser.role === "ADMIN";
  const isTargetActive = currentStatus === "ACTIVE";

  if (isTargetAdmin && isTargetActive) {
    return (
      <View style={styles.noticeContainer} testID="admin-action-notice">
        <Text style={styles.noticeText}>{t("moderation.account.adminNotice")}</Text>
      </View>
    );
  }

  const actionType = isTargetActive ? "SUSPEND" : "REACTIVATE";

  const handleOpenForm = () => {
    setErrorMessage(null);
    setIsFormVisible(true);
  };

  const handleCloseForm = () => {
    if (!submitting.current) {
      setIsFormVisible(false);
      setErrorMessage(null);
    }
  };

  const handleSubmit = async (data: UserModerationFormSubmitData) => {
    if (submitting.current) return;
    submitting.current = true;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      let result;
      if (actionType === "SUSPEND") {
        result = await moderationService.suspendUser(targetUser.user_id, currentAdmin, {
          reason: data.reason,
          resolve_open_reports: data.resolve_open_reports
        });
      } else {
        result = await moderationService.reactivateUser(targetUser.user_id, currentAdmin, {
          reason: data.reason
        });
      }

      setCurrentStatus(result.user.status);
      setIsFormVisible(false);
      onMutationSuccess?.(result);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : t("moderation.account.unexpectedError"));
      if (err instanceof Error) {
        onMutationError?.(err);
      }
    } finally {
      submitting.current = false;
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container} testID="admin-user-actions">
      {!isFormVisible ? (
        <TouchableOpacity
          accessibilityRole="button"
          activeOpacity={0.7}
          onPress={(event) => {
            event?.stopPropagation();
            handleOpenForm();
          }}
          style={[
            styles.actionButton,
            isTargetActive ? styles.suspendButton : styles.reactivateButton
          ]}
          testID={isTargetActive ? "suspend-action-trigger" : "reactivate-action-trigger"}
        >
          <Text style={styles.actionButtonText}>
            {isTargetActive
              ? t("moderation.account.suspendTitle")
              : t("moderation.account.reactivateTitle")}
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
    backgroundColor: colors.error[400]
  },
  reactivateButton: {
    backgroundColor: colors.success[400]
  },
  actionButtonText: {
    color: colors.neutrals[100],
    fontSize: 14,
    fontWeight: "bold"
  },
  noticeContainer: {
    backgroundColor: withOpacity(colors.warning[300], 0.15),
    borderColor: colors.warning[300],
    borderRadius: 8,
    borderWidth: 1,
    padding: 10
  },
  noticeText: {
    color: colors.warning[300],
    fontSize: 13
  }
});

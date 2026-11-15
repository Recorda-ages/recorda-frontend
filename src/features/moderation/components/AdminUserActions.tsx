import React, { useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Icon } from "react-native-paper";
import { useQueryClient } from "@tanstack/react-query";

import { AppText } from "@/components/ui";
import { ADMIN_REASON_MAX_LENGTH, ReasonDialog } from "@/features/admin/components/ReasonDialog";
import { adminModerationService } from "@/features/admin/services/adminUserService";
import { baseColors, colors, radius, spacing, withOpacity } from "@/theme";

import {
  AdminIdentity,
  AdminModerationResult,
  AdminModerationService,
  AdminUserRow
} from "../types";

export type AdminUserActionsProps = {
  compact?: boolean;
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
  compact = false,
  currentAdmin,
  moderationService = adminModerationService,
  onMutationError,
  onMutationSuccess,
  targetUser
}) => {
  const { t } = useTranslation();
  const client = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [resolveOpenReports, setResolveOpenReports] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>();
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

  const isSuspend = isTargetActive;
  const username = targetUser.username;

  const openDialog = () => {
    setReason("");
    setResolveOpenReports(true);
    setErrorMessage(undefined);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    if (!submitting.current) {
      setIsDialogOpen(false);
    }
  };

  const changeReason = (value: string) => {
    setReason(value);
    setErrorMessage(undefined);
  };

  const confirm = async () => {
    const trimmedReason = reason.trim();
    if (submitting.current || !trimmedReason || trimmedReason.length > ADMIN_REASON_MAX_LENGTH) {
      return;
    }
    submitting.current = true;
    setIsLoading(true);
    setErrorMessage(undefined);

    try {
      const result = isSuspend
        ? await moderationService.suspendUser(targetUser.user_id, currentAdmin, {
            reason: trimmedReason,
            resolve_open_reports: resolveOpenReports
          })
        : await moderationService.reactivateUser(targetUser.user_id, currentAdmin, {
            reason: trimmedReason
          });

      void client.invalidateQueries({ queryKey: ["admin"] });
      setIsDialogOpen(false);
      setCurrentStatus(result.user.status);
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

  const triggerLabel = isSuspend
    ? t(compact ? "moderation.account.suspendShort" : "moderation.account.suspendTitle")
    : t(compact ? "moderation.account.reactivateShort" : "moderation.account.reactivateTitle");
  const tone = isSuspend ? colors.error[300] : colors.primary[500];

  return (
    <View style={styles.container} testID="admin-user-actions">
      <Pressable
        accessibilityLabel={triggerLabel}
        accessibilityRole="button"
        onPress={(event) => {
          event?.stopPropagation();
          openDialog();
        }}
        style={({ pressed }) => [
          compact ? styles.compactTrigger : styles.trigger,
          compact
            ? { backgroundColor: withOpacity(tone, 0.12), borderColor: tone }
            : isSuspend
              ? styles.suspendTrigger
              : styles.reactivateTrigger,
          pressed ? styles.pressed : undefined
        ]}
        testID={isSuspend ? "suspend-action-trigger" : "reactivate-action-trigger"}
      >
        <Icon
          color={compact ? tone : isSuspend ? baseColors.white : colors.primary[100]}
          size={compact ? 16 : 20}
          source={isSuspend ? "account-cancel-outline" : "account-check-outline"}
        />
        <AppText
          numberOfLines={1}
          style={
            compact
              ? { color: tone }
              : isSuspend
                ? styles.suspendTriggerLabel
                : styles.reactivateTriggerLabel
          }
          variant={compact ? "buttonSmall" : "buttonLarge"}
        >
          {triggerLabel}
        </AppText>
      </Pressable>

      <ReasonDialog
        confirmLabel={t(
          isSuspend ? "moderation.account.suspendShort" : "moderation.account.reactivateShort"
        )}
        confirmTone={isSuspend ? "destructive" : "primary"}
        error={errorMessage}
        icon={isSuspend ? "account-cancel-outline" : "account-check-outline"}
        loading={isLoading}
        message={t(
          isSuspend ? "moderation.account.suspendMessage" : "moderation.account.reactivateMessage",
          { username }
        )}
        onCancel={closeDialog}
        onChangeReason={changeReason}
        onConfirm={() => void confirm()}
        reason={reason}
        title={t(
          isSuspend
            ? "moderation.account.suspendDialogTitle"
            : "moderation.account.reactivateDialogTitle"
        )}
        visible={isDialogOpen}
      >
        {isSuspend ? (
          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: resolveOpenReports, disabled: isLoading }}
            disabled={isLoading}
            onPress={() => setResolveOpenReports((current) => !current)}
            style={styles.checkboxRow}
            testID="resolve-reports-toggle"
          >
            <View style={[styles.checkbox, resolveOpenReports && styles.checkboxChecked]}>
              {resolveOpenReports ? (
                <Icon color={colors.neutrals[900]} size={14} source="check" />
              ) : null}
            </View>
            <AppText style={styles.checkboxLabel} variant="body2">
              {t("moderation.account.resolveReports")}
            </AppText>
          </Pressable>
        ) : null}
      </ReasonDialog>
    </View>
  );
};

const styles = StyleSheet.create({
  checkbox: {
    alignItems: "center",
    borderColor: colors.neutrals[400],
    borderRadius: 4,
    borderWidth: 1,
    height: 20,
    justifyContent: "center",
    width: 20
  },
  checkboxChecked: {
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[500]
  },
  checkboxLabel: {
    color: colors.neutrals[100],
    flex: 1
  },
  checkboxRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing[3],
    width: "100%"
  },
  compactTrigger: {
    alignItems: "center",
    borderRadius: radius.full,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing[1],
    height: 36,
    justifyContent: "center",
    paddingHorizontal: spacing[3]
  },
  container: {
    width: "100%"
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
  },
  pressed: {
    opacity: 0.82
  },
  reactivateTrigger: {
    backgroundColor: colors.primary[800]
  },
  reactivateTriggerLabel: {
    color: colors.primary[100]
  },
  suspendTrigger: {
    backgroundColor: colors.error[300]
  },
  suspendTriggerLabel: {
    color: baseColors.white
  },
  trigger: {
    alignItems: "center",
    borderRadius: radius.xl,
    flexDirection: "row",
    gap: spacing[2],
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: spacing[4]
  }
});

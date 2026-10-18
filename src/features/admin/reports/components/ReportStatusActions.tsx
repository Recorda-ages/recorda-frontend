import type { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { AppText } from "@/components/ui";
import { colors, radius, spacing } from "@/theme";

import type { AdminReportStatus } from "../../types";

type ReportStatusActionsProps = {
  disabled?: boolean;
  onSelect: (status: AdminReportStatus) => void;
  primaryAction?: ReactNode;
  statuses: readonly AdminReportStatus[];
};

export function ReportStatusActions({
  disabled = false,
  onSelect,
  primaryAction,
  statuses
}: Readonly<ReportStatusActionsProps>) {
  const { t } = useTranslation();

  if (statuses.length === 0 && !primaryAction) {
    return null;
  }

  return (
    <View style={styles.actions} testID="admin-report-status-actions">
      {primaryAction}
      {statuses.map((status) => {
        const label = t(`admin.reportDetail.statusActions.${status}.button`);

        return (
          <Pressable
            accessibilityLabel={label}
            accessibilityRole="button"
            accessibilityState={{ disabled }}
            disabled={disabled}
            key={status}
            onPress={() => onSelect(status)}
            style={({ pressed }) => [
              styles.button,
              status === "RESOLVED" ? styles.resolve : styles.neutral,
              disabled ? styles.disabled : undefined,
              pressed ? styles.pressed : undefined
            ]}
            testID={`admin-report-status-${status}`}
          >
            <AppText
              style={status === "RESOLVED" ? styles.resolveLabel : styles.neutralLabel}
              variant="buttonLarge"
            >
              {label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: spacing[2]
  },
  button: {
    alignItems: "center",
    borderRadius: radius.xl,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: spacing[4]
  },
  disabled: {
    opacity: 0.56
  },
  neutral: {
    backgroundColor: colors.neutrals[600],
    borderColor: colors.neutrals[400],
    borderWidth: 1
  },
  neutralLabel: {
    color: colors.neutrals[100]
  },
  pressed: {
    opacity: 0.82
  },
  resolve: {
    backgroundColor: colors.primary[800]
  },
  resolveLabel: {
    color: colors.primary[100]
  }
});

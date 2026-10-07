import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { AppText } from "@/components/ui";
import { colors, radius, spacing } from "@/theme";

import type { AdminStatus } from "../types";

type StatusBadgeProps = {
  status: AdminStatus;
};

const statusTranslationKeys: Record<AdminStatus, string> = {
  ACTIVE: "admin.status.active",
  DISMISSED: "admin.status.dismissed",
  OPEN: "admin.status.open",
  RESOLVED: "admin.status.resolved",
  SUSPENDED: "admin.status.suspended"
};

export function StatusBadge({ status }: Readonly<StatusBadgeProps>) {
  const { t } = useTranslation();
  const label = t(statusTranslationKeys[status]);

  return (
    <View accessibilityLabel={t("admin.status.accessibilityLabel", { status: label })}>
      <View style={[styles.badge, statusStyles[status]]}>
        <AppText style={styles.label} variant="caption">
          {label}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: radius.xl,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1]
  },
  label: {
    color: colors.neutrals[100]
  }
});

const statusStyles = StyleSheet.create({
  ACTIVE: { backgroundColor: colors.success[400] },
  DISMISSED: { backgroundColor: colors.neutrals[600] },
  OPEN: { backgroundColor: colors.warning[400] },
  RESOLVED: { backgroundColor: colors.success[400] },
  SUSPENDED: { backgroundColor: colors.error[400] }
});

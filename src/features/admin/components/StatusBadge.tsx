import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { AppText } from "@/components/ui";
import { colors, fontFamily, radius, spacing } from "@/theme";

import type { AdminStatus } from "../types";

type StatusBadgeProps = {
  status: AdminStatus;
  variant?: "badge" | "text";
};

export const STATUS_TRANSLATION_KEYS: Record<AdminStatus, string> = {
  ACTIVE: "admin.status.active",
  DISMISSED: "admin.status.dismissed",
  OPEN: "admin.status.open",
  RESOLVED: "admin.status.resolved",
  SUSPENDED: "admin.status.suspended"
};

export function StatusBadge({ status, variant = "badge" }: Readonly<StatusBadgeProps>) {
  const { i18n, t } = useTranslation();
  const label = t(STATUS_TRANSLATION_KEYS[status]);

  if (variant === "text") {
    return (
      <AppText style={[styles.text, textStyles[status]]} variant="caption">
        {label.toLocaleUpperCase(i18n.language)}
      </AppText>
    );
  }

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
  },
  text: {
    fontFamily: fontFamily.primary.semiBold
  }
});

const statusStyles = StyleSheet.create({
  ACTIVE: { backgroundColor: colors.success[400] },
  DISMISSED: { backgroundColor: colors.neutrals[600] },
  OPEN: { backgroundColor: colors.warning[400] },
  RESOLVED: { backgroundColor: colors.success[400] },
  SUSPENDED: { backgroundColor: colors.error[400] }
});

const textStyles = StyleSheet.create({
  ACTIVE: { color: colors.success[200] },
  DISMISSED: { color: colors.neutrals[300] },
  OPEN: { color: colors.warning[300] },
  RESOLVED: { color: colors.success[200] },
  SUSPENDED: { color: colors.error[200] }
});

import type { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { AppText } from "@/components/ui";
import { colors, fontFamily, radius, spacing } from "@/theme";

import type { AdminUserRow } from "../../types";

type AdminUserCardProps = {
  onViewHistory: (userId: string) => void;
  renderModerationActions?: (user: AdminUserRow) => ReactNode;
  user: AdminUserRow;
};

export function AdminUserCard({
  onViewHistory,
  renderModerationActions,
  user
}: Readonly<AdminUserCardProps>) {
  const { t } = useTranslation();
  const reportSummary =
    user.reports_count === 0
      ? t("admin.users.noReports")
      : t("admin.users.reportCount", { count: user.reports_count });

  return (
    <View style={styles.card} testID={`admin-user-card-${user.user_id}`}>
      <View style={styles.copy}>
        <View style={styles.statusLine}>
          <AppText
            style={[styles.status, user.status === "SUSPENDED" ? styles.suspended : styles.active]}
            variant="caption"
          >
            {t(`admin.users.status.${user.status.toLowerCase()}`)}
          </AppText>
          <AppText style={styles.separator}>•</AppText>
          <AppText style={styles.reportSummary} variant="caption">
            {reportSummary}
          </AppText>
        </View>
        <View style={styles.identityLine}>
          <AppText numberOfLines={1} style={styles.identity} variant="body2">
            @{user.username}
          </AppText>
          <AppText style={styles.separator}>•</AppText>
          <AppText numberOfLines={1} style={styles.identity} variant="body2">
            {t("admin.users.shortId", { id: shortUserId(user.user_id) })}
          </AppText>
        </View>
        <View style={styles.historyLine}>
          <AppText numberOfLines={1} style={styles.email} variant="caption">
            {user.email}
          </AppText>
          <AppText style={styles.separator} variant="caption">
            •
          </AppText>
          <Pressable
            accessibilityRole="button"
            onPress={() => onViewHistory(user.user_id)}
            testID={`admin-user-history-${user.user_id}`}
          >
            <AppText style={styles.history} variant="caption">
              {t("admin.users.viewHistory")}
            </AppText>
          </Pressable>
        </View>
      </View>
      {renderModerationActions ? (
        <View style={styles.actions}>{renderModerationActions(user)}</View>
      ) : null}
    </View>
  );
}

export function shortUserId(userId: string) {
  const suffix = userId.split("-").at(-1) ?? userId;
  return suffix.slice(-4).toUpperCase();
}

const styles = StyleSheet.create({
  actions: {
    alignItems: "flex-end",
    flexShrink: 0,
    justifyContent: "center",
    marginLeft: spacing[3],
    width: 96
  },
  active: { color: colors.primary[500] },
  card: {
    alignItems: "center",
    backgroundColor: colors.neutrals[800],
    borderRadius: radius.lg,
    flexDirection: "row",
    minHeight: 76,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2]
  },
  copy: { flex: 1, gap: 1, minWidth: 0 },
  email: { color: colors.neutrals[300], flexShrink: 1 },
  history: { color: colors.neutrals[300], fontFamily: fontFamily.primary.semiBold },
  historyLine: { alignItems: "center", flexDirection: "row", gap: spacing[1], minWidth: 0 },
  identityLine: { alignItems: "center", flexDirection: "row", gap: spacing[1], minWidth: 0 },
  identity: { color: colors.neutrals[100] },
  reportSummary: { color: colors.neutrals[300] },
  separator: { color: colors.neutrals[300] },
  status: { letterSpacing: 0.35 },
  statusLine: { alignItems: "center", flexDirection: "row", gap: spacing[1] },
  suspended: { color: colors.error[300] }
});

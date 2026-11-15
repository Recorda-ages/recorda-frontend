import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { AppText } from "@/components/ui";
import { colors, fontFamily, radius, spacing } from "@/theme";

import { StatusBadge } from "../../components/StatusBadge";
import type { AdminReportEntry, AdminReportHistoryEntry } from "../../types";
import { useReportDateTime } from "../useReportDateTime";

export function ReportEntries({ reports }: Readonly<{ reports: readonly AdminReportEntry[] }>) {
  const { t } = useTranslation();
  const formatDateTime = useReportDateTime();

  return (
    <View style={styles.section} testID="admin-report-entries">
      <AppText style={styles.title} variant="headline4">
        {t("admin.reportDetail.reportsTitle", { count: reports.length })}
      </AppText>
      {reports.map((report) => (
        <View
          key={report.reportId}
          style={styles.card}
          testID={`admin-report-entry-${report.reportId}`}
        >
          <View style={styles.cardHeader}>
            <AppText numberOfLines={1} style={styles.username}>
              @{report.reporterUsername}
            </AppText>
            <StatusBadge status={report.status} />
          </View>
          {report.description ? (
            <AppText style={styles.body}>{report.description}</AppText>
          ) : (
            <AppText style={[styles.body, styles.empty]}>
              {t("admin.reportDetail.noDescription")}
            </AppText>
          )}
          <AppText style={styles.meta} variant="caption">
            {formatDateTime(report.createdAt)}
          </AppText>
        </View>
      ))}
    </View>
  );
}

export function ReportHistory({
  actions
}: Readonly<{ actions: readonly AdminReportHistoryEntry[] }>) {
  const { t } = useTranslation();
  const formatDateTime = useReportDateTime();

  return (
    <View style={styles.section} testID="admin-report-history">
      <AppText style={styles.title} variant="headline4">
        {t("admin.reportDetail.historyTitle")}
      </AppText>
      {actions.length === 0 ? (
        <AppText style={styles.meta}>{t("admin.reportDetail.historyEmpty")}</AppText>
      ) : (
        actions.map((action) => (
          <View
            key={action.actionId}
            style={styles.card}
            testID={`admin-report-history-${action.actionId}`}
          >
            <AppText style={styles.username}>{historyLabel(action, t)}</AppText>
            <AppText style={styles.body}>
              {t("admin.reportDetail.historyReason", { reason: action.reason })}
            </AppText>
            <AppText style={styles.meta} variant="caption">
              {t("admin.reportDetail.historyBy", {
                date: formatDateTime(action.createdAt),
                username: action.adminUsername
              })}
            </AppText>
          </View>
        ))
      )}
    </View>
  );
}

function historyLabel(action: AdminReportHistoryEntry, t: (key: string) => string) {
  if (action.actionType === "CHANGE_REPORT_STATUS" && action.toStatus) {
    return t(`admin.reportDetail.history.statusChangedTo.${action.toStatus}`);
  }

  return t(`admin.reportDetail.history.${action.actionType}`);
}

const styles = StyleSheet.create({
  body: {
    color: colors.neutrals[100]
  },
  card: {
    backgroundColor: colors.neutrals[800],
    borderRadius: radius.lg,
    gap: spacing[1],
    padding: spacing[3]
  },
  cardHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing[2],
    justifyContent: "space-between"
  },
  empty: {
    color: colors.neutrals[300],
    fontStyle: "italic"
  },
  meta: {
    color: colors.neutrals[300]
  },
  section: {
    gap: spacing[2]
  },
  title: {
    color: colors.neutrals[100]
  },
  username: {
    color: colors.neutrals[100],
    flexShrink: 1,
    fontFamily: fontFamily.primary.semiBold
  }
});

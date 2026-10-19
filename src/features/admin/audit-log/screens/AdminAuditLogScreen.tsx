import { useMemo, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { AppText, Loading } from "@/components/ui";
import { colors, radius, spacing } from "@/theme";

import { AdminScreenLayout } from "../../components/AdminScreenLayout";
import { AdminRetryBlock } from "../../components/AdminRetryBlock";
import { FilterChips, type FilterChipOption } from "../../components/FilterChips";
import { formatReportDate, formatReportTime } from "../../reports/formatReportDate";
import type { AdminAuditEntry } from "../../types";
import { auditLogPeriodRange, type AuditLogPeriod } from "../auditLogPeriod";
import { useAdminList, useAuditLog, type AuditLogFilters } from "../hooks/useAuditLog";

const ALL_ADMINS = "all";
const REPORT_STATUSES = new Set(["OPEN", "RESOLVED", "DISMISSED"]);

const periodOptions: readonly FilterChipOption<AuditLogPeriod>[] = [
  { label: "admin.auditLog.filters.all", value: "all" },
  { label: "admin.auditLog.filters.today", value: "today" },
  { label: "admin.auditLog.filters.lastMonth", value: "lastMonth" }
];

type Translate = (key: string, options?: Record<string, unknown>) => string;

function AuditEntryRow({ item }: Readonly<{ item: AdminAuditEntry }>) {
  const { i18n, t } = useTranslation();
  const statusChange = statusChangeLabel(item, t);
  const date = formatReportDate(item.created_at, i18n.language);

  return (
    <View style={styles.row} testID={`admin-audit-log-entry-${item.action_id}`}>
      <AppText style={styles.action} variant="body2">
        <AppText style={styles.admin} variant="body2">
          {item.admin.username}
        </AppText>{" "}
        {t(`admin.auditLog.actions.${item.action_type}`, { defaultValue: item.action_type })}{" "}
        <AppText style={styles.target} variant="body2">
          {item.target_label}
        </AppText>
        {statusChange ? ` ${statusChange}` : null}
      </AppText>
      <AppText style={styles.reason} variant="caption">
        {t("admin.auditLog.reason", { reason: item.reason })}
      </AppText>
      {date ? (
        <AppText style={styles.meta} variant="caption">
          {t("admin.auditLog.dateTime", {
            date,
            time: formatReportTime(item.created_at, i18n.language)
          })}
        </AppText>
      ) : null}
    </View>
  );
}

function statusChangeLabel(item: AdminAuditEntry, t: Translate) {
  if (item.action_type !== "CHANGE_REPORT_STATUS") {
    return null;
  }

  const from = reportStatusKey(item.details?.from);
  const to = reportStatusKey(item.details?.to);

  if (!from || !to) {
    return null;
  }

  return t("admin.auditLog.statusChange", {
    from: t(`admin.status.${from}`),
    to: t(`admin.status.${to}`)
  });
}

function reportStatusKey(value: unknown) {
  return typeof value === "string" && REPORT_STATUSES.has(value) ? value.toLowerCase() : null;
}

function EntrySeparator() {
  return <View style={styles.separator} />;
}

export function AdminAuditLogScreen() {
  const { t } = useTranslation();
  const [period, setPeriod] = useState<AuditLogPeriod>("all");
  const [adminId, setAdminId] = useState(ALL_ADMINS);
  const admins = useAdminList();

  const filters = useMemo<AuditLogFilters>(
    () => ({
      ...auditLogPeriodRange(period),
      ...(adminId === ALL_ADMINS ? {} : { adminId })
    }),
    [adminId, period]
  );

  const auditLog = useAuditLog(filters);

  const adminOptions = useMemo<FilterChipOption<string>[]>(
    () => [
      { label: t("admin.auditLog.filters.allAdmins"), value: ALL_ADMINS },
      ...(admins.data ?? []).map((admin) => ({ label: admin.username, value: admin.user_id }))
    ],
    [admins.data, t]
  );

  const handleEndReached = () => {
    if (
      auditLog.hasNextPage &&
      !auditLog.isFetching &&
      !auditLog.isFetchingNextPage &&
      !auditLog.isFetchNextPageError
    ) {
      void auditLog.fetchNextPage();
    }
  };

  const renderFooter = () => {
    if (auditLog.isFetchingNextPage) {
      return <Loading label={t("admin.auditLog.loading")} />;
    }
    if (auditLog.isFetchNextPageError) {
      return (
        <AdminRetryBlock
          message={t("admin.auditLog.loadMoreError")}
          onRetry={() => void auditLog.fetchNextPage()}
          retryLabel={t("admin.auditLog.retry")}
        />
      );
    }
    return null;
  };

  return (
    <AdminScreenLayout
      activeTab="auditLog"
      title={t("admin.auditLog.title")}
      testID="admin-audit-log-screen"
    >
      <View style={styles.filters}>
        <FilterChips
          onChange={setPeriod}
          options={periodOptions.map((option) => ({ ...option, label: t(option.label) }))}
          value={period}
        />
        {admins.data?.length ? (
          <FilterChips onChange={setAdminId} options={adminOptions} value={adminId} />
        ) : null}
      </View>

      <View style={styles.listHeader}>
        {auditLog.data ? (
          <AppText style={styles.count} variant="caption" testID="admin-audit-log-count">
            {t("admin.auditLog.count", { count: auditLog.total })}
          </AppText>
        ) : null}
      </View>

      {auditLog.isPending ? <Loading label={t("admin.auditLog.loading")} /> : null}

      {(auditLog.isError && !auditLog.data) || auditLog.isRefetchError ? (
        <AdminRetryBlock
          message={t("admin.auditLog.loadError")}
          onRetry={() => void auditLog.refetch()}
          retryLabel={t("admin.auditLog.retry")}
        />
      ) : null}

      {auditLog.data ? (
        <FlatList
          contentContainerStyle={auditLog.items.length === 0 ? styles.emptyList : styles.list}
          data={auditLog.items}
          ItemSeparatorComponent={EntrySeparator}
          keyExtractor={(item) => item.action_id}
          ListEmptyComponent={
            <AppText style={styles.empty} testID="admin-audit-log-empty">
              {t("admin.auditLog.empty")}
            </AppText>
          }
          ListFooterComponent={renderFooter()}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.4}
          refreshControl={
            <RefreshControl
              colors={[colors.primary[500]]}
              onRefresh={() => void auditLog.refetch()}
              refreshing={auditLog.isRefetching && !auditLog.isFetchingNextPage}
              tintColor={colors.primary[500]}
            />
          }
          renderItem={({ item }) => <AuditEntryRow item={item} />}
          showsVerticalScrollIndicator={false}
          testID="admin-audit-log-list"
        />
      ) : null}
    </AdminScreenLayout>
  );
}

const styles = StyleSheet.create({
  action: {
    color: colors.neutrals[100]
  },
  admin: {
    color: colors.primary[500]
  },
  count: {
    color: colors.primary[500]
  },
  empty: {
    color: colors.neutrals[300],
    textAlign: "center"
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: "center",
    padding: spacing[4]
  },
  filters: {
    gap: spacing[3],
    paddingHorizontal: spacing[4]
  },
  list: {
    padding: spacing[4],
    paddingTop: spacing[1]
  },
  listHeader: {
    alignItems: "flex-end",
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3]
  },
  meta: {
    color: colors.neutrals[400]
  },
  reason: {
    color: colors.neutrals[300]
  },
  row: {
    backgroundColor: colors.neutrals[800],
    borderRadius: radius.lg,
    gap: spacing[1],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3]
  },
  separator: {
    height: spacing[3]
  },
  target: {
    color: colors.error[300]
  }
});

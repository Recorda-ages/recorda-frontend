import React, { useMemo, useState } from "react";
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  TextInput,
  View
} from "react-native";
import { useTranslation } from "react-i18next";
import { Icon } from "react-native-paper";

import { AppText, Button, ErrorState, Loading } from "@/components/ui";
import { colors, fontFamily, radius, spacing } from "@/theme";

import { AdminScreenLayout } from "../../components/AdminScreenLayout";
import { FilterChips, type FilterChipOption } from "../../components/FilterChips";
import type { AdminAuditEntry } from "../../types";
import { useAuditLog, type AuditLogFilters } from "../hooks/useAuditLog";

type PeriodFilter = "all" | "today" | "lastMonth";

const periodOptions: readonly FilterChipOption<PeriodFilter>[] = [
  { label: "admin.auditLog.filters.all", value: "all" },
  { label: "admin.auditLog.filters.today", value: "today" },
  { label: "admin.auditLog.filters.lastMonth", value: "lastMonth" }
];

function toDateString(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function todayRange(): { dateFrom: string; dateTo: string } {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const to = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return {
    dateFrom: toDateString(from),
    dateTo: toDateString(to)
  };
}

function lastMonthRange(): { dateFrom: string; dateTo: string } {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
  return {
    dateFrom: toDateString(from),
    dateTo: toDateString(now)
  };
}

function periodToFilter(period: PeriodFilter): Pick<AuditLogFilters, "dateFrom" | "dateTo"> {
  if (period === "today") return todayRange();
  if (period === "lastMonth") return lastMonthRange();
  return {};
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const date = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
  const time = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  return `${date} • ${time}`;
}

type AuditEntryRowProps = {
  item: AdminAuditEntry;
};

function AuditEntryRow({ item }: AuditEntryRowProps) {
  const { t } = useTranslation();

  const actionLabel = buildActionLabel(item, t);

  return (
    <View style={rowStyles.row}>
      <AppText style={rowStyles.action} variant="body2">
        {actionLabel}
      </AppText>
      <AppText style={rowStyles.meta} variant="caption">
        {formatDateTime(item.created_at)}
      </AppText>
    </View>
  );
}

function buildActionLabel(
  item: AdminAuditEntry,
  t: (key: string, opts?: Record<string, unknown>) => string
): React.ReactNode {
  const adminName = item.admin.username;
  const targetLabel = item.target_label;

  if (item.action_type === "CHANGE_REPORT_STATUS" && item.details) {
    const from = item.details["from"] as string | undefined;
    const to = item.details["to"] as string | undefined;
    const fromLabel = from ? t(`admin.auditLog.statusLabel.${from}`, { defaultValue: from }) : null;
    const toLabel = to ? t(`admin.auditLog.statusLabel.${to}`, { defaultValue: to }) : null;

    return (
      <ActionText
        admin={adminName}
        action={t("admin.auditLog.actions.CHANGE_REPORT_STATUS")}
        target={targetLabel}
        detail={fromLabel && toLabel ? `${fromLabel} → ${toLabel}` : undefined}
      />
    );
  }

  return (
    <ActionText
      admin={adminName}
      action={t(`admin.auditLog.actions.${item.action_type}`, { defaultValue: item.action_type })}
      target={targetLabel}
    />
  );
}

type ActionTextProps = {
  admin: string;
  action: string;
  target: string;
  detail?: string;
};

function ActionText({ admin, action, target, detail }: ActionTextProps) {
  return (
    <AppText style={rowStyles.action} variant="body2">
      <AppText style={rowStyles.highlight} variant="body2">
        {admin}
      </AppText>
      {" "}
      {action}
      {" "}
      <AppText style={rowStyles.targetHighlight} variant="body2">
        {target}
      </AppText>
      {detail ? ` (${detail})` : ""}
    </AppText>
  );
}

const rowStyles = StyleSheet.create({
  row: {
    backgroundColor: colors.neutrals[800],
    borderRadius: radius.lg,
    gap: spacing[1],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3]
  },
  action: {
    color: colors.neutrals[100]
  },
  highlight: {
    color: colors.primary[500]
  },
  targetHighlight: {
    color: colors.error[300]
  },
  meta: {
    color: colors.neutrals[400]
  }
});

function EntrySeparator() {
  return <View style={screenStyles.separator} />;
}

export function AdminAuditLogScreen() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState<PeriodFilter>("all");

  const filters = useMemo<AuditLogFilters>(
    () => periodToFilter(period),
    [period]
  );

  const auditLog = useAuditLog(filters);

  const filteredItems = useMemo(() => {
    if (!search.trim()) return auditLog.items;
    const q = search.toLowerCase();
    return auditLog.items.filter(
      (item) =>
        item.admin.username.toLowerCase().includes(q) ||
        item.target_label.toLowerCase().includes(q) ||
        item.reason?.toLowerCase().includes(q)
    );
  }, [auditLog.items, search]);

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
        <View style={screenStyles.feedback}>
          <ErrorState message={t("admin.auditLog.loadMoreError")} />
          <Button
            label={t("admin.auditLog.retry")}
            onPress={() => void auditLog.fetchNextPage()}
            variant="secondary"
          />
        </View>
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
      <View style={screenStyles.search}>
        <TextInput
          accessibilityLabel={t("admin.auditLog.search")}
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={setSearch}
          placeholder={t("admin.auditLog.search")}
          placeholderTextColor={colors.neutrals[300]}
          returnKeyType="search"
          style={screenStyles.searchInput}
          testID="admin-audit-log-search"
          value={search}
        />
        <Icon color={colors.neutrals[300]} size={22} source="magnify" />
      </View>

      <View style={screenStyles.filters}>
        <FilterChips
          onChange={setPeriod}
          options={periodOptions.map((o) => ({ ...o, label: t(o.label) }))}
          value={period}
        />
      </View>

      <View style={screenStyles.listHeader}>
        {auditLog.data ? (
          <AppText style={screenStyles.count} variant="caption" testID="admin-audit-log-count">
            {t("admin.auditLog.count", { count: auditLog.total })}
          </AppText>
        ) : null}
      </View>

      {auditLog.isPending ? <Loading label={t("admin.auditLog.loading")} /> : null}

      {(auditLog.isError && !auditLog.data) || auditLog.isRefetchError ? (
        <View style={screenStyles.feedback}>
          <ErrorState message={t("admin.auditLog.loadError")} />
          <Button
            label={t("admin.auditLog.retry")}
            onPress={() => void auditLog.refetch()}
            variant="secondary"
          />
        </View>
      ) : null}

      {auditLog.data ? (
        <FlatList
          contentContainerStyle={
            filteredItems.length === 0 ? screenStyles.emptyList : screenStyles.list
          }
          data={filteredItems}
          ItemSeparatorComponent={EntrySeparator}
          keyboardShouldPersistTaps="handled"
          keyExtractor={(item) => item.action_id}
          ListEmptyComponent={
            <AppText style={screenStyles.empty} testID="admin-audit-log-empty">
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

const screenStyles = StyleSheet.create({
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
  feedback: {
    gap: spacing[3],
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
  search: {
    alignItems: "center",
    backgroundColor: colors.neutrals[800],
    borderRadius: radius.md,
    flexDirection: "row",
    marginBottom: spacing[3],
    marginHorizontal: spacing[4],
    minHeight: 52,
    paddingHorizontal: spacing[4]
  },
  searchInput: {
    color: colors.neutrals[100],
    flex: 1,
    fontFamily: fontFamily.primary.regular,
    fontSize: 13,
    minWidth: 0,
    paddingVertical: spacing[3]
  },
  separator: {
    height: spacing[3]
  }
});

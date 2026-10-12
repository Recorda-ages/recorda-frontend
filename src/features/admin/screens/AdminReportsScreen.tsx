import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useState } from "react";
import { FlatList, StyleSheet, TextInput, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Icon } from "react-native-paper";

import type { RootStackParamList } from "@/app/navigation/RootNavigator";
import { AppText, Button, ErrorState, Loading } from "@/components/ui";
import { colors, fontFamily, radius, spacing } from "@/theme";

import { AdminScreenLayout } from "../components/AdminScreenLayout";
import { AdminListRow } from "../components/AdminListRow";
import { FilterChips, type FilterChipOption } from "../components/FilterChips";
import { useAdminReports } from "../hooks/useAdminReports";
import type { AdminReportGroup, AdminReportStatus, AdminTargetType } from "../types";

type TargetFilter = AdminTargetType | "ALL";
type StatusFilter = AdminReportStatus | "ALL";
const targetOptions: readonly FilterChipOption<TargetFilter>[] = [
  { label: "admin.reports.filters.allTargets", value: "ALL" },
  { label: "admin.reports.filters.recordas", value: "RECORDA" },
  { label: "admin.reports.filters.profiles", value: "USER" }
];
const statusOptions: readonly FilterChipOption<StatusFilter>[] = [
  { label: "admin.reports.filters.allStatuses", value: "ALL" },
  { label: "admin.reports.filters.open", value: "OPEN" },
  { label: "admin.reports.filters.resolved", value: "RESOLVED" },
  { label: "admin.reports.filters.dismissed", value: "DISMISSED" }
];

export function AdminReportsScreen() {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [targetFilter, setTargetFilter] = useState<TargetFilter>("ALL");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const reports = useAdminReports({
    query: query.trim(),
    status: statusFilter === "ALL" ? undefined : statusFilter,
    targetType: targetFilter === "ALL" ? undefined : targetFilter
  });
  const { items } = reports;

  return (
    <AdminScreenLayout
      activeTab="reports"
      title={t("admin.reports.title")}
      testID="admin-reports-screen"
    >
      <View style={styles.search}>
        <TextInput
          accessibilityLabel={t("admin.reports.search")}
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={setQuery}
          placeholder={t("admin.reports.search")}
          placeholderTextColor={colors.neutrals[300]}
          returnKeyType="search"
          style={styles.searchInput}
          value={query}
        />
        <Icon color={colors.neutrals[300]} size={22} source="magnify" />
      </View>
      <View style={styles.filters}>
        <FilterChips
          columns={3}
          onChange={setTargetFilter}
          options={translateOptions(targetOptions, t)}
          value={targetFilter}
        />
        <FilterChips
          columns={2}
          onChange={setStatusFilter}
          options={translateOptions(statusOptions, t)}
          value={statusFilter}
        />
      </View>
      <AppText style={styles.count} variant="caption">
        {t("admin.reports.groupedCount", { count: items.length })}
      </AppText>
      {reports.isPending ? <Loading label={t("admin.reports.loading")} /> : null}
      {reports.isError ? (
        <View style={styles.feedback}>
          <ErrorState message={t("admin.reports.loadError")} />
          <Button
            label={t("admin.reports.retry")}
            onPress={() =>
              void (reports.isFetchNextPageError ? reports.fetchNextPage() : reports.refetch())
            }
            variant="secondary"
          />
        </View>
      ) : null}
      {!reports.isPending && (items.length > 0 || reports.isSuccess) ? (
        <FlatList
          contentContainerStyle={items.length === 0 ? styles.emptyList : styles.list}
          data={items}
          ItemSeparatorComponent={ReportSeparator}
          keyboardShouldPersistTaps="handled"
          keyExtractor={(item) => `${item.targetType}:${item.targetId}:${item.status}`}
          ListEmptyComponent={<AppText style={styles.empty}>{t("admin.reports.empty")}</AppText>}
          onEndReached={() => {
            if (reports.hasNextPage && !reports.isFetching && !reports.isFetchNextPageError)
              void reports.fetchNextPage();
          }}
          ListFooterComponent={
            reports.isFetchingNextPage ? <Loading label={t("admin.reports.loading")} /> : null
          }
          renderItem={({ item }) => <ReportRow item={item} />}
          showsVerticalScrollIndicator={false}
          testID="admin-reports-list"
        />
      ) : null}
    </AdminScreenLayout>
  );
}

function ReportRow({ item }: Readonly<{ item: AdminReportGroup }>) {
  const { i18n, t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const date = formatDate(item.latestReportedAt, i18n.language);
  return (
    <AdminListRow
      accessibilityLabel={t("admin.reports.openTarget", {
        username: item.targetUsername || item.targetLabel
      })}
      metadata={t("admin.reports.rowMetadata", {
        count: item.openReportCount,
        target: t(`admin.reports.target.${item.targetType.toLowerCase()}`)
      })}
      onPress={() =>
        navigation.navigate("AdminReportDetail", {
          targetId: item.targetId,
          targetType: item.targetType
        })
      }
      status={item.status}
      subtitle={
        item.latestReporterUsername
          ? t("admin.reports.latestReport", { date, username: item.latestReporterUsername })
          : date
      }
      title={
        item.targetUsername
          ? `@${item.targetUsername} — ${item.contentSummary}`
          : item.contentSummary
      }
    />
  );
}

function translateOptions<TValue extends string>(
  options: readonly FilterChipOption<TValue>[],
  translate: (key: string) => string
): FilterChipOption<TValue>[] {
  return options.map((option) => ({ ...option, label: translate(option.label) }));
}

function formatDate(date: string, language: string) {
  const value = new Date(date);
  if (Number.isNaN(value.getTime())) return "";
  return new Intl.DateTimeFormat(language, {
    day: "2-digit",
    month: "2-digit",
    timeZone: "UTC",
    year: "numeric"
  }).format(value);
}
function ReportSeparator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  count: {
    color: colors.primary[500],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    textAlign: "right"
  },
  empty: { color: colors.neutrals[300], textAlign: "center" },
  emptyList: { flexGrow: 1, justifyContent: "center", padding: spacing[4] },
  feedback: { gap: spacing[3], padding: spacing[4] },
  filters: { gap: spacing[3], paddingHorizontal: spacing[4] },
  list: { padding: spacing[4], paddingTop: spacing[2] },
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
  separator: { height: spacing[3] }
});

import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Icon } from "react-native-paper";

import type { RootStackParamList } from "@/app/navigation/RootNavigator";
import { AppText, Button, ErrorState, Loading } from "@/components/ui";
import { colors, spacing } from "@/theme";

import { AdminScreenLayout } from "../../components/AdminScreenLayout";
import { AdminSearchInput } from "../../components/AdminSearchInput";
import { FilterChips, type FilterChipOption } from "../../components/FilterChips";
import type {
  AdminReportFilters,
  AdminReportGroup,
  AdminReportOrder,
  AdminReportStatus,
  AdminTargetType
} from "../../types";
import { AdminReportRow } from "../components/AdminReportRow";
import { reportGroupKey, useAdminReportGroups } from "../hooks/useAdminReportGroups";

export const ADMIN_REPORTS_SEARCH_DEBOUNCE_MS = 300;

type TargetFilter = AdminTargetType | "ALL";

const targetOptions: readonly FilterChipOption<TargetFilter>[] = [
  { label: "admin.reports.filters.allTargets", value: "ALL" },
  { label: "admin.reports.filters.recordas", value: "RECORDA" },
  { label: "admin.reports.filters.profiles", value: "USER" }
];

const statusOptions: readonly FilterChipOption<AdminReportStatus>[] = [
  { label: "admin.reports.filters.open", value: "OPEN" },
  { label: "admin.reports.filters.resolved", value: "RESOLVED" },
  { label: "admin.reports.filters.dismissed", value: "DISMISSED" }
];

const emptyMessageKeys: Record<AdminReportStatus, string> = {
  DISMISSED: "admin.reports.empty.dismissed",
  OPEN: "admin.reports.empty.open",
  RESOLVED: "admin.reports.empty.resolved"
};

export function AdminReportsScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [targetFilter, setTargetFilter] = useState<TargetFilter>("ALL");
  const [status, setStatus] = useState<AdminReportStatus>("OPEN");
  const [order, setOrder] = useState<AdminReportOrder>("desc");

  useEffect(() => {
    const nextSearch = search.trim();

    if (nextSearch === debouncedSearch) {
      return undefined;
    }

    const timer = setTimeout(
      () => setDebouncedSearch(nextSearch),
      ADMIN_REPORTS_SEARCH_DEBOUNCE_MS
    );
    return () => clearTimeout(timer);
  }, [debouncedSearch, search]);

  const filters = useMemo<AdminReportFilters>(
    () => ({
      order,
      query: debouncedSearch || undefined,
      status,
      targetType: targetFilter === "ALL" ? undefined : targetFilter
    }),
    [debouncedSearch, order, status, targetFilter]
  );
  const reports = useAdminReportGroups(filters);
  const { canSearch, items, total } = reports;

  const openReport = (item: AdminReportGroup) => {
    navigation.navigate("AdminReportDetail", {
      targetId: item.targetId,
      targetType: item.targetType
    });
  };

  const handleEndReached = () => {
    if (
      reports.hasNextPage &&
      !reports.isFetching &&
      !reports.isFetchingNextPage &&
      !reports.isFetchNextPageError
    ) {
      void reports.fetchNextPage();
    }
  };

  const renderFooter = () => {
    if (reports.isFetchingNextPage) {
      return <Loading label={t("admin.reports.loading")} />;
    }

    if (reports.isFetchNextPageError) {
      return (
        <View style={styles.feedback}>
          <ErrorState message={t("admin.reports.loadMoreError")} />
          <Button
            label={t("admin.reports.retry")}
            onPress={() => void reports.fetchNextPage()}
            variant="secondary"
          />
        </View>
      );
    }

    return null;
  };

  return (
    <AdminScreenLayout
      activeTab="reports"
      title={t("admin.reports.title")}
      testID="admin-reports-screen"
    >
      {canSearch ? (
        <AdminSearchInput
          accessibilityLabel={t("admin.reports.search")}
          onChangeText={setSearch}
          placeholder={t("admin.reports.search")}
          testID="admin-reports-search"
          value={search}
        />
      ) : null}

      <View style={styles.filters}>
        <FilterChips
          onChange={setTargetFilter}
          options={translateOptions(targetOptions, t)}
          value={targetFilter}
        />
        <FilterChips
          onChange={setStatus}
          options={translateOptions(statusOptions, t)}
          value={status}
        />
      </View>

      <View style={styles.listHeader}>
        <Pressable
          accessibilityLabel={t("admin.reports.order.accessibilityLabel", {
            order: t(`admin.reports.order.${order}`)
          })}
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => setOrder((current) => (current === "desc" ? "asc" : "desc"))}
          style={styles.orderToggle}
          testID="admin-reports-order"
        >
          <Icon color={colors.neutrals[300]} size={18} source="swap-vertical" />
          <AppText style={styles.orderLabel} variant="caption">
            {t(`admin.reports.order.${order}`)}
          </AppText>
        </Pressable>
        {reports.data ? (
          <AppText style={styles.count} testID="admin-reports-count" variant="caption">
            {t("admin.reports.groupedCount", { count: total })}
          </AppText>
        ) : null}
      </View>

      {reports.isPending ? <Loading label={t("admin.reports.loading")} /> : null}

      {(reports.isError && !reports.data) || reports.isRefetchError ? (
        <View style={styles.feedback}>
          <ErrorState message={t("admin.reports.loadError")} />
          <Button
            label={t("admin.reports.retry")}
            onPress={() => void reports.refetch()}
            variant="secondary"
          />
        </View>
      ) : null}

      {reports.data ? (
        <FlatList
          contentContainerStyle={items.length === 0 ? styles.emptyList : styles.list}
          data={items}
          ItemSeparatorComponent={ReportSeparator}
          keyboardShouldPersistTaps="handled"
          keyExtractor={reportGroupKey}
          ListEmptyComponent={
            <AppText style={styles.empty} testID="admin-reports-empty">
              {t(filters.query ? "admin.reports.empty.search" : emptyMessageKeys[status])}
            </AppText>
          }
          ListFooterComponent={renderFooter()}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.4}
          refreshControl={
            <RefreshControl
              colors={[colors.primary[500]]}
              onRefresh={() => void reports.refetch()}
              refreshing={reports.isRefetching && !reports.isFetchingNextPage}
              tintColor={colors.primary[500]}
            />
          }
          renderItem={({ item }) => <AdminReportRow item={item} onPress={openReport} />}
          showsVerticalScrollIndicator={false}
          testID="admin-reports-list"
        />
      ) : null}
    </AdminScreenLayout>
  );
}

function translateOptions<TValue extends string>(
  options: readonly FilterChipOption<TValue>[],
  translate: (key: string) => string
): FilterChipOption<TValue>[] {
  return options.map((option) => ({ ...option, label: translate(option.label) }));
}

function ReportSeparator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
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
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3]
  },
  orderLabel: {
    color: colors.neutrals[300]
  },
  orderToggle: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing[1]
  },
  separator: {
    height: spacing[3]
  }
});

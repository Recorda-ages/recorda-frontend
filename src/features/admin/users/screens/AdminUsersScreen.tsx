import { useEffect, useMemo, useState, type ReactNode } from "react";
import { FlatList, RefreshControl, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { AppText, Loading } from "@/components/ui";
import { colors, spacing } from "@/theme";

import { AdminRetryBlock } from "../../components/AdminRetryBlock";
import { AdminSearchInput } from "../../components/AdminSearchInput";
import { FilterChips, type FilterChipOption } from "../../components/FilterChips";
import type { AdminUserRow, AdminUserStatus } from "../../types";
import { useAdminUsers } from "../hooks/useAdminUsers";
import { AdminUserCard } from "../components/AdminUserCard";

export const ADMIN_USERS_SEARCH_DEBOUNCE_MS = 350;

type StatusFilter = AdminUserStatus | "ALL";
type AdminUsersScreenProps = {
  onViewHistory: (userId: string) => void;
  renderModerationActions?: (user: AdminUserRow) => ReactNode;
};

const statusOptions: readonly FilterChipOption<StatusFilter>[] = [
  { label: "admin.users.filters.all", value: "ALL" },
  { label: "admin.users.filters.active", value: "ACTIVE" },
  { label: "admin.users.filters.suspended", value: "SUSPENDED" }
];

export function AdminUsersScreen({
  onViewHistory,
  renderModerationActions
}: Readonly<AdminUsersScreenProps>) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("ALL");

  useEffect(() => {
    const nextSearch = search.trim();
    if (nextSearch === debouncedSearch) return undefined;

    const timer = setTimeout(() => setDebouncedSearch(nextSearch), ADMIN_USERS_SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [debouncedSearch, search]);

  const users = useAdminUsers(debouncedSearch, status === "ALL" ? undefined : status);
  const items = useMemo(() => users.data?.pages.flatMap((page) => page.items) ?? [], [users.data]);
  const total = users.data?.pages[0]?.total ?? 0;

  const loadNextPage = () => {
    if (users.hasNextPage && !users.isFetching && !users.isFetchNextPageError) {
      void users.fetchNextPage();
    }
  };

  const renderFooter = () => {
    if (users.isFetchingNextPage) return <Loading label={t("admin.users.loadingMore")} />;
    if (users.isFetchNextPageError) {
      return (
        <AdminRetryBlock
          message={t("admin.users.loadMoreError")}
          onRetry={() => void users.fetchNextPage()}
          retryLabel={t("admin.users.retry")}
        />
      );
    }
    return null;
  };

  return (
    <View style={styles.screen} testID="admin-users-screen">
      <AdminSearchInput
        accessibilityLabel={t("admin.users.search")}
        onChangeText={setSearch}
        placeholder={t("admin.users.search")}
        testID="admin-users-search"
        value={search}
      />
      <View style={styles.filters}>
        <FilterChips
          onChange={setStatus}
          options={statusOptions.map((option) => ({ ...option, label: t(option.label) }))}
          value={status}
        />
      </View>
      <View style={styles.listHeader}>
        <View />
        {users.data ? (
          <AppText style={styles.count} testID="admin-users-count" variant="caption">
            {t("admin.users.count", { count: total })}
          </AppText>
        ) : null}
      </View>

      {users.isPending ? <Loading label={t("admin.users.loading")} /> : null}

      {users.isError && !users.data ? (
        <AdminRetryBlock
          message={t("admin.users.loadError")}
          onRetry={() => void users.refetch()}
          retryLabel={t("admin.users.retry")}
        />
      ) : null}

      {users.data ? (
        <FlatList
          contentContainerStyle={items.length === 0 ? styles.emptyList : styles.list}
          data={items}
          ItemSeparatorComponent={UserSeparator}
          keyboardShouldPersistTaps="handled"
          keyExtractor={(user) => user.user_id}
          ListEmptyComponent={
            <AppText style={styles.empty} testID="admin-users-empty">
              {t(debouncedSearch ? "admin.users.empty.search" : "admin.users.empty.list")}
            </AppText>
          }
          ListFooterComponent={renderFooter()}
          onEndReached={loadNextPage}
          onEndReachedThreshold={0.4}
          refreshControl={
            <RefreshControl
              colors={[colors.primary[500]]}
              onRefresh={() => void users.refetch()}
              refreshing={users.isRefetching && !users.isFetchingNextPage}
              tintColor={colors.primary[500]}
            />
          }
          renderItem={({ item }) => (
            <AdminUserCard
              onViewHistory={onViewHistory}
              renderModerationActions={renderModerationActions}
              user={item}
            />
          )}
          showsVerticalScrollIndicator={false}
          testID="admin-users-list"
        />
      ) : null}
    </View>
  );
}

function UserSeparator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  count: { color: colors.primary[500] },
  empty: { color: colors.neutrals[300], textAlign: "center" },
  emptyList: { flexGrow: 1, justifyContent: "center", padding: spacing[4] },
  filters: { paddingHorizontal: spacing[4] },
  list: { paddingBottom: spacing[4], paddingHorizontal: spacing[4] },
  listHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 42,
    paddingHorizontal: spacing[4]
  },
  screen: { flex: 1 },
  separator: { height: spacing[3] }
});

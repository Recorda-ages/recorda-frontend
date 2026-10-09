import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, TextInput, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Icon } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

import type { RootStackParamList } from "@/app/navigation/RootNavigator";
import { queryClient } from "@/app/providers/queryClient";
import { AppText, Button, ErrorState, Loading } from "@/components/ui";
import { AUTH_ME_QUERY_KEY } from "@/features/auth/api/getCurrentUser";
import type { UserBasicResponse } from "@/features/auth/api/types";
import { clearSession } from "@/features/auth/session";
import { colors, fontFamily, radius, spacing } from "@/theme";

import { AdminBottomNavigation, type AdminBottomTab } from "../components/AdminBottomNavigation";
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

const dateFormatters = new Map<string, Intl.DateTimeFormat>();

export function AdminHomeScreen() {
  const { i18n, t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [query, setQuery] = useState("");
  const [targetFilter, setTargetFilter] = useState<TargetFilter>("ALL");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [signingOut, setSigningOut] = useState(false);
  const currentUser = queryClient.getQueryData<UserBasicResponse>(AUTH_ME_QUERY_KEY);
  const reports = useAdminReports({
    query: query.trim(),
    status: statusFilter === "ALL" ? undefined : statusFilter,
    targetType: targetFilter === "ALL" ? undefined : targetFilter
  });
  const items = reports.data?.items ?? [];

  const handleSignOut = async () => {
    if (signingOut) {
      return;
    }

    setSigningOut(true);
    await clearSession();
    navigation.reset({ index: 0, routes: [{ name: "Login" }] });
  };

  const handleBottomNavigation = (tab: AdminBottomTab) => {
    if (tab === "users") {
      navigation.navigate("AdminUsers");
    }
  };

  const openReport = (item: AdminReportGroup) => {
    navigation.navigate("AdminReportDetail", {
      targetId: item.targetId,
      targetType: item.targetType
    });
  };

  return (
    <View style={styles.screen} testID="admin-home-screen">
      <StatusBar style="light" />
      <SafeAreaView edges={["top"]} style={styles.safeArea}>
        <View style={styles.header}>
          <View style={styles.headerSpacer} />
          <View style={styles.headerCopy}>
            <AppText style={styles.title} variant="headline4">
              {t("admin.reports.title")}
            </AppText>
            {currentUser?.username ? (
              <AppText style={styles.username} variant="caption">
                @{currentUser.username}
              </AppText>
            ) : null}
          </View>
          <Pressable
            accessibilityLabel={t("admin.signOut")}
            accessibilityRole="button"
            accessibilityState={{ busy: signingOut, disabled: signingOut }}
            disabled={signingOut}
            hitSlop={8}
            onPress={() => void handleSignOut()}
            style={styles.headerAction}
          >
            {signingOut ? (
              <ActivityIndicator color={colors.neutrals[100]} size="small" />
            ) : (
              <Icon color={colors.neutrals[100]} size={26} source="logout" />
            )}
          </Pressable>
        </View>

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
              onPress={() => void reports.refetch()}
              variant="secondary"
            />
          </View>
        ) : null}

        {reports.isSuccess ? (
          <FlatList
            contentContainerStyle={items.length === 0 ? styles.emptyList : styles.list}
            data={items}
            ItemSeparatorComponent={ReportSeparator}
            keyboardShouldPersistTaps="handled"
            keyExtractor={(item) => `${item.targetType}:${item.targetId}`}
            ListEmptyComponent={<AppText style={styles.empty}>{t("admin.reports.empty")}</AppText>}
            renderItem={({ item }) => (
              <AdminListRow
                accessibilityLabel={t("admin.reports.openTarget", {
                  username: item.targetUsername
                })}
                metadata={t("admin.reports.rowMetadata", {
                  count: item.openReportCount,
                  target: t(`admin.reports.target.${item.targetType.toLocaleLowerCase()}`)
                })}
                onPress={() => openReport(item)}
                status={item.status}
                subtitle={t("admin.reports.latestReport", {
                  date: formatDate(item.latestReportedAt, i18n.language),
                  username: item.latestReporterUsername
                })}
                title={`@${item.targetUsername} — ${item.contentSummary}`}
              />
            )}
            showsVerticalScrollIndicator={false}
            testID="admin-reports-list"
          />
        ) : null}
      </SafeAreaView>
      <AdminBottomNavigation activeTab="reports" onPress={handleBottomNavigation} />
    </View>
  );
}

function translateOptions<TValue extends string>(
  options: readonly FilterChipOption<TValue>[],
  translate: (key: string) => string
): FilterChipOption<TValue>[] {
  return options.map((option) => ({ ...option, label: translate(option.label) }));
}

function formatDate(date: string, language: string) {
  let formatter = dateFormatters.get(language);

  if (!formatter) {
    formatter = new Intl.DateTimeFormat(language, {
      day: "2-digit",
      month: "2-digit",
      timeZone: "UTC",
      year: "numeric"
    });
    dateFormatters.set(language, formatter);
  }

  return formatter.format(new Date(date));
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
  header: {
    alignItems: "center",
    flexDirection: "row",
    minHeight: 64,
    paddingHorizontal: spacing[4]
  },
  headerAction: {
    alignItems: "flex-end",
    justifyContent: "center",
    width: 48
  },
  headerCopy: {
    alignItems: "center",
    flex: 1
  },
  headerSpacer: {
    width: 48
  },
  list: {
    padding: spacing[4],
    paddingTop: spacing[2]
  },
  safeArea: {
    flex: 1
  },
  screen: {
    backgroundColor: colors.neutrals[900],
    flex: 1
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
  },
  title: {
    color: colors.neutrals[100],
    fontFamily: fontFamily.primary.semiBold
  },
  username: {
    color: colors.neutrals[300]
  }
});

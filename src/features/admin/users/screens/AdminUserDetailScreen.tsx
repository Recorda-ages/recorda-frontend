import { useState, type ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Image } from "expo-image";
import { Icon, Snackbar } from "react-native-paper";

import { AppText, Button, Loading } from "@/components/ui";
import { colors, fontFamily, radius, spacing } from "@/theme";

import { AdminRetryBlock } from "../../components/AdminRetryBlock";
import type { AdminUserRow } from "../../types";
import { formatReportDate } from "../../reports/formatReportDate";
import { useAdminUserDetail } from "../hooks/useAdminUserDetail";

type AdminUserDetailScreenProps = {
  onBack: () => void;
  onCopyUserId: (userId: string) => Promise<void> | void;
  renderModerationActions?: (user: AdminUserRow) => ReactNode;
  userId: string;
};

export function AdminUserDetailScreen({
  onBack,
  onCopyUserId,
  renderModerationActions,
  userId
}: Readonly<AdminUserDetailScreenProps>) {
  const { i18n, t } = useTranslation();
  const detail = useAdminUserDetail(userId);
  const [feedback, setFeedback] = useState<string | null>(null);
  const user = detail.data;

  const copyId = async () => {
    try {
      await onCopyUserId(userId);
      setFeedback(t("admin.userDetail.copySuccess"));
    } catch {
      setFeedback(t("admin.userDetail.copyError"));
    }
  };

  return (
    <View style={styles.screen} testID="admin-user-detail-screen">
      {detail.isPending ? <Loading label={t("admin.userDetail.loading")} /> : null}
      {detail.isError && !user ? (
        <AdminRetryBlock
          message={t("admin.userDetail.loadError")}
          onRetry={() => void detail.refetch()}
          retryLabel={t("admin.userDetail.retry")}
        />
      ) : null}
      {user ? (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          testID="admin-user-detail-content"
        >
          <View style={styles.identityCard}>
            {user.profile_picture_url ? (
              <Image
                contentFit="cover"
                source={{ uri: user.profile_picture_url }}
                style={styles.avatar}
              />
            ) : (
              <View style={styles.avatarFallback}>
                <Icon color={colors.neutrals[200]} size={32} source="account" />
              </View>
            )}
            <AppText style={styles.username} variant="headline4">
              @{user.username}
            </AppText>
            <AppText style={styles.name} variant="body1">
              {user.name}
            </AppText>
            <View style={styles.statusRow}>
              <AppText
                style={[
                  styles.status,
                  user.status === "SUSPENDED" ? styles.suspended : styles.active
                ]}
                variant="buttonSmall"
              >
                {t(`admin.users.status.${user.status.toLowerCase()}`)}
              </AppText>
              <AppText style={styles.dot}>•</AppText>
              <AppText style={styles.role} variant="caption">
                {t(`admin.userDetail.role.${user.role.toLowerCase()}`)}
              </AppText>
            </View>
          </View>

          <DetailSection title={t("admin.userDetail.accountTitle")}>
            <DetailRow label={t("admin.userDetail.email")} value={user.email} />
            <View style={styles.idRow}>
              <View style={styles.idCopy}>
                <AppText style={styles.label} variant="caption">
                  {t("admin.userDetail.userId")}
                </AppText>
                <AppText selectable style={styles.value} variant="body2">
                  {user.user_id}
                </AppText>
              </View>
              <Pressable
                accessibilityLabel={t("admin.userDetail.copyId")}
                accessibilityRole="button"
                hitSlop={8}
                onPress={() => void copyId()}
                style={styles.copyButton}
                testID="admin-user-copy-id"
              >
                <Icon color={colors.primary[500]} size={20} source="content-copy" />
                <AppText style={styles.copyLabel} variant="caption">
                  {t("admin.userDetail.copyId")}
                </AppText>
              </Pressable>
            </View>
            <DetailRow
              label={t("admin.userDetail.createdAt")}
              value={formatReportDate(user.created_at, i18n.language)}
            />
            {user.deleted_at ? (
              <DetailRow
                label={t("admin.userDetail.deletedAt")}
                value={formatReportDate(user.deleted_at, i18n.language)}
              />
            ) : null}
            <DetailRow
              label={t("admin.userDetail.privacy")}
              value={t(user.is_private ? "admin.userDetail.private" : "admin.userDetail.public")}
            />
            <DetailRow label={t("admin.userDetail.recordas")} value={String(user.recordas_count)} />
            <DetailRow
              label={t("admin.userDetail.reports")}
              value={t("admin.users.reportCount", { count: user.reports_count })}
            />
          </DetailSection>

          {renderModerationActions ? (
            <View style={styles.moderationActions}>{renderModerationActions(user)}</View>
          ) : null}

          <DetailSection
            title={t("admin.userDetail.reportsReceived", { count: user.reports_received.length })}
          >
            {user.reports_received.length === 0 ? (
              <AppText style={styles.muted}>{t("admin.userDetail.noReports")}</AppText>
            ) : (
              user.reports_received.map((report) => (
                <View key={`${report.target_type}:${report.target_id}`} style={styles.itemCard}>
                  {report.preview.image_url ? (
                    <Image
                      contentFit="cover"
                      source={{ uri: report.preview.image_url }}
                      style={styles.reportImage}
                    />
                  ) : null}
                  <View style={styles.reportBody}>
                    <View style={styles.itemHeading}>
                      <AppText style={styles.value} variant="body2">
                        {t(`admin.userDetail.targetType.${report.target_type.toLowerCase()}`)}
                      </AppText>
                      <AppText style={styles.itemStatus} variant="caption">
                        {t(`admin.status.${report.status.toLowerCase()}`)}
                      </AppText>
                    </View>
                    <AppText style={styles.value} variant="body1">
                      {report.preview.title}
                    </AppText>
                    {report.preview.subtitle ? (
                      <AppText style={styles.muted} variant="caption">
                        {report.preview.subtitle}
                      </AppText>
                    ) : null}
                    <AppText style={styles.muted} variant="caption">
                      {t("admin.userDetail.reportCount", { count: report.report_count })} •{" "}
                      {t("admin.userDetail.reportPeriod", {
                        from: formatReportDate(report.first_reported_at, i18n.language),
                        to: formatReportDate(report.last_reported_at, i18n.language)
                      })}
                    </AppText>
                  </View>
                </View>
              ))
            )}
          </DetailSection>

          <DetailSection title={t("admin.userDetail.historyTitle")}>
            {user.actions.length === 0 ? (
              <AppText style={styles.muted}>{t("admin.userDetail.historyEmpty")}</AppText>
            ) : (
              user.actions.map((action) => (
                <View key={action.action_id} style={styles.historyItem}>
                  <AppText style={styles.value} variant="body2">
                    {t(`admin.userDetail.actionTypes.${action.action_type}`, {
                      defaultValue: action.action_type
                    })}
                  </AppText>
                  <AppText style={styles.muted} variant="caption">
                    {t("admin.userDetail.historyBy", {
                      username: action.admin_username,
                      date: formatReportDate(action.created_at, i18n.language)
                    })}
                  </AppText>
                  <AppText style={styles.muted} variant="caption">
                    {t("admin.userDetail.reason", { reason: action.reason })}
                  </AppText>
                </View>
              ))
            )}
          </DetailSection>

          <Button label={t("admin.userDetail.back")} onPress={onBack} variant="secondary" />
        </ScrollView>
      ) : null}
      <Snackbar onDismiss={() => setFeedback(null)} visible={feedback !== null}>
        {feedback ?? ""}
      </Snackbar>
    </View>
  );
}

function DetailSection({ children, title }: { children: ReactNode; title: string }) {
  return (
    <View style={styles.section}>
      <AppText style={styles.sectionTitle} variant="headline4">
        {title}
      </AppText>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <AppText style={styles.label} variant="caption">
        {label}
      </AppText>
      <AppText style={styles.value} variant="body2">
        {value}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  active: { color: colors.primary[500] },
  avatar: { borderRadius: 32, height: 64, width: 64 },
  avatarFallback: {
    alignItems: "center",
    backgroundColor: colors.neutrals[700],
    borderRadius: 32,
    height: 64,
    justifyContent: "center",
    width: 64
  },
  content: { gap: spacing[4], padding: spacing[4], paddingBottom: spacing[8] },
  copyButton: {
    alignItems: "center",
    gap: spacing[1],
    justifyContent: "center",
    padding: spacing[2]
  },
  copyLabel: { color: colors.primary[500] },
  detailRow: { gap: spacing[1] },
  dot: { color: colors.neutrals[300] },
  historyItem: {
    borderLeftColor: colors.primary[500],
    borderLeftWidth: 2,
    gap: spacing[1],
    paddingLeft: spacing[3]
  },
  idCopy: { flex: 1, gap: spacing[1], minWidth: 0 },
  idRow: { alignItems: "center", flexDirection: "row", gap: spacing[2] },
  identityCard: {
    alignItems: "center",
    backgroundColor: colors.neutrals[800],
    borderRadius: radius.lg,
    gap: spacing[1],
    padding: spacing[4]
  },
  itemCard: {
    alignItems: "center",
    backgroundColor: colors.neutrals[900],
    borderRadius: radius.md,
    flexDirection: "row",
    gap: spacing[3],
    padding: spacing[3]
  },
  itemHeading: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  itemStatus: { color: colors.neutrals[300] },
  label: { color: colors.neutrals[300] },
  moderationActions: { alignItems: "flex-start" },
  muted: { color: colors.neutrals[300] },
  name: { color: colors.neutrals[200] },
  reportBody: { flex: 1, gap: spacing[1], minWidth: 0 },
  reportImage: { borderRadius: radius.sm, height: 52, width: 52 },
  role: { color: colors.neutrals[300] },
  screen: { flex: 1 },
  section: {
    backgroundColor: colors.neutrals[800],
    borderRadius: radius.lg,
    gap: spacing[3],
    padding: spacing[4]
  },
  sectionBody: { gap: spacing[3] },
  sectionTitle: { color: colors.neutrals[100], fontFamily: fontFamily.primary.semiBold },
  status: { letterSpacing: 0.4 },
  statusRow: { alignItems: "center", flexDirection: "row", gap: spacing[2], marginTop: spacing[1] },
  suspended: { color: colors.error[300] },
  username: { color: colors.neutrals[100] },
  value: { color: colors.neutrals[100] }
});

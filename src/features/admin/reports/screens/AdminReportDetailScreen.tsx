import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useState } from "react";
import { Alert, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Snackbar } from "react-native-paper";

import type { RootStackParamList } from "@/app/navigation/RootNavigator";
import { AppText, Button, ErrorState, Loading } from "@/components/ui";
import { ApiError } from "@/services/api";
import { colors, fontFamily, spacing } from "@/theme";

import { AdminScreenLayout } from "../../components/AdminScreenLayout";
import { ADMIN_REASON_MAX_LENGTH, ReasonDialog } from "../../components/ReasonDialog";
import { StatusBadge } from "../../components/StatusBadge";
import { useAdminApiErrorHandler } from "../../hooks/useAdminApiErrorHandler";
import type { AdminReportDetail, AdminReportStatus, AdminTargetType } from "../../types";
import { ReportEntries, ReportHistory } from "../components/AdminReportSections";
import { ReportedRecordaCard, ReportedUserCard } from "../components/AdminReportTargetCard";
import { ReportStatusActions } from "../components/ReportStatusActions";
import { useAdminReportDetail } from "../hooks/useAdminReportDetail";
import { isConflict, useUpdateAdminReportStatus } from "../hooks/useUpdateAdminReportStatus";
import { availableStatusChanges, currentReportStatus } from "../reportDetailStatus";

const FEEDBACK_DURATION_MS = 4000;

type AdminReportDetailScreenProps = {
  targetId: string;
  targetType: AdminTargetType;
};

export function AdminReportDetailScreen({
  targetId,
  targetType
}: Readonly<AdminReportDetailScreenProps>) {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const detail = useAdminReportDetail(targetType, targetId);
  const updateStatus = useUpdateAdminReportStatus(targetType, targetId);
  const handleAdminApiError = useAdminApiErrorHandler();
  const [pendingStatus, setPendingStatus] = useState<AdminReportStatus | null>(null);
  const [reason, setReason] = useState("");
  const [dialogError, setDialogError] = useState<string>();
  const [feedback, setFeedback] = useState<string | null>(null);

  const goBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    navigation.navigate("AdminReports");
  };

  const openDialog = (status: AdminReportStatus) => {
    setPendingStatus(status);
    setReason("");
    setDialogError(undefined);
  };

  const closeDialog = () => {
    if (!updateStatus.isPending) {
      setPendingStatus(null);
    }
  };

  const changeReason = (value: string) => {
    setReason(value);
    setDialogError(undefined);
  };

  const confirmStatusChange = async () => {
    if (!pendingStatus || updateStatus.isPending) {
      return;
    }

    const trimmedReason = reason.trim();
    if (!trimmedReason || trimmedReason.length > ADMIN_REASON_MAX_LENGTH) {
      setDialogError(t("admin.reportDetail.statusActions.invalidReason"));
      return;
    }

    const status = pendingStatus;

    try {
      await updateStatus.mutateAsync({ reason: trimmedReason, status });
      setPendingStatus(null);
      setReason("");
      setFeedback(t(`admin.reportDetail.statusActions.${status}.success`));
    } catch (error) {
      if (await handleAdminApiError(error)) {
        return;
      }

      if (isConflict(error)) {
        setPendingStatus(null);
        Alert.alert(
          t("admin.reportDetail.statusActions.conflictTitle"),
          t("admin.reportDetail.statusActions.conflictMessage")
        );
        return;
      }

      setDialogError(
        t(
          error instanceof ApiError && error.status === 422
            ? "admin.reportDetail.statusActions.invalidReason"
            : "admin.reportDetail.statusActions.error"
        )
      );
    }
  };

  return (
    <AdminScreenLayout
      activeTab="reports"
      back={{ label: t("admin.reportDetail.back"), onPress: goBack }}
      testID="admin-report-detail-screen"
      title={t("admin.reportDetail.title")}
    >
      {detail.isPending ? <Loading label={t("admin.reportDetail.loading")} /> : null}

      {detail.isError && !detail.data ? (
        <LoadFailure error={detail.error} onBack={goBack} onRetry={() => void detail.refetch()} />
      ) : null}

      {detail.data ? (
        <DetailContent
          detail={detail.data}
          onOpenUser={(userId) => navigation.navigate("AdminUserDetail", { userId })}
          onRefresh={() => void detail.refetch()}
          onSelectStatus={openDialog}
          refreshing={detail.isRefetching && !updateStatus.isPending}
          updating={updateStatus.isPending}
        />
      ) : null}

      <ReasonDialog
        confirmLabel={
          pendingStatus ? t(`admin.reportDetail.statusActions.${pendingStatus}.confirm`) : ""
        }
        error={dialogError}
        loading={updateStatus.isPending}
        onCancel={closeDialog}
        onChangeReason={changeReason}
        onConfirm={() => void confirmStatusChange()}
        reason={reason}
        title={pendingStatus ? t(`admin.reportDetail.statusActions.${pendingStatus}.title`) : ""}
        visible={pendingStatus !== null}
      />

      <Snackbar
        duration={FEEDBACK_DURATION_MS}
        onDismiss={() => setFeedback(null)}
        visible={feedback !== null}
      >
        {feedback ?? ""}
      </Snackbar>
    </AdminScreenLayout>
  );
}

type DetailContentProps = {
  detail: AdminReportDetail;
  onOpenUser: (userId: string) => void;
  onRefresh: () => void;
  onSelectStatus: (status: AdminReportStatus) => void;
  refreshing: boolean;
  updating: boolean;
};

function DetailContent({
  detail,
  onOpenUser,
  onRefresh,
  onSelectStatus,
  refreshing,
  updating
}: Readonly<DetailContentProps>) {
  const { i18n, t } = useTranslation();
  const status = currentReportStatus(detail.reports);
  const statusCount = detail.reports.filter((report) => report.status === status).length;
  const statuses = availableStatusChanges(detail.reports);
  const target = t(`admin.reports.target.${detail.target.type.toLocaleLowerCase()}`);

  return (
    <>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            colors={[colors.primary[500]]}
            onRefresh={onRefresh}
            refreshing={refreshing}
            tintColor={colors.primary[500]}
          />
        }
        showsVerticalScrollIndicator={false}
        testID="admin-report-detail-content"
      >
        <AppText style={styles.summary} testID="admin-report-detail-summary" variant="caption">
          <AppText style={styles.summaryTarget} variant="caption">
            {target.toLocaleUpperCase(i18n.language)}
          </AppText>
          {status ? (
            <>
              {" • "}
              <StatusBadge status={status} variant="text" />
              {" • "}
              <AppText style={styles.summaryCount} variant="caption">
                {t("admin.reports.count", { count: statusCount })}
              </AppText>
            </>
          ) : null}
        </AppText>

        {detail.target.type === "RECORDA" ? (
          <ReportedRecordaCard recorda={detail.target.recorda} />
        ) : (
          <ReportedUserCard onOpenUser={onOpenUser} user={detail.target.user} />
        )}

        <ReportEntries reports={detail.reports} />
        <ReportHistory actions={detail.actions} />
      </ScrollView>

      {statuses.length > 0 ? (
        <View style={styles.footer}>
          <ReportStatusActions disabled={updating} onSelect={onSelectStatus} statuses={statuses} />
        </View>
      ) : null}
    </>
  );
}

function LoadFailure({
  error,
  onBack,
  onRetry
}: Readonly<{ error: Error; onBack: () => void; onRetry: () => void }>) {
  const { t } = useTranslation();
  const notFound = error instanceof ApiError && error.status === 404;

  return (
    <View style={styles.feedback}>
      <ErrorState
        message={t(notFound ? "admin.reportDetail.notFound" : "admin.reportDetail.loadError")}
      />
      <Button
        label={t(notFound ? "admin.reportDetail.back" : "admin.reportDetail.retry")}
        onPress={notFound ? onBack : onRetry}
        variant="secondary"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing[5],
    padding: spacing[4],
    paddingTop: spacing[1]
  },
  feedback: {
    gap: spacing[3],
    padding: spacing[4]
  },
  footer: {
    backgroundColor: colors.neutrals[900],
    borderTopColor: colors.neutrals[800],
    borderTopWidth: 1,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3]
  },
  summary: {
    color: colors.neutrals[500]
  },
  summaryCount: {
    color: colors.error[200]
  },
  summaryTarget: {
    color: colors.neutrals[300],
    fontFamily: fontFamily.primary.semiBold
  }
});

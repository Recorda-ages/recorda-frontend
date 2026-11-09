import { type ReactNode, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { Icon } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppText, Button } from "@/components/ui";
import { colors, fontFamily, radius, spacing } from "@/theme";

import { useRetrospective } from "../hooks/useRetrospective";
import { useRetrospectivePeriods } from "../hooks/useRetrospectivePeriods";
import { RetrospectiveScreen } from "../screens/RetrospectiveScreen";
import { toRetrospectiveStory } from "../storyData";
import { formatRetrospectivePeriod, toRetrospectiveSummary } from "../summary";
import type { RetrospectivePeriod, RetrospectivePeriodSelection } from "../types";

type RetrospectiveFlowProps = Readonly<{
  onClose: () => void;
  visible: boolean;
}>;

function toSelection(period: RetrospectivePeriod): RetrospectivePeriodSelection {
  return { month: period.month, period_type: period.period_type, year: period.year };
}

export function RetrospectiveFlow({ onClose, visible }: RetrospectiveFlowProps) {
  const { i18n, t } = useTranslation();
  const periods = useRetrospectivePeriods();
  const [selection, setSelection] = useState<RetrospectivePeriodSelection | null>(null);
  const list = periods.data?.periods ?? [];
  const onlyPeriod = list.length === 1 ? toSelection(list[0]) : null;
  const active = selection ?? onlyPeriod;
  const details = useRetrospective(visible ? active : null);

  const close = () => {
    setSelection(null);
    onClose();
  };

  if (!visible) return null;

  if (details.data) {
    return (
      <RetrospectiveScreen
        onClose={close}
        story={toRetrospectiveStory(details.data)}
        summary={toRetrospectiveSummary(details.data, i18n.language)}
        title={t("retrospective.title")}
        visible
      />
    );
  }

  return (
    <RetrospectiveSheet onClose={close}>
      {periods.isLoading || (active !== null && details.isLoading) ? (
        <ActivityIndicator color={colors.primary[500]} testID="retrospective-flow-loading" />
      ) : periods.isError ? (
        <SheetMessage
          actionLabel={t("retrospectiveFlow.retry")}
          message={t("retrospectiveFlow.periodsError")}
          onAction={() => void periods.refetch()}
        />
      ) : list.length === 0 ? (
        <SheetMessage message={t("retrospectiveFlow.noPeriods")} />
      ) : details.isError ? (
        <SheetMessage
          actionLabel={t("retrospectiveFlow.retry")}
          message={t("retrospectiveFlow.detailsError")}
          onAction={() => void details.refetch()}
          secondaryLabel={list.length > 1 ? t("retrospectiveFlow.choose") : undefined}
          onSecondary={() => setSelection(null)}
        />
      ) : details.isEmpty ? (
        <SheetMessage
          message={t("retrospectiveFlow.emptyPeriod")}
          onAction={list.length > 1 ? () => setSelection(null) : undefined}
          actionLabel={list.length > 1 ? t("retrospectiveFlow.choose") : undefined}
        />
      ) : (
        <PeriodList language={i18n.language} onSelect={setSelection} periods={list} />
      )}
    </RetrospectiveSheet>
  );
}

function RetrospectiveSheet({
  children,
  onClose
}: Readonly<{ children: ReactNode; onClose: () => void }>) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <View style={StyleSheet.absoluteFill} testID="retrospective-flow">
      <Pressable
        accessibilityLabel={t("retrospective.close")}
        onPress={onClose}
        style={[StyleSheet.absoluteFill, styles.backdrop]}
        testID="retrospective-flow-backdrop"
      />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing[4] }]}>
        <View style={styles.header}>
          <AppText style={styles.title} variant="buttonLarge">
            {t("retrospectiveFlow.title")}
          </AppText>
          <Pressable
            accessibilityLabel={t("retrospective.close")}
            accessibilityRole="button"
            hitSlop={8}
            onPress={onClose}
            testID="retrospective-flow-close"
          >
            <Icon color={colors.neutrals[100]} size={22} source="close" />
          </Pressable>
        </View>
        {children}
      </View>
    </View>
  );
}

function PeriodList({
  language,
  onSelect,
  periods
}: Readonly<{
  language: string;
  onSelect: (selection: RetrospectivePeriodSelection) => void;
  periods: readonly RetrospectivePeriod[];
}>) {
  const { t } = useTranslation();

  return (
    <View style={styles.list}>
      {periods.map((period) => {
        const selection = toSelection(period);
        const label = formatRetrospectivePeriod(period, language);
        const kind = t(
          period.period_type === "YEARLY" ? "retrospectiveFlow.yearly" : "retrospectiveFlow.monthly"
        );

        return (
          <Pressable
            accessibilityRole="button"
            key={`${period.period_type}-${period.year}-${period.month ?? 0}`}
            onPress={() => onSelect(selection)}
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
            testID={`retrospective-period-${period.period_type}-${period.year}-${period.month ?? 0}`}
          >
            <View style={styles.rowCopy}>
              <AppText style={styles.rowTitle}>{label}</AppText>
              <AppText style={styles.rowSubtitle} variant="caption">
                {`${kind} · ${t("retrospective.recordasCount", { count: period.total_memories })}`}
              </AppText>
            </View>
            {period.is_preview ? (
              <View style={styles.badge}>
                <AppText style={styles.badgeLabel} variant="caption">
                  {t("retrospectiveFlow.preview")}
                </AppText>
              </View>
            ) : null}
            <Icon color={colors.neutrals[300]} size={22} source="chevron-right" />
          </Pressable>
        );
      })}
    </View>
  );
}

function SheetMessage({
  actionLabel,
  message,
  onAction,
  onSecondary,
  secondaryLabel
}: Readonly<{
  actionLabel?: string;
  message: string;
  onAction?: () => void;
  onSecondary?: () => void;
  secondaryLabel?: string;
}>) {
  return (
    <View style={styles.message} testID="retrospective-flow-message">
      <AppText style={styles.messageText}>{message}</AppText>
      {onAction && actionLabel ? (
        <Button label={actionLabel} onPress={onAction} variant="secondary" />
      ) : null}
      {onSecondary && secondaryLabel ? (
        <Button label={secondaryLabel} onPress={onSecondary} variant="secondary" />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: "rgba(0,0,0,0.6)"
  },
  badge: {
    backgroundColor: colors.primary[500],
    borderRadius: radius.full,
    paddingHorizontal: spacing[2],
    paddingVertical: 2
  },
  badgeLabel: {
    color: colors.neutrals[900],
    fontFamily: fontFamily.primary.semiBold
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  list: {
    gap: spacing[2]
  },
  message: {
    alignItems: "center",
    gap: spacing[3],
    paddingVertical: spacing[4]
  },
  messageText: {
    color: colors.neutrals[100],
    textAlign: "center"
  },
  row: {
    alignItems: "center",
    backgroundColor: colors.neutrals[700],
    borderRadius: radius.lg,
    flexDirection: "row",
    gap: spacing[2],
    minHeight: 56,
    paddingHorizontal: spacing[4]
  },
  rowCopy: {
    flex: 1
  },
  rowPressed: {
    opacity: 0.7
  },
  rowSubtitle: {
    color: colors.neutrals[300]
  },
  rowTitle: {
    color: colors.neutrals[100],
    fontFamily: fontFamily.primary.semiBold,
    textTransform: "capitalize"
  },
  sheet: {
    backgroundColor: colors.neutrals[800],
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    bottom: 0,
    gap: spacing[4],
    left: 0,
    padding: spacing[4],
    position: "absolute",
    right: 0
  },
  title: {
    color: colors.neutrals[100]
  }
});

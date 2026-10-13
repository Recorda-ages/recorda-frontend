import { Image } from "expo-image";
import { Pressable, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Icon } from "react-native-paper";

import { AppText } from "@/components/ui";
import { resolveApiAssetUrl, useAuthImageSource } from "@/services/api";
import { colors, fontFamily, radius, spacing } from "@/theme";

import { STATUS_TRANSLATION_KEYS, StatusBadge } from "../../components/StatusBadge";
import type { AdminReportGroup } from "../../types";

type AdminReportRowProps = Readonly<{
  item: AdminReportGroup;
  onPress: (item: AdminReportGroup) => void;
}>;

const dateFormatters = new Map<string, Intl.DateTimeFormat>();

export function AdminReportRow({ item, onPress }: AdminReportRowProps) {
  const { i18n, t } = useTranslation();
  const imageUrl = item.imageUrl ? resolveApiAssetUrl(item.imageUrl) : null;
  const imageSource = useAuthImageSource(imageUrl);
  const target = t(`admin.reports.target.${item.targetType.toLocaleLowerCase()}`);
  const status = t(STATUS_TRANSLATION_KEYS[item.status]);
  const count = t("admin.reports.count", { count: item.openReportCount });
  const title = item.targetUsername
    ? `@${item.targetUsername} — ${item.contentSummary}`
    : item.contentSummary;
  const date = formatReportDate(item.latestReportedAt, i18n.language);
  const footer = item.latestReporterUsername
    ? t("admin.reports.reportedBy", { date, username: item.latestReporterUsername })
    : date;

  return (
    <Pressable
      accessibilityHint={footer}
      accessibilityLabel={t("admin.reports.openTarget", { count, status, target, title })}
      accessibilityRole="button"
      onPress={() => onPress(item)}
      style={({ pressed }) => [styles.row, pressed ? styles.pressed : undefined]}
      testID={`admin-report-row-${item.targetType}-${item.targetId}`}
    >
      {imageSource ? (
        <Image
          contentFit="cover"
          source={imageSource}
          style={styles.thumbnail}
          testID={`admin-report-thumbnail-${item.targetId}`}
        />
      ) : (
        <View
          style={[styles.thumbnail, styles.thumbnailFallback]}
          testID={`admin-report-thumbnail-fallback-${item.targetId}`}
        >
          <Icon
            color={colors.neutrals[400]}
            size={22}
            source={item.targetType === "USER" ? "account" : "image-outline"}
          />
        </View>
      )}

      <View style={styles.copy}>
        <AppText numberOfLines={1} style={styles.metadata} variant="caption">
          <AppText style={styles.target} variant="caption">
            {target.toLocaleUpperCase(i18n.language)}
          </AppText>
          {" • "}
          <StatusBadge status={item.status} variant="text" />
          {" • "}
          <AppText style={styles.count} variant="caption">
            {count}
          </AppText>
        </AppText>
        <AppText numberOfLines={1} style={styles.title}>
          {title}
        </AppText>
        <AppText numberOfLines={1} style={styles.footer} variant="caption">
          {footer}
        </AppText>
      </View>

      <View style={styles.chevron}>
        <Icon color={colors.neutrals[300]} size={20} source="menu-right" />
      </View>
    </Pressable>
  );
}

export function formatReportDate(isoDate: string, language: string) {
  const date = new Date(isoDate);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  let formatter = dateFormatters.get(language);

  if (!formatter) {
    formatter = new Intl.DateTimeFormat(language, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
    dateFormatters.set(language, formatter);
  }

  return formatter.format(date);
}

const styles = StyleSheet.create({
  chevron: {
    alignSelf: "flex-start"
  },
  copy: {
    flex: 1,
    gap: spacing[1],
    minWidth: 0
  },
  count: {
    color: colors.error[200]
  },
  footer: {
    color: colors.neutrals[300]
  },
  metadata: {
    color: colors.neutrals[500]
  },
  pressed: {
    opacity: 0.82
  },
  row: {
    alignItems: "center",
    backgroundColor: colors.neutrals[800],
    borderRadius: radius.lg,
    flexDirection: "row",
    gap: spacing[3],
    padding: spacing[3]
  },
  target: {
    color: colors.neutrals[300]
  },
  thumbnail: {
    backgroundColor: colors.neutrals[700],
    borderRadius: radius.md,
    height: 48,
    width: 48
  },
  thumbnailFallback: {
    alignItems: "center",
    justifyContent: "center"
  },
  title: {
    color: colors.neutrals[100],
    fontFamily: fontFamily.primary.semiBold
  }
});

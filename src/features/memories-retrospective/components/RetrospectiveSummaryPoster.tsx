import { LinearGradient } from "expo-linear-gradient";
import { type ReactNode, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { Icon } from "react-native-paper";

import { AppText } from "@/components/ui";
import { baseColors, colors, fontFamily, withOpacity } from "@/theme";

/** Width the poster layout is designed at; every size scales from it. */
const BASE_WIDTH = 360;
export const POSTER_ASPECT_RATIO = 9 / 16;
const EMPTY_VALUE = "—";

/**
 * The six approved retrospective metrics, already reduced to what the poster shows:
 * total Recordas, #1 artist, top genre, most tagged friend, likes + comments and the
 * longest daily streak. The featured song and active days add context to them.
 */
export type RetrospectiveSummary = Readonly<{
  periodLabel: string;
  totalRecordas: number;
  activeDays: number | null;
  featuredSongTitle: string | null;
  topArtistName: string | null;
  topGenreName: string | null;
  topTaggedUsername: string | null;
  likesReceived: number;
  commentsReceived: number;
  maxStreak: number;
}>;

type RetrospectiveSummaryPosterProps = Readonly<{
  /** Rounded corners for the on-screen preview; the exported PNG stays square. */
  rounded?: boolean;
  summary: RetrospectiveSummary;
  testID?: string;
  width: number;
}>;

type PosterStyles = ReturnType<typeof createStyles>;

/** Celebration poster (9:16) that condenses the retrospective into one shareable image. */
export function RetrospectiveSummaryPoster({
  rounded = false,
  summary,
  testID,
  width
}: RetrospectiveSummaryPosterProps) {
  const { i18n, t } = useTranslation();
  const scale = width / BASE_WIDTH;
  const styles = useMemo(() => createStyles(scale), [scale]);
  const iconSize = 16 * scale;
  const formatNumber = (value: number) => new Intl.NumberFormat(i18n.language).format(value);

  const highlights = [
    t("retrospectiveSummary.recordas", { count: summary.totalRecordas }),
    summary.activeDays === null
      ? null
      : t("retrospectiveSummary.activeDays", { count: summary.activeDays })
  ].filter((item): item is string => item !== null);

  const textMetric = (value: string | null) => (
    <MetricValue styles={styles} value={value ?? EMPTY_VALUE} />
  );
  const metrics: { content: ReactNode; key: string; label: string }[] = [
    {
      content: textMetric(summary.featuredSongTitle),
      key: "song",
      label: t("retrospectiveSummary.song")
    },
    {
      content: textMetric(summary.topArtistName),
      key: "artist",
      label: t("retrospectiveSummary.artist")
    },
    {
      content: textMetric(summary.topGenreName),
      key: "genre",
      label: t("retrospectiveSummary.genre")
    },
    {
      content: textMetric(summary.topTaggedUsername ? `@${summary.topTaggedUsername}` : null),
      key: "friend",
      label: t("retrospectiveSummary.friend")
    },
    {
      content: (
        <View
          accessibilityLabel={t("retrospectiveSummary.engagementValue", {
            comments: formatNumber(summary.commentsReceived),
            likes: formatNumber(summary.likesReceived)
          })}
          accessible
          style={styles.engagementRow}
        >
          <Icon color={colors.primary[500]} size={iconSize} source="heart" />
          <MetricValue inline styles={styles} value={formatNumber(summary.likesReceived)} />
          <Icon color={colors.primary[500]} size={iconSize} source="comment" />
          <MetricValue inline styles={styles} value={formatNumber(summary.commentsReceived)} />
        </View>
      ),
      key: "engagement",
      label: t("retrospectiveSummary.engagement")
    },
    {
      content: textMetric(t("retrospectiveSummary.streakDays", { count: summary.maxStreak })),
      key: "streak",
      label: t("retrospectiveSummary.streak")
    }
  ];
  // Explicit two-card rows: an exact-fit flexWrap row can wrap early on Android rounding.
  const rows = [metrics.slice(0, 2), metrics.slice(2, 4), metrics.slice(4, 6)];

  return (
    <View style={[styles.poster, rounded && styles.rounded]} testID={testID}>
      <LinearGradient
        colors={[withOpacity(colors.primary[500], 0.3), withOpacity(colors.primary[500], 0)]}
        end={{ x: 0.2, y: 0.55 }}
        start={{ x: 1, y: 0 }}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={[withOpacity(colors.primary[700], 0), withOpacity(colors.primary[700], 0.35)]}
        end={{ x: 0, y: 1 }}
        start={{ x: 0.6, y: 0.6 }}
        style={StyleSheet.absoluteFill}
      />

      <AppText allowFontScaling={false} numberOfLines={1} style={styles.title}>
        {t("retrospectiveSummary.posterTitle", { period: summary.periodLabel })}
      </AppText>

      <View style={styles.body}>
        <AppText allowFontScaling={false} style={styles.eyebrow}>
          {t("retrospectiveSummary.eyebrow", { period: summary.periodLabel })}
        </AppText>
        <AppText allowFontScaling={false} numberOfLines={3} style={styles.headline}>
          {t("retrospectiveSummary.headline")}
        </AppText>
        <AppText allowFontScaling={false} numberOfLines={1} style={styles.highlights}>
          {highlights.join(" · ")}
        </AppText>

        <View style={styles.grid}>
          {rows.map((row) => (
            <View key={row[0].key} style={styles.gridRow}>
              {row.map((metric) => (
                <MetricCard
                  key={metric.key}
                  label={metric.label}
                  styles={styles}
                  testID={`retrospective-summary-${metric.key}`}
                >
                  {metric.content}
                </MetricCard>
              ))}
            </View>
          ))}
        </View>
      </View>

      <AppText allowFontScaling={false} style={styles.logo}>
        {t("retrospectiveSummary.logo")}
      </AppText>
    </View>
  );
}

function MetricCard({
  children,
  label,
  styles,
  testID
}: Readonly<{ children: ReactNode; label: string; styles: PosterStyles; testID: string }>) {
  return (
    <View style={styles.card} testID={testID}>
      <AppText allowFontScaling={false} numberOfLines={1} style={styles.cardLabel}>
        {label}
      </AppText>
      {children}
    </View>
  );
}

function MetricValue({
  inline = false,
  styles,
  value
}: Readonly<{ inline?: boolean; styles: PosterStyles; value: string }>) {
  return (
    <AppText
      adjustsFontSizeToFit
      allowFontScaling={false}
      minimumFontScale={0.6}
      numberOfLines={1}
      style={[styles.cardValue, inline && styles.inlineValue]}
    >
      {value}
    </AppText>
  );
}

function createStyles(scale: number) {
  const s = (value: number) => value * scale;
  const gap = s(10);

  return StyleSheet.create({
    body: {
      flex: 1,
      justifyContent: "center"
    },
    card: {
      backgroundColor: withOpacity(baseColors.white, 0.06),
      borderColor: withOpacity(colors.primary[500], 0.6),
      borderRadius: s(12),
      borderWidth: Math.max(1, s(1)),
      flex: 1,
      gap: s(6),
      minWidth: 0,
      paddingHorizontal: s(12),
      paddingVertical: s(12)
    },
    cardLabel: {
      color: colors.neutrals[300],
      fontFamily: fontFamily.primary.semiBold,
      fontSize: s(10),
      letterSpacing: s(0.6),
      textTransform: "uppercase"
    },
    cardValue: {
      color: colors.primary[500],
      fontFamily: fontFamily.display.semiBold,
      fontSize: s(20),
      lineHeight: s(26)
    },
    engagementRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: s(4)
    },
    eyebrow: {
      color: colors.primary[500],
      fontFamily: fontFamily.primary.semiBold,
      fontSize: s(11),
      letterSpacing: s(0.6),
      textTransform: "uppercase"
    },
    grid: {
      gap,
      marginTop: s(24)
    },
    gridRow: {
      flexDirection: "row",
      gap
    },
    headline: {
      color: baseColors.white,
      fontFamily: fontFamily.display.bold,
      fontSize: s(28),
      lineHeight: s(34),
      marginTop: s(8)
    },
    highlights: {
      color: colors.neutrals[300],
      fontFamily: fontFamily.primary.regular,
      fontSize: s(13),
      marginTop: s(8)
    },
    inlineValue: {
      flexShrink: 1,
      marginRight: s(6)
    },
    logo: {
      color: colors.primary[500],
      fontFamily: fontFamily.display.boldItalic,
      fontSize: s(22)
    },
    poster: {
      backgroundColor: colors.neutrals[900],
      height: s(BASE_WIDTH) / POSTER_ASPECT_RATIO,
      overflow: "hidden",
      padding: s(24),
      width: s(BASE_WIDTH)
    },
    rounded: {
      borderColor: withOpacity(colors.primary[500], 0.25),
      borderRadius: s(24),
      borderWidth: 1
    },
    title: {
      color: baseColors.white,
      fontFamily: fontFamily.display.bold,
      fontSize: s(18)
    }
  });
}

import { Image } from "expo-image";
import { useVideoPlayer, VideoView } from "expo-video";
import type { PropsWithChildren } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Icon } from "react-native-paper";

import { AppText } from "@/components/ui";
import { type AuthImageSource, resolveApiAssetUrl, useAuthImageSource } from "@/services/api";
import { colors, fontFamily, radius, spacing } from "@/theme";

import { StatusBadge } from "../../components/StatusBadge";
import type { AdminReportedRecorda, AdminReportedUser } from "../../types";
import { formatReportDate } from "../formatReportDate";
import { useReportDateTime } from "../useReportDateTime";

export function ReportedRecordaCard({ recorda }: Readonly<{ recorda: AdminReportedRecorda }>) {
  const { i18n, t } = useTranslation();
  const formatDateTime = useReportDateTime();
  const coverSource = useAuthImageSource(resolveApiAssetUrl(recorda.songCoverUrl));

  return (
    <View style={styles.stack} testID="admin-report-recorda">
      <TargetSection label={t("admin.reportDetail.recordaLabel")}>
        <View style={styles.authorLine}>
          <AppText numberOfLines={1} style={styles.author}>
            @{recorda.author.username}
          </AppText>
          <StatusBadge status={recorda.author.status} />
        </View>
        <AppText style={styles.muted} variant="caption">
          {formatDateTime(recorda.createdAt)}
        </AppText>
      </TargetSection>

      {recorda.deletedAt ? (
        <RemovedBanner
          label={t("admin.reportDetail.removedAt", {
            date: formatReportDate(recorda.deletedAt, i18n.language)
          })}
        />
      ) : null}

      <RecordaMedia recorda={recorda} />

      {recorda.description ? (
        <AppText style={styles.description}>{recorda.description}</AppText>
      ) : null}

      <TargetSection label={t("admin.reportDetail.musicLabel")}>
        <View style={styles.song}>
          {coverSource ? (
            <Image
              contentFit="cover"
              source={coverSource}
              style={styles.cover}
              testID="admin-report-song-cover"
            />
          ) : null}
          <View style={styles.songCopy}>
            <AppText numberOfLines={1} style={styles.songTitle}>
              {recorda.songTitle}
            </AppText>
            <AppText numberOfLines={1} style={styles.muted} variant="caption">
              {recorda.songArtist}
            </AppText>
          </View>
        </View>
      </TargetSection>
    </View>
  );
}

export function ReportedUserCard({
  onOpenUser,
  user
}: Readonly<{ onOpenUser: (userId: string) => void; user: AdminReportedUser }>) {
  const { i18n, t } = useTranslation();
  const avatarSource = useAuthImageSource(
    user.avatarUrl ? resolveApiAssetUrl(user.avatarUrl) : null
  );

  return (
    <View style={styles.stack} testID="admin-report-user">
      <TargetSection label={t("admin.reportDetail.userLabel")}>
        <View style={styles.profile}>
          {avatarSource ? (
            <Image
              contentFit="cover"
              source={avatarSource}
              style={styles.avatar}
              testID="admin-report-avatar"
            />
          ) : (
            <View
              style={[styles.avatar, styles.avatarFallback]}
              testID="admin-report-avatar-fallback"
            >
              <Icon color={colors.neutrals[400]} size={28} source="account" />
            </View>
          )}
          <View style={styles.profileCopy}>
            <View style={styles.authorLine}>
              <AppText numberOfLines={1} style={styles.author}>
                @{user.username}
              </AppText>
              <StatusBadge status={user.status} />
            </View>
            <AppText numberOfLines={1} style={styles.muted}>
              {user.name}
            </AppText>
            <AppText numberOfLines={1} style={styles.muted} variant="caption">
              {user.email}
            </AppText>
          </View>
        </View>
        <AppText style={styles.muted} variant="caption">
          {t("admin.reportDetail.createdAt", {
            date: formatReportDate(user.createdAt, i18n.language)
          })}
          {user.isPrivate ? ` • ${t("admin.reportDetail.privateAccount")}` : ""}
        </AppText>
      </TargetSection>

      {user.deletedAt ? (
        <RemovedBanner
          label={t("admin.reportDetail.accountDeletedAt", {
            date: formatReportDate(user.deletedAt, i18n.language)
          })}
        />
      ) : null}

      <Pressable
        accessibilityRole="button"
        onPress={() => onOpenUser(user.userId)}
        style={({ pressed }) => [styles.openUser, pressed ? styles.pressed : undefined]}
        testID="admin-report-open-user"
      >
        <Icon color={colors.primary[300]} size={20} source="account-arrow-right-outline" />
        <AppText style={styles.openUserLabel} variant="buttonLarge">
          {t("admin.reportDetail.openUser")}
        </AppText>
      </Pressable>
    </View>
  );
}

function TargetSection({ children, label }: Readonly<PropsWithChildren<{ label: string }>>) {
  const { i18n } = useTranslation();

  return (
    <View style={styles.section}>
      <AppText style={styles.sectionLabel} variant="caption">
        {label.toLocaleUpperCase(i18n.language)}
      </AppText>
      {children}
    </View>
  );
}

function RemovedBanner({ label }: Readonly<{ label: string }>) {
  return (
    <View style={styles.removed} testID="admin-report-removed">
      <Icon color={colors.error[200]} size={18} source="delete-outline" />
      <AppText style={styles.removedLabel} variant="caption">
        {label}
      </AppText>
    </View>
  );
}

function RecordaMedia({ recorda }: Readonly<{ recorda: AdminReportedRecorda }>) {
  const { t } = useTranslation();
  const source = useAuthImageSource(resolveApiAssetUrl(recorda.mediaUrl));
  const username = recorda.author.username;

  if (recorda.mediaType === "VIDEO") {
    return <RecordaVideo label={t("admin.reportDetail.video", { username })} source={source} />;
  }

  return (
    <Image
      accessibilityLabel={t("admin.reportDetail.photo", { username })}
      contentFit="contain"
      source={source}
      style={styles.media}
      testID="admin-report-photo"
    />
  );
}

function RecordaVideo({
  label,
  source
}: Readonly<{ label: string; source: AuthImageSource | undefined }>) {
  const player = useVideoPlayer(source ?? null, (instance) => {
    instance.muted = true;
  });

  return (
    <VideoView
      accessibilityLabel={label}
      contentFit="contain"
      nativeControls
      player={player}
      style={styles.media}
      testID="admin-report-video"
    />
  );
}

const styles = StyleSheet.create({
  author: {
    color: colors.neutrals[100],
    flexShrink: 1,
    fontFamily: fontFamily.primary.semiBold
  },
  authorLine: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing[2]
  },
  avatar: {
    backgroundColor: colors.neutrals[700],
    borderRadius: radius.full,
    height: 56,
    width: 56
  },
  avatarFallback: {
    alignItems: "center",
    justifyContent: "center"
  },
  cover: {
    backgroundColor: colors.neutrals[700],
    borderRadius: radius.sm,
    height: 48,
    width: 48
  },
  description: {
    color: colors.neutrals[100]
  },
  media: {
    aspectRatio: 1,
    backgroundColor: colors.neutrals[800],
    borderRadius: radius.lg,
    overflow: "hidden",
    width: "100%"
  },
  muted: {
    color: colors.neutrals[300]
  },
  openUser: {
    alignItems: "center",
    borderColor: colors.primary[300],
    borderRadius: radius.xl,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing[2],
    justifyContent: "center",
    minHeight: 48
  },
  openUserLabel: {
    color: colors.primary[300]
  },
  pressed: {
    opacity: 0.82
  },
  profile: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing[3]
  },
  profileCopy: {
    flex: 1,
    gap: spacing[1],
    minWidth: 0
  },
  removed: {
    alignItems: "center",
    backgroundColor: colors.error[500],
    borderRadius: radius.md,
    flexDirection: "row",
    gap: spacing[2],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2]
  },
  removedLabel: {
    color: colors.error[200],
    fontFamily: fontFamily.primary.semiBold
  },
  section: {
    backgroundColor: colors.neutrals[800],
    borderRadius: radius.lg,
    gap: spacing[1],
    padding: spacing[3]
  },
  sectionLabel: {
    color: colors.primary[300],
    fontFamily: fontFamily.primary.semiBold,
    letterSpacing: 0.6
  },
  song: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing[3],
    marginTop: spacing[1]
  },
  songCopy: {
    flex: 1,
    minWidth: 0
  },
  songTitle: {
    color: colors.neutrals[100],
    fontFamily: fontFamily.primary.semiBold
  },
  stack: {
    gap: spacing[3]
  }
});

import { Image } from "expo-image";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Icon } from "react-native-paper";

import { AppText } from "@/components/ui";
import { resolveApiAssetUrl, useAuthImageSource } from "@/services/api";
import { colors, fontFamily, radius, spacing } from "@/theme";

const AVATAR_SIZE = 160;
const AVATAR_AREA_HEIGHT = AVATAR_SIZE + spacing[12] * 2;
const CHIP_IMAGE_SIZE = 32;

/**
 * Distance from the top of the header to the avatar's center. The screen draws the green
 * glow (ProfileGlow) behind the scroll and uses this to center it on the avatar.
 */
export const PROFILE_AVATAR_CENTER_Y = AVATAR_AREA_HEIGHT / 2;

export type ProfileHeaderCounts = {
  followers: number;
  following: number;
  recordas: number;
};

export type ProfileHeaderFavoriteSong = {
  artistName: string;
  coverUrl: string | null;
  title: string;
};

type ProfileHeaderProps = Readonly<{
  avatarUrl: string | null;
  name: string;
  username: string;
  favoriteSong: ProfileHeaderFavoriteSong | null;
  /** Hidden when absent or null: the screen decides whether the viewer may see them. */
  counts?: ProfileHeaderCounts | null;
  /** Shown between the music chips and the counters, e.g. a follow button. */
  actionSlot?: ReactNode;
  /** Makes the avatar pressable; only the own profile passes it. */
  onEditAvatar?: () => void;
}>;

/**
 * Presentation of a profile shared by the third-party profile and the own profile (US28).
 * Knows nothing about who is looking, privacy, follow or navigation: whoever renders it
 * passes only what may be shown.
 *
 * The green glow is not drawn here: inside a ScrollView it would be clipped at the scroll's
 * top edge. The screen renders ProfileGlow behind its layout instead.
 */
export function ProfileHeader({
  actionSlot,
  avatarUrl,
  counts,
  favoriteSong,
  name,
  onEditAvatar,
  username
}: ProfileHeaderProps) {
  const { t } = useTranslation();
  const avatarSource = useAuthImageSource(avatarUrl ? resolveApiAssetUrl(avatarUrl) : null);

  const avatar = avatarSource ? (
    <Image
      accessibilityLabel={t("profile.avatarA11y", { name })}
      contentFit="cover"
      source={avatarSource}
      style={styles.avatar}
      testID="profile-avatar"
    />
  ) : (
    <View
      accessibilityLabel={t("profile.avatarA11y", { name })}
      style={[styles.avatar, styles.avatarFallback]}
      testID="profile-avatar-fallback"
    >
      <Icon color={colors.neutrals[400]} size={72} source="account" />
    </View>
  );

  return (
    <View testID="profile-header">
      <View style={styles.avatarArea}>
        {onEditAvatar ? (
          <Pressable
            accessibilityLabel={t("profile.editAvatarA11y")}
            accessibilityRole="button"
            onPress={onEditAvatar}
            testID="profile-edit-avatar"
          >
            {avatar}
          </Pressable>
        ) : (
          avatar
        )}
      </View>

      <AppText numberOfLines={2} style={styles.name} variant="headline1">
        {name}
      </AppText>
      <AppText numberOfLines={1} style={styles.username}>
        @{username}
      </AppText>

      {favoriteSong ? (
        <View style={styles.chips}>
          <FavoriteSongChip song={favoriteSong} />
        </View>
      ) : null}

      {actionSlot ? <View style={styles.action}>{actionSlot}</View> : null}

      {counts ? (
        <View style={styles.counts} testID="profile-counts">
          <ProfileCount
            label={t("profile.counts.recordas", { count: counts.recordas })}
            value={counts.recordas}
          />
          <ProfileCount
            label={t("profile.counts.followers", { count: counts.followers })}
            value={counts.followers}
          />
          <ProfileCount label={t("profile.counts.following")} value={counts.following} />
        </View>
      ) : null}
    </View>
  );
}

function FavoriteSongChip({ song }: Readonly<{ song: ProfileHeaderFavoriteSong }>) {
  const { t } = useTranslation();
  // The cover may come as "" when Deezer has none (backend ADR 0001).
  const coverSource = useAuthImageSource(song.coverUrl ? resolveApiAssetUrl(song.coverUrl) : null);

  return (
    <View
      accessibilityLabel={t("profile.favoriteSongA11y", {
        artist: song.artistName,
        title: song.title
      })}
      accessible
      style={styles.chip}
      testID="profile-favorite-song"
    >
      {coverSource ? (
        <Image contentFit="cover" source={coverSource} style={styles.chipImage} />
      ) : (
        <View style={[styles.chipImage, styles.chipIcon]}>
          <Icon color={colors.neutrals[900]} size={18} source="music-note" />
        </View>
      )}
      <AppText numberOfLines={1} style={styles.chipLabel}>
        {`${song.title} · ${song.artistName}`}
      </AppText>
    </View>
  );
}

function ProfileCount({ label, value }: Readonly<{ label: string; value: number }>) {
  return (
    <View accessibilityLabel={`${value} ${label}`} accessible style={styles.count}>
      <AppText style={styles.countValue} variant="headline3">
        {value}
      </AppText>
      <AppText style={styles.countLabel} variant="body2">
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  action: {
    marginTop: spacing[6]
  },
  avatar: {
    borderRadius: AVATAR_SIZE / 2,
    height: AVATAR_SIZE,
    width: AVATAR_SIZE
  },
  avatarArea: {
    alignItems: "center",
    height: AVATAR_AREA_HEIGHT,
    justifyContent: "center"
  },
  avatarFallback: {
    alignItems: "center",
    backgroundColor: colors.neutrals[800],
    justifyContent: "center"
  },
  chip: {
    alignItems: "center",
    backgroundColor: colors.secondary[900],
    borderRadius: radius.full,
    flexDirection: "row",
    gap: spacing[2],
    minHeight: CHIP_IMAGE_SIZE + spacing[2],
    paddingLeft: spacing[1],
    paddingRight: spacing[3],
    width: "48%"
  },
  chipIcon: {
    alignItems: "center",
    backgroundColor: colors.primary[500],
    justifyContent: "center"
  },
  chipImage: {
    borderRadius: CHIP_IMAGE_SIZE / 2,
    height: CHIP_IMAGE_SIZE,
    width: CHIP_IMAGE_SIZE
  },
  chipLabel: {
    color: colors.neutrals[100],
    flexShrink: 1
  },
  // Two columns, ready for the other music chips once their data exists.
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: spacing[4],
    rowGap: spacing[3]
  },
  count: {
    alignItems: "center",
    flex: 1,
    gap: spacing[1]
  },
  countLabel: {
    color: colors.neutrals[100]
  },
  countValue: {
    color: colors.neutrals[100]
  },
  counts: {
    flexDirection: "row",
    marginTop: spacing[6]
  },
  name: {
    color: colors.neutrals[100],
    fontFamily: fontFamily.primary.bold
  },
  username: {
    color: colors.neutrals[300],
    fontSize: 16,
    marginTop: spacing[1]
  }
});

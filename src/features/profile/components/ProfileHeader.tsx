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

/**
 * A favorite artist or genre. Structurally compatible with the onboarding's
 * `MusicSelection`, so the screen can pass the music preferences as they come.
 */
export type ProfileHeaderMusicItem = {
  id: number | string;
  name: string;
  pictureUrl?: string | null;
};

type ProfileHeaderProps = Readonly<{
  avatarUrl: string | null;
  name: string;
  username: string;
  favoriteSong: ProfileHeaderFavoriteSong | null;
  /** Optional: only the own profile has a source for them today (music preferences). */
  favoriteArtists?: readonly ProfileHeaderMusicItem[];
  favoriteGenres?: readonly ProfileHeaderMusicItem[];
  /** Hidden when absent or null: the screen decides whether the viewer may see them. */
  counts?: ProfileHeaderCounts | null;
  /** Make the followers / following counters pressable; the screen navigates. */
  onPressFollowers?: () => void;
  onPressFollowing?: () => void;
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
  favoriteArtists = [],
  favoriteGenres = [],
  favoriteSong,
  name,
  onEditAvatar,
  onPressFollowers,
  onPressFollowing,
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

      {favoriteSong || favoriteArtists.length > 0 || favoriteGenres.length > 0 ? (
        <View style={styles.chips}>
          {favoriteSong ? (
            <ProfileChip
              accessibilityLabel={t("profile.favoriteSongA11y", {
                artist: favoriteSong.artistName,
                title: favoriteSong.title
              })}
              fallbackIcon="music-note"
              // The cover may come as "" when Deezer has none (backend ADR 0001).
              imageUrl={favoriteSong.coverUrl || null}
              label={`${favoriteSong.title} · ${favoriteSong.artistName}`}
              testID="profile-favorite-song"
            />
          ) : null}
          {favoriteArtists.map((artist) => (
            <ProfileChip
              accessibilityLabel={t("profile.favoriteArtistA11y", { name: artist.name })}
              fallbackIcon="account-music"
              imageUrl={artist.pictureUrl || null}
              key={`artist-${artist.id}`}
              label={artist.name}
              testID={`profile-favorite-artist-${artist.id}`}
            />
          ))}
          {favoriteGenres.map((genre) => (
            // Genres use the icon, as in the visual reference, not the Deezer picture.
            <ProfileChip
              accessibilityLabel={t("profile.favoriteGenreA11y", { name: genre.name })}
              fallbackIcon="music-note"
              imageUrl={null}
              key={`genre-${genre.id}`}
              label={genre.name}
              testID={`profile-favorite-genre-${genre.id}`}
            />
          ))}
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
            accessibilityHint={t("profile.counts.followersHint")}
            label={t("profile.counts.followers", { count: counts.followers })}
            onPress={onPressFollowers}
            testID="profile-count-followers"
            value={counts.followers}
          />
          <ProfileCount
            accessibilityHint={t("profile.counts.followingHint")}
            label={t("profile.counts.following")}
            onPress={onPressFollowing}
            testID="profile-count-following"
            value={counts.following}
          />
        </View>
      ) : null}
    </View>
  );
}

type ProfileChipProps = Readonly<{
  accessibilityLabel: string;
  fallbackIcon: string;
  imageUrl: string | null;
  label: string;
  testID: string;
}>;

/** Music chip: picture (or icon) and a one-line label that ends in "…" when too long. */
function ProfileChip({
  accessibilityLabel,
  fallbackIcon,
  imageUrl,
  label,
  testID
}: ProfileChipProps) {
  const imageSource = useAuthImageSource(imageUrl ? resolveApiAssetUrl(imageUrl) : null);

  return (
    <View accessibilityLabel={accessibilityLabel} accessible style={styles.chip} testID={testID}>
      {imageSource ? (
        <Image
          contentFit="cover"
          source={imageSource}
          style={styles.chipImage}
          testID={`${testID}-image`}
        />
      ) : (
        <View style={[styles.chipImage, styles.chipIcon]}>
          <Icon color={colors.neutrals[900]} size={18} source={fallbackIcon} />
        </View>
      )}
      <AppText numberOfLines={1} style={styles.chipLabel}>
        {label}
      </AppText>
    </View>
  );
}

type ProfileCountProps = Readonly<{
  /** Read only when the counter is pressable. */
  accessibilityHint?: string;
  label: string;
  onPress?: () => void;
  testID?: string;
  value: number;
}>;

function ProfileCount({ accessibilityHint, label, onPress, testID, value }: ProfileCountProps) {
  const content = (
    <>
      <AppText style={styles.countValue} variant="headline3">
        {value}
      </AppText>
      <AppText style={styles.countLabel} variant="body2">
        {label}
      </AppText>
    </>
  );

  if (!onPress) {
    return (
      <View
        accessibilityLabel={`${value} ${label}`}
        accessible
        style={styles.count}
        testID={testID}
      >
        {content}
      </View>
    );
  }

  return (
    <Pressable
      accessibilityHint={accessibilityHint}
      accessibilityLabel={`${value} ${label}`}
      accessibilityRole="button"
      hitSlop={4}
      onPress={onPress}
      style={({ pressed }) => [styles.count, pressed && styles.countPressed]}
      testID={testID}
    >
      {content}
    </Pressable>
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
  countPressed: {
    opacity: 0.7
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

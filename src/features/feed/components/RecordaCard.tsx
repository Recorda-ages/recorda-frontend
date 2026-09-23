import { Image } from "expo-image";
import { useVideoPlayer, VideoView } from "expo-video";
import { Pressable, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Icon } from "react-native-paper";

import { AppText } from "@/components/ui";
import { resolveApiAssetUrl } from "@/services/api";
import { colors, fontFamily, radius, spacing } from "@/theme";

import type { FeedItem } from "../types";

type RecordaCardProps = Readonly<{
  item: FeedItem;
  onPress: () => void;
}>;

export function RecordaCard({ item, onPress }: RecordaCardProps) {
  const { t, i18n } = useTranslation();
  const formattedDate = formatFeedDate(item.created_at, i18n.language);
  const avatarUrl = item.author.profile_picture_url
    ? resolveApiAssetUrl(item.author.profile_picture_url)
    : null;
  const mediaUrl = resolveApiAssetUrl(item.media_url);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={styles.card}
      testID={`feed-post-${item.recorda_id}`}
    >
      <View style={styles.header}>
        {avatarUrl ? (
          <Image source={avatarUrl} style={styles.avatar} testID="recorda-author-avatar" />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Icon color={colors.neutrals[400]} size={20} source="account" />
          </View>
        )}
        <View style={styles.headerText}>
          <AppText style={styles.username}>{item.author.username}</AppText>
          <AppText numberOfLines={1} style={styles.song}>
            <AppText style={styles.songTitle}>{item.song_title}</AppText>
            {` • ${item.song_artist_name}`}
          </AppText>
        </View>
        <Pressable accessibilityLabel={t("feed.more")} accessibilityRole="button" hitSlop={8}>
          <Icon color={colors.neutrals[100]} size={24} source="dots-horizontal" />
        </Pressable>
      </View>

      <RecordaCardMedia
        accessibilityLabel={item.description ?? item.song_title}
        mediaType={item.media_type}
        mediaUrl={mediaUrl}
      />

      <View style={styles.actions}>
        <View style={styles.actionGroup}>
          <View accessibilityLabel={t("feed.like")}>
            <Icon
              color={colors.primary[500]}
              size={26}
              source={item.is_liked ? "heart" : "heart-outline"}
            />
          </View>
          <View accessibilityLabel={t("feed.comment")}>
            <Icon color={colors.primary[500]} size={26} source="message-text-outline" />
          </View>
          <View accessibilityLabel={t("feed.share")}>
            <Icon color={colors.primary[500]} size={24} source="share-variant-outline" />
          </View>
        </View>
        <AppText style={styles.date}>{formattedDate}</AppText>
      </View>

      {item.likes_count > 0 ? (
        <AppText style={styles.text}>{t("feed.likesCount", { count: item.likes_count })}</AppText>
      ) : null}

      {item.description ? (
        <AppText style={styles.text}>
          <AppText style={styles.bold}>{item.author.username}</AppText> {item.description}
        </AppText>
      ) : null}
    </Pressable>
  );
}

type RecordaCardMediaProps = Readonly<{
  accessibilityLabel: string;
  mediaType: FeedItem["media_type"];
  mediaUrl: string;
}>;

function RecordaCardMedia({ accessibilityLabel, mediaType, mediaUrl }: RecordaCardMediaProps) {
  if (mediaType === "VIDEO") {
    return <RecordaCardVideo accessibilityLabel={accessibilityLabel} uri={mediaUrl} />;
  }

  return (
    <Image
      accessibilityLabel={accessibilityLabel}
      contentFit="cover"
      source={mediaUrl}
      style={styles.media}
      testID="recorda-media-image"
      transition={150}
    />
  );
}

type RecordaCardVideoProps = Readonly<{
  accessibilityLabel: string;
  uri: string;
}>;

function RecordaCardVideo({ accessibilityLabel, uri }: RecordaCardVideoProps) {
  const player = useVideoPlayer(uri, (playerInstance) => {
    playerInstance.muted = true;
  });

  return (
    <VideoView
      accessibilityLabel={accessibilityLabel}
      contentFit="cover"
      nativeControls={false}
      player={player}
      style={styles.media}
    />
  );
}

function formatFeedDate(isoDate: string, locale: string) {
  const date = new Date(isoDate);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat(locale, { day: "2-digit", month: "long" }).format(date);
}

const styles = StyleSheet.create({
  actionGroup: {
    flexDirection: "row",
    gap: spacing[4]
  },
  actions: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  avatar: {
    borderRadius: 20,
    height: 40,
    width: 40
  },
  avatarFallback: {
    alignItems: "center",
    backgroundColor: colors.neutrals[800],
    justifyContent: "center"
  },
  bold: {
    color: colors.neutrals[100],
    fontFamily: fontFamily.primary.bold
  },
  card: {
    borderBottomColor: colors.neutrals[700],
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: spacing[3],
    paddingBottom: spacing[4],
    paddingHorizontal: spacing[4]
  },
  date: {
    color: colors.neutrals[300],
    fontSize: 12
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing[3]
  },
  headerText: {
    flex: 1
  },
  media: {
    aspectRatio: 1,
    backgroundColor: colors.neutrals[800],
    borderRadius: radius.lg,
    width: "100%"
  },
  song: {
    color: colors.neutrals[100],
    fontSize: 12
  },
  songTitle: {
    color: colors.primary[500],
    fontFamily: fontFamily.primary.semiBold,
    fontSize: 12
  },
  text: {
    color: colors.neutrals[100],
    flexShrink: 1
  },
  username: {
    color: colors.neutrals[100],
    fontFamily: fontFamily.primary.bold,
    fontSize: 16
  }
});

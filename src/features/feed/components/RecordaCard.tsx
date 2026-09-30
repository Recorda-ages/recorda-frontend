import { Image } from "expo-image";
import { useVideoPlayer, VideoView } from "expo-video";
import { useEffect, useId, useRef, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Icon } from "react-native-paper";

import { AppText, LikeButton } from "@/components/ui";
import { resolveApiAssetUrl, useAuthImageSource, type AuthImageSource } from "@/services/api";
import { colors, fontFamily, radius, spacing, withOpacity } from "@/theme";

import { RecordaSoundControl } from "./RecordaSoundControl";
import { VideoLoadingSpinner } from "./VideoLoadingSpinner";
import { useFeedAudioActions, useFeedFocusKey } from "../state/FeedAudioContext";
import type { FeedItem } from "../types";
import { formatFeedDate } from "../utils/formatFeedDate";

type RecordaCardProps = Readonly<{
  /** Tells apart the same Recorda shown in both feed tabs. Defaults to the Recorda id. */
  focusKey?: string;
  item: FeedItem;
  onPress: () => void;
  onToggleLike: (liked: boolean) => Promise<void>;
  onShare?: () => void;
}>;

export function RecordaCard({ focusKey, item, onPress, onToggleLike, onShare }: RecordaCardProps) {
  const { t, i18n } = useTranslation();
  const [prevItem, setPrevItem] = useState(item);
  const [likesCount, setLikesCount] = useState(item.likes_count);
  const [isLiked, setIsLiked] = useState(item.is_liked);

  if (item !== prevItem) {
    setPrevItem(item);
    setLikesCount(item.likes_count);
    setIsLiked(item.is_liked);
  }

  const formattedDate = formatFeedDate(item.created_at, i18n.language);
  const avatarUrl = item.author.profile_picture_url
    ? resolveApiAssetUrl(item.author.profile_picture_url)
    : null;
  const avatarSource = useAuthImageSource(avatarUrl);
  const mediaUrl = resolveApiAssetUrl(item.media_url);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={styles.card}
      testID={`feed-post-${item.recorda_id}`}
    >
      <View style={styles.header}>
        {avatarSource ? (
          <Image source={avatarSource} style={styles.avatar} testID="recorda-author-avatar" />
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
        <Pressable
          accessibilityLabel={t("feed.more")}
          accessibilityRole="button"
          hitSlop={8}
          onPress={(event) => {
            event?.stopPropagation?.();
            onPress();
          }}
        >
          <Icon color={colors.neutrals[100]} size={24} source="dots-horizontal" />
        </Pressable>
      </View>

      <View style={styles.mediaWrapper}>
        <RecordaCardMedia
          accessibilityLabel={item.description ?? item.song_title}
          focusKey={focusKey ?? item.recorda_id}
          mediaType={item.media_type}
          mediaUrl={mediaUrl}
          recordaId={item.recorda_id}
        />
        <RecordaSoundControl
          hasPreview={Boolean(item.song_preview_url)}
          recordaId={item.recorda_id}
        />
      </View>

      <View style={styles.actions}>
        <View style={styles.actionGroup}>
          <LikeButton
            accessibilityLabel={t("feed.like")}
            count={likesCount}
            initialLiked={isLiked}
            onChange={({ count, liked }) => {
              setLikesCount(count);
              setIsLiked(liked);
            }}
            onToggle={onToggleLike}
            showCount={false}
            testID={`like-button-${item.recorda_id}`}
          />
          <Pressable
            accessibilityLabel={t("feed.comment")}
            accessibilityRole="button"
            onPress={(event) => {
              event?.stopPropagation?.();
              onPress();
            }}
          >
            <Icon color={colors.primary[500]} size={26} source="message-text-outline" />
          </Pressable>
          <Pressable
            accessibilityLabel={t("feed.share")}
            accessibilityRole="button"
            hitSlop={8}
            onPress={(event) => {
              event?.stopPropagation?.();
              onShare?.();
            }}
          >
            <Icon color={colors.primary[500]} size={24} source="share-variant-outline" />
          </Pressable>
        </View>
        <View style={styles.likes}>
          <Icon color={colors.neutrals[300]} size={14} source="heart-outline" />
          <AppText numberOfLines={1} style={styles.likesText}>
            {t("feed.likesCount", { count: likesCount })}
          </AppText>
        </View>
        <AppText style={styles.date}>{formattedDate}</AppText>
      </View>

      {item.description ? (
        // Capped so a long caption can't make the card taller than the screen (it would never
        // reach the focus threshold that starts its song). The full text is in the details,
        // which a tap anywhere on the card opens.
        <AppText ellipsizeMode="tail" numberOfLines={3} style={styles.text}>
          <AppText style={styles.bold}>{item.author.username}</AppText> {item.description}
        </AppText>
      ) : null}
    </Pressable>
  );
}

type RecordaCardMediaProps = Readonly<{
  accessibilityLabel: string;
  focusKey: string;
  mediaType: FeedItem["media_type"];
  mediaUrl: string;
  recordaId: string;
}>;

function RecordaCardMedia({
  accessibilityLabel,
  focusKey,
  mediaType,
  mediaUrl,
  recordaId
}: RecordaCardMediaProps) {
  const source = useAuthImageSource(mediaUrl);

  if (mediaType === "VIDEO") {
    return (
      <RecordaCardVideo
        accessibilityLabel={accessibilityLabel}
        focusKey={focusKey}
        recordaId={recordaId}
        source={source}
      />
    );
  }

  return (
    <Image
      accessibilityLabel={accessibilityLabel}
      contentFit="cover"
      source={source}
      style={styles.media}
      testID="recorda-media-image"
      transition={150}
    />
  );
}

type RecordaCardVideoProps = Readonly<{
  accessibilityLabel: string;
  focusKey: string;
  recordaId: string;
  source: AuthImageSource | undefined;
}>;

function RecordaCardVideo({
  accessibilityLabel,
  focusKey,
  recordaId,
  source
}: RecordaCardVideoProps) {
  const isFocused = useFeedFocusKey() === focusKey;
  // Cards that were never focused render a plain placeholder: creating a native player and
  // video view for every card that scrolls past is what stuttered the list. Once focused,
  // the player stays mounted so coming back doesn't reload it.
  const [hasBeenFocused, setHasBeenFocused] = useState(isFocused);
  const [isReady, setIsReady] = useState(false);
  const [hasFailed, setHasFailed] = useState(false);
  const { setMediaReady } = useFeedAudioActions();
  const reporter = useId();

  if (isFocused && !hasBeenFocused) {
    setHasBeenFocused(true);
  }

  // The song waits for this video; a failed load releases it too so it isn't muted forever.
  const canPlaySong = isReady || hasFailed || (hasBeenFocused && !source);

  useEffect(() => {
    setMediaReady(recordaId, canPlaySong, reporter);
  }, [canPlaySong, recordaId, reporter, setMediaReady]);

  useEffect(
    () => () => setMediaReady(recordaId, false, reporter),
    [recordaId, reporter, setMediaReady]
  );

  return (
    <View style={styles.media}>
      {hasBeenFocused && source ? (
        <FocusedVideo
          accessibilityLabel={accessibilityLabel}
          isFocused={isFocused}
          isReady={isReady}
          onFailed={() => setHasFailed(true)}
          onReadyChange={setIsReady}
          source={source}
        />
      ) : null}
      {isReady ? null : (
        <View pointerEvents="none" style={styles.videoPlaceholder}>
          {hasBeenFocused ? (
            <VideoLoadingSpinner />
          ) : (
            <Icon
              color={withOpacity(colors.neutrals[100], 0.5)}
              size={44}
              source="play-circle-outline"
            />
          )}
        </View>
      )}
    </View>
  );
}

type FocusedVideoProps = Readonly<{
  accessibilityLabel: string;
  isFocused: boolean;
  isReady: boolean;
  onFailed: () => void;
  onReadyChange: (ready: boolean) => void;
  source: AuthImageSource;
}>;

function FocusedVideo({
  accessibilityLabel,
  isFocused,
  isReady,
  onFailed,
  onReadyChange,
  source
}: FocusedVideoProps) {
  const player = useVideoPlayer(source, (playerInstance) => {
    playerInstance.muted = true;
    playerInstance.loop = true;
  });

  // Latest props without resubscribing to the player on every render.
  const latest = useRef({ isFocused, onFailed, onReadyChange });
  useEffect(() => {
    latest.current = { isFocused, onFailed, onReadyChange };
  });

  useEffect(() => {
    const handleStatus = (status: string) => {
      latest.current.onReadyChange(status === "readyToPlay");
      if (status === "error") latest.current.onFailed();
      // A play() issued while the video was still loading can be dropped natively.
      if (status === "readyToPlay" && latest.current.isFocused) player.play();
    };
    const subscription = player.addListener("statusChange", ({ status }) => handleStatus(status));
    // A video that got ready before this subscription would never report it (and keep
    // its song waiting), so the current status counts too.
    handleStatus(player.status);
    return () => subscription.remove();
  }, [player]);

  useEffect(() => {
    if (isFocused) player.play();
    else player.pause();
  }, [isFocused, player]);

  return (
    <VideoView
      accessibilityLabel={accessibilityLabel}
      contentFit="cover"
      nativeControls={false}
      player={player}
      style={[StyleSheet.absoluteFill, !isReady && styles.hiddenVideo]}
    />
  );
}

const styles = StyleSheet.create({
  actionGroup: {
    flexDirection: "row",
    gap: spacing[4]
  },
  actions: {
    alignItems: "center",
    flexDirection: "row"
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
    fontSize: 12,
    marginLeft: spacing[2]
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing[3]
  },
  headerText: {
    flex: 1
  },
  likes: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: spacing[1],
    marginLeft: spacing[3]
  },
  likesText: {
    color: colors.neutrals[100],
    flexShrink: 1,
    fontSize: 12
  },
  mediaWrapper: {
    position: "relative"
  },
  hiddenVideo: {
    opacity: 0
  },
  media: {
    aspectRatio: 1,
    backgroundColor: colors.neutrals[800],
    borderRadius: radius.lg,
    overflow: "hidden",
    width: "100%"
  },
  videoPlaceholder: {
    alignItems: "center",
    backgroundColor: colors.neutrals[800],
    bottom: 0,
    justifyContent: "center",
    left: 0,
    position: "absolute",
    right: 0,
    top: 0
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

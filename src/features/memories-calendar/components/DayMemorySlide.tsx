import { Image } from "expo-image";
import { useVideoPlayer, VideoView } from "expo-video";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { Icon } from "react-native-paper";

import { AppText } from "@/components/ui";
import { resolveApiAssetUrl, useAuthImageSource, type AuthImageSource } from "@/services/api";
import { baseColors, spacing, withOpacity } from "@/theme";

import type { DayRecordaDetail } from "../types";

type DayMemorySlideProps = Readonly<{
  height: number;
  isActive: boolean;
  memory: DayRecordaDetail;
  width: number;
}>;

/** Uma Recorda do dia: foto ou vídeo, horário e descrição. */
export function DayMemorySlide({ height, isActive, memory, width }: DayMemorySlideProps) {
  const { t } = useTranslation();
  const source = useAuthImageSource(resolveApiAssetUrl(memory.media_url));

  return (
    <View style={{ height, width }} testID={`day-memory-slide-${memory.recorda_id}`}>
      {source && memory.media_type === "VIDEO" ? (
        <SlideVideo isActive={isActive} source={source} />
      ) : (
        <Image contentFit="cover" source={source} style={StyleSheet.absoluteFill} />
      )}
      <View style={styles.caption}>
        <AppText style={styles.time} variant="buttonSmall">
          {memory.formatted_time}
        </AppText>
        {memory.description ? (
          <AppText numberOfLines={3} style={styles.description}>
            {memory.description}
          </AppText>
        ) : null}
        <View style={styles.engagement}>
          <View
            accessibilityLabel={t("memoriesCalendar.viewer.likes", { count: memory.likes_count })}
            accessible
            style={styles.stat}
            testID={`day-memory-likes-${memory.recorda_id}`}
          >
            <Icon
              color={baseColors.white}
              size={16}
              source={memory.is_liked ? "heart" : "heart-outline"}
            />
            <AppText style={styles.statText} variant="caption">
              {String(memory.likes_count)}
            </AppText>
          </View>
          <View
            accessibilityLabel={t("memoriesCalendar.viewer.comments", {
              count: memory.comments_count
            })}
            accessible
            style={styles.stat}
            testID={`day-memory-comments-${memory.recorda_id}`}
          >
            <Icon color={baseColors.white} size={16} source="comment-outline" />
            <AppText style={styles.statText} variant="caption">
              {String(memory.comments_count)}
            </AppText>
          </View>
        </View>
      </View>
    </View>
  );
}

// Sem som: a música do dia vem da pílula, como no feed.
function SlideVideo({
  isActive,
  source
}: Readonly<{ isActive: boolean; source: AuthImageSource }>) {
  const player = useVideoPlayer(source, (instance) => {
    instance.muted = true;
    instance.loop = true;
  });

  useEffect(() => {
    if (isActive) player.play();
    else player.pause();
  }, [isActive, player]);

  return (
    <VideoView
      contentFit="cover"
      nativeControls={false}
      player={player}
      style={StyleSheet.absoluteFill}
    />
  );
}

const styles = StyleSheet.create({
  caption: {
    backgroundColor: withOpacity(baseColors.black, 0.35),
    bottom: 0,
    gap: spacing[1],
    left: 0,
    paddingBottom: spacing[12] * 3,
    paddingHorizontal: spacing[4],
    paddingTop: spacing[3],
    position: "absolute",
    right: 0
  },
  description: {
    color: baseColors.white
  },
  engagement: {
    flexDirection: "row",
    gap: spacing[4],
    marginTop: spacing[1]
  },
  stat: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing[1]
  },
  statText: {
    color: baseColors.white
  },
  time: {
    color: baseColors.white
  }
});

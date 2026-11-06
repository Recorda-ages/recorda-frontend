import { Image } from "expo-image";
import { useVideoPlayer, VideoView } from "expo-video";
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";

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
  time: {
    color: baseColors.white
  }
});

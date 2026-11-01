import { Image } from "expo-image";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import { Icon } from "react-native-paper";

import { AppText } from "@/components/ui";
import { baseColors, colors, radius, spacing, withOpacity } from "@/theme";

type MusicPreviewPillProps = Readonly<{
  artist: string;
  canPlay: boolean;
  coverUrl: string;
  isPlaying: boolean;
  onToggle: () => void;
  title: string;
}>;

/** Pílula Sonora Recorda: capa, título, artista e play/pause da prévia Deezer. */
export function MusicPreviewPill({
  artist,
  canPlay,
  coverUrl,
  isPlaying,
  onToggle,
  title
}: MusicPreviewPillProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.pill} testID="music-preview-pill">
      <Image source={{ uri: coverUrl }} style={styles.cover} />
      <View style={styles.texts}>
        <AppText numberOfLines={1} style={styles.title} variant="buttonSmall">
          {title}
        </AppText>
        <AppText numberOfLines={1} style={styles.artist} variant="body2">
          {artist}
        </AppText>
      </View>
      <Pressable
        accessibilityLabel={
          isPlaying ? t("memoriesCalendar.viewer.pause") : t("memoriesCalendar.viewer.play")
        }
        accessibilityRole="button"
        accessibilityState={{ disabled: !canPlay }}
        disabled={!canPlay}
        hitSlop={8}
        onPress={onToggle}
        style={[styles.toggle, !canPlay && styles.disabled]}
        testID="music-preview-toggle"
      >
        <Icon color={baseColors.white} size={20} source={isPlaying ? "pause" : "play"} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  artist: {
    color: colors.neutrals[300]
  },
  cover: {
    borderRadius: radius.md,
    height: 40,
    width: 40
  },
  disabled: {
    opacity: 0.4
  },
  pill: {
    alignItems: "center",
    backgroundColor: withOpacity(baseColors.black, 0.6),
    borderRadius: radius.full,
    flexDirection: "row",
    gap: spacing[3],
    padding: spacing[2],
    paddingRight: spacing[3]
  },
  texts: {
    flex: 1
  },
  title: {
    color: baseColors.white
  },
  toggle: {
    alignItems: "center",
    height: 32,
    justifyContent: "center",
    width: 32
  }
});

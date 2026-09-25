import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";
import { Icon } from "react-native-paper";

import { AppText } from "@/components/ui";
import { baseColors, colors, fontFamily, radius, spacing } from "@/theme";

type RecordaMediaCardProps = {
  artistName: string;
  avatarUrl: string;
  lyrics: string[];
  mediaUrl: string;
  songTitle: string;
  username: string;
};

export function RecordaMediaCard({
  artistName,
  avatarUrl,
  lyrics,
  mediaUrl,
  songTitle,
  username
}: RecordaMediaCardProps) {
  return (
    <View style={styles.card}>
      <Image cachePolicy="memory-disk" contentFit="cover" source={mediaUrl} style={styles.media} />
      <View style={styles.mediaOverlay} />
      <View style={styles.header}>
        <Image
          cachePolicy="memory-disk"
          contentFit="cover"
          source={avatarUrl}
          style={styles.avatar}
        />
        <View style={styles.author}>
          <AppText style={styles.username}>{username}</AppText>
          <AppText numberOfLines={1} style={styles.song}>
            <AppText style={styles.songTitle}>{songTitle}</AppText>
            {" • " + artistName}
          </AppText>
        </View>
        <Icon color={colors.neutrals[100]} size={24} source="dots-horizontal" />
      </View>
      <View style={styles.lyrics}>
        {lyrics.map((line, index) => (
          <AppText key={line} style={index === 2 ? styles.lyricHighlight : styles.lyric}>
            {line}
          </AppText>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  author: {
    flex: 1,
    gap: spacing[1]
  },
  avatar: {
    borderCurve: "continuous",
    borderRadius: radius.full,
    height: 56,
    width: 56
  },
  card: {
    aspectRatio: 0.84,
    backgroundColor: colors.neutrals[800],
    borderCurve: "continuous",
    borderRadius: 32,
    marginHorizontal: spacing[4],
    overflow: "hidden",
    position: "relative"
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing[3],
    padding: spacing[4],
    zIndex: 1
  },
  lyric: {
    color: colors.neutrals[200],
    fontSize: 16,
    lineHeight: 23,
    textAlign: "center"
  },
  lyricHighlight: {
    color: baseColors.white,
    fontFamily: fontFamily.primary.bold,
    fontSize: 23,
    lineHeight: 30,
    textAlign: "center"
  },
  lyrics: {
    alignItems: "center",
    bottom: spacing[8],
    gap: spacing[1],
    left: spacing[4],
    position: "absolute",
    right: spacing[4]
  },
  media: {
    ...StyleSheet.absoluteFill
  },
  mediaOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: baseColors.black,
    opacity: 0.45
  },
  song: {
    color: colors.neutrals[200],
    fontSize: 16
  },
  songTitle: {
    color: colors.primary[500],
    fontFamily: fontFamily.primary.semiBold
  },
  username: {
    color: colors.neutrals[100],
    fontFamily: fontFamily.primary.bold,
    fontSize: 18
  }
});

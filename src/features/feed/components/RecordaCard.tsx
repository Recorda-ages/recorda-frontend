import { Image } from "expo-image";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Icon } from "react-native-paper";

import { AppText } from "@/components/ui";
import { colors, fontFamily, radius, spacing } from "@/theme";

import type { FeedPost } from "../types";

type RecordaCardProps = {
  post: FeedPost;
};

const VISIBLE_COMMENTS = 2;

export function RecordaCard({ post }: RecordaCardProps) {
  const { t } = useTranslation();
  const [liked, setLiked] = useState(false);

  return (
    <View style={styles.card} testID={`feed-post-${post.id}`}>
      <View style={styles.header}>
        <Image source={post.author.avatarUrl} style={styles.avatar} />
        <View style={styles.headerText}>
          <AppText style={styles.username}>{post.author.username}</AppText>
          <AppText numberOfLines={1} style={styles.song}>
            <AppText style={styles.songTitle}>{post.song.title}</AppText>
            {` • ${post.song.artistName}`}
          </AppText>
        </View>
        <Pressable accessibilityLabel={t("feed.more")} accessibilityRole="button" hitSlop={8}>
          <Icon color={colors.neutrals[100]} size={24} source="dots-horizontal" />
        </Pressable>
      </View>

      <Image
        accessibilityLabel={post.description}
        contentFit="cover"
        source={post.mediaUrl}
        style={styles.media}
        transition={150}
      />

      <View style={styles.actions}>
        <View style={styles.actionGroup}>
          <Pressable
            accessibilityLabel={t("feed.like")}
            accessibilityRole="button"
            accessibilityState={{ selected: liked }}
            hitSlop={8}
            onPress={() => setLiked((current) => !current)}
          >
            <Icon
              color={colors.primary[500]}
              size={26}
              source={liked ? "heart" : "heart-outline"}
            />
          </Pressable>
          <Pressable accessibilityLabel={t("feed.comment")} accessibilityRole="button" hitSlop={8}>
            <Icon color={colors.primary[500]} size={26} source="message-text-outline" />
          </Pressable>
          <Pressable accessibilityLabel={t("feed.share")} accessibilityRole="button" hitSlop={8}>
            <Icon color={colors.primary[500]} size={24} source="share-variant-outline" />
          </Pressable>
        </View>
        <AppText style={styles.date}>{post.publishedAt}</AppText>
      </View>

      <View style={styles.likedBy}>
        <Image source={post.likedBy.avatarUrl} style={styles.likedByAvatar} />
        <AppText style={styles.text}>
          {t("feed.likedByPrefix")} <AppText style={styles.bold}>{post.likedBy.username}</AppText>{" "}
          {t("feed.likedBySuffix", { count: post.likesCount + (liked ? 1 : 0) })}
        </AppText>
      </View>

      {post.comments.slice(0, VISIBLE_COMMENTS).map((comment) => (
        <AppText key={comment.id} style={styles.text}>
          <AppText style={styles.bold}>{comment.username}</AppText> {comment.text}
        </AppText>
      ))}
    </View>
  );
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
  likedBy: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing[2]
  },
  likedByAvatar: {
    borderRadius: 10,
    height: 20,
    width: 20
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

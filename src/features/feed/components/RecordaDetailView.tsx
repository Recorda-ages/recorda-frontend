import { Image } from "expo-image";
import { StatusBar } from "expo-status-bar";
import { useVideoPlayer, VideoView } from "expo-video";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View
} from "react-native";
import { Icon } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppText } from "@/components/ui";
import { colors, fontFamily, radius, spacing } from "@/theme";

import type { FeedPost } from "../types";
import { BottomTabBar, type BottomTab } from "./BottomTabBar";

type Props = {
  post: FeedPost;
  liked: boolean;
  isOwnPost: boolean;
  onBack: () => void;
  onLike: () => void;
  onComment: (text: string) => void;
  onDelete: () => void;
  onReport: () => void;
  onShare: () => void;
  onTabPress: (tab: BottomTab) => void;
};

function IconAction({
  label,
  icon,
  onPress,
  selected
}: {
  label: string;
  icon: string;
  onPress: () => void;
  selected?: boolean;
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={selected === undefined ? undefined : { selected }}
      onPress={onPress}
      style={styles.iconButton}
    >
      <Icon source={icon} size={26} color={colors.primary[500]} />
    </Pressable>
  );
}

function RecordaVideo({ uri, label }: { uri: string; label: string }) {
  const player = useVideoPlayer(uri, (instance) => {
    instance.muted = true;
  });

  return (
    <VideoView
      accessibilityLabel={label}
      contentFit="cover"
      nativeControls={false}
      player={player}
      style={styles.media}
    />
  );
}

export function RecordaDetailView({
  post,
  liked,
  isOwnPost,
  onBack,
  onLike,
  onComment,
  onDelete,
  onReport,
  onShare,
  onTabPress
}: Props) {
  const { t } = useTranslation();
  const [menu, setMenu] = useState<"options" | "delete" | null>(null);
  const [comment, setComment] = useState("");
  const input = useRef<TextInput>(null);
  const list = useRef<FlatList>(null);

  const submitComment = () => {
    const text = comment.trim();
    if (!text) return;
    onComment(text);
    setComment("");
  };

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={styles.screen}
      testID="recorda-detail-screen"
    >
      <StatusBar style="light" />
      <Image
        accessibilityElementsHidden
        contentFit="contain"
        importantForAccessibility="no-hide-descendants"
        pointerEvents="none"
        source={require("@/assets/images/glow.png")}
        style={styles.glow}
      />
      <View style={styles.header}>
        <IconAction label={t("publishedRecorda.back")} icon="chevron-left" onPress={onBack} />
        <AppText style={styles.logo}>{t("feed.logo")}</AppText>
        <View style={styles.iconButton} />
      </View>
      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <FlatList
          ref={list}
          data={post.comments}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <View style={styles.post}>
              <View style={styles.author}>
                <Image source={post.author.avatarUrl} style={styles.avatar} />
                <View style={styles.content}>
                  <AppText style={styles.bold}>{post.author.username}</AppText>
                  <AppText style={styles.text}>
                    <AppText style={styles.song}>{post.song.title}</AppText>
                    {` · ${post.song.artistName}`}
                  </AppText>
                </View>
                <IconAction
                  label={t("feed.more")}
                  icon="dots-horizontal"
                  onPress={() => setMenu("options")}
                />
              </View>
              {post.mediaType === "VIDEO" ? (
                <RecordaVideo label={post.description} uri={post.mediaUrl} />
              ) : (
                <Image
                  accessibilityLabel={post.description}
                  source={post.mediaUrl}
                  contentFit="cover"
                  style={styles.media}
                />
              )}
              <View style={styles.actions}>
                <View style={styles.actions}>
                  <IconAction
                    label={t("feed.like")}
                    icon={liked ? "heart" : "heart-outline"}
                    onPress={onLike}
                    selected={liked}
                  />
                  <IconAction
                    label={t("feed.comment")}
                    icon="message-text-outline"
                    onPress={() => input.current?.focus()}
                  />
                  <IconAction
                    label={t("feed.share")}
                    icon="share-variant-outline"
                    onPress={onShare}
                  />
                </View>
                <AppText style={styles.date}>{post.publishedAt}</AppText>
              </View>
              <AppText style={styles.text}>
                {t("publishedRecorda.likes", { count: post.likesCount + (liked ? 1 : 0) })}
              </AppText>
              <AppText style={styles.text}>
                <AppText style={styles.bold}>{post.author.username}</AppText> {post.description}
              </AppText>
              <AppText accessibilityRole="header" style={styles.bold}>
                {t("publishedRecorda.comments")}
              </AppText>
            </View>
          }
          ListEmptyComponent={
            <AppText style={styles.muted}>{t("publishedRecorda.noComments")}</AppText>
          }
          renderItem={({ item }) => (
            <AppText style={styles.comment}>
              <AppText style={styles.bold}>{item.username}</AppText> {item.text}
            </AppText>
          )}
        />
        <View style={styles.composer}>
          <TextInput
            ref={input}
            accessibilityLabel={t("publishedRecorda.writeComment")}
            placeholder={t("publishedRecorda.writeComment")}
            placeholderTextColor={colors.neutrals[300]}
            style={styles.input}
            value={comment}
            onChangeText={setComment}
            onFocus={() => list.current?.scrollToEnd({ animated: true })}
            maxLength={2000}
            multiline
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("publishedRecorda.send")}
            accessibilityState={{ disabled: !comment.trim() }}
            disabled={!comment.trim()}
            onPress={submitComment}
            style={styles.iconButton}
          >
            <Icon
              source="send"
              size={24}
              color={comment.trim() ? colors.primary[500] : colors.neutrals[500]}
            />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
      <BottomTabBar activeTab="feed" onPress={onTabPress} />
      <Modal
        visible={menu !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setMenu(null)}
      >
        <View style={styles.scrim}>
          <View accessibilityViewIsModal style={styles.dialog}>
            {menu === "delete" ? (
              <>
                <AppText style={styles.bold}>{t("publishedRecorda.deleteTitle")}</AppText>
                <AppText style={styles.text}>{t("publishedRecorda.deleteMessage")}</AppText>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    setMenu(null);
                    onDelete();
                  }}
                  style={styles.dialogButton}
                >
                  <AppText style={styles.destructive}>
                    {t("publishedRecorda.confirmDelete")}
                  </AppText>
                </Pressable>
              </>
            ) : (
              <Pressable
                accessibilityRole="button"
                style={styles.dialogButton}
                onPress={() => {
                  if (isOwnPost) setMenu("delete");
                  else {
                    setMenu(null);
                    onReport();
                  }
                }}
              >
                <AppText style={styles.destructive}>
                  {t(isOwnPost ? "publishedRecorda.delete" : "publishedRecorda.report")}
                </AppText>
              </Pressable>
            )}
            <Pressable
              accessibilityRole="button"
              onPress={() => setMenu(null)}
              style={styles.dialogButton}
            >
              <AppText style={styles.text}>{t("publishedRecorda.cancel")}</AppText>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.neutrals[900], overflow: "hidden" },
  glow: {
    position: "absolute",
    right: -180,
    top: -215,
    width: 520,
    height: 520,
    opacity: 0.38
  },
  content: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing[3]
  },
  logo: {
    color: colors.primary[500],
    fontFamily: fontFamily.primary.bold,
    fontStyle: "italic",
    fontSize: 26
  },
  iconButton: { minWidth: 44, minHeight: 44, alignItems: "center", justifyContent: "center" },
  list: { padding: spacing[4], gap: spacing[3] },
  post: { gap: spacing[3] },
  author: { flexDirection: "row", alignItems: "center", gap: spacing[2] },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  bold: { color: colors.neutrals[100], fontFamily: fontFamily.primary.bold },
  text: { color: colors.neutrals[100] },
  song: { color: colors.primary[500], fontSize: 12 },
  media: {
    width: "100%",
    aspectRatio: 9 / 13,
    borderRadius: radius.lg,
    backgroundColor: colors.neutrals[800]
  },
  actions: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  date: { color: colors.neutrals[300], fontSize: 12, flexShrink: 1 },
  muted: { color: colors.neutrals[300] },
  comment: { color: colors.neutrals[100], paddingVertical: spacing[1] },
  composer: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing[3],
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.neutrals[700]
  },
  input: {
    flex: 1,
    color: colors.neutrals[100],
    minHeight: 44,
    maxHeight: 120,
    padding: spacing[2]
  },
  scrim: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "center",
    padding: spacing[6]
  },
  dialog: {
    backgroundColor: colors.neutrals[800],
    borderRadius: radius.lg,
    padding: spacing[4],
    gap: spacing[3]
  },
  dialogButton: { minHeight: 48, justifyContent: "center" },
  destructive: { color: colors.error[200], fontFamily: fontFamily.primary.bold }
});

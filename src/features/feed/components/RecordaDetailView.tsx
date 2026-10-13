import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useVideoPlayer, VideoView } from "expo-video";
import { type ReactNode, useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Animated,
  AppState,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  LayoutAnimation,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  View
} from "react-native";
import { Icon } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

import { AnimatedHeart, AppText } from "@/components/ui";
import { useAuthImageSource, type AuthImageSource } from "@/services/api";
import { baseColors, colors, fontFamily, radius, spacing, withOpacity } from "@/theme";

import type { FeedComment, FeedPost } from "../types";
import { BottomTabBar, type BottomTab } from "./BottomTabBar";
import { FeedGlow } from "./FeedGlow";
import { useFeedAudioActions } from "../state/FeedAudioContext";
import { RecordaSoundControl } from "./RecordaSoundControl";
import { VideoLoadingSpinner } from "./VideoLoadingSpinner";

type Props = {
  post: FeedPost;
  commentsLoading?: boolean;
  commentsError?: boolean;
  commentSubmitError?: boolean;
  deleteError?: boolean;
  deleteSubmitting?: boolean;
  commentSubmitting?: boolean;
  likeSubmitting?: boolean;
  onRetryComments?: () => void;
  liked: boolean;
  isOwnPost: boolean;
  onBack: () => void;
  onLike: () => void;
  onComment: (text: string) => Promise<void>;
  onDelete: () => void;
  onReport: () => void;
  onShare: () => void;
  onTabPress: (tab: BottomTab) => void;
};

type RecordaMenu = "options" | "delete" | null;

/** Share of the media area covered by the open comments sheet. */
const SHEET_HEIGHT_RATIO = 0.55;
/** Tallest the expanded description gets before it scrolls, as a share of the media height. */
const DESCRIPTION_MAX_RATIO = 0.4;
const ACTION_STRIP_HEIGHT = 52;
const ACTION_ICON_SIZE = 30;
const BACK_ICON_SIZE = 38;
const MORE_ICON_SIZE = 24;
const MENU_ICON_SIZE = 20;

const SHEET_CLOSE_MS = 180;
/** Shared by the comments sheet and the description/actions panel. */
const PANEL_BACKGROUND = withOpacity(colors.neutrals[900], 0.8);
/** Both panels float over the media with a bit of it showing around them. */
const ISLAND_MARGIN = spacing[3];
const OVERLAY_FADE_MS = 150;

/** Whether a drag on the sheet's handle should dismiss it rather than snap back. */
export function shouldCloseCommentsSheet(dragY: number, velocityY: number, sheetHeight: number) {
  return dragY > sheetHeight * 0.3 || velocityY > 0.5;
}

function IconAction({
  children,
  label,
  icon,
  iconSize = ACTION_ICON_SIZE,
  onPress,
  selected,
  disabled = false
}: Readonly<{
  children?: ReactNode;
  label: string;
  icon?: string;
  iconSize?: number;
  onPress: () => void;
  selected?: boolean;
  disabled?: boolean;
}>) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={selected === undefined ? undefined : { selected }}
      disabled={disabled}
      onPress={onPress}
      style={styles.iconButton}
    >
      {children ?? <Icon source={icon} size={iconSize} color={colors.primary[500]} />}
    </Pressable>
  );
}

function RecordaVideo({
  label,
  recordaId,
  source
}: Readonly<{ label: string; recordaId: string; source: AuthImageSource | undefined }>) {
  const { setMediaReady } = useFeedAudioActions();
  const reporter = useId();
  const [isReady, setIsReady] = useState(false);
  const [hasFailed, setHasFailed] = useState(false);
  const player = useVideoPlayer(source ?? null, (instance) => {
    instance.muted = true;
    instance.loop = true;
    instance.play();
  });

  useEffect(() => {
    const handleStatus = (status: string) => {
      setIsReady(status === "readyToPlay");
      if (status === "error") setHasFailed(true);
    };
    const subscription = player.addListener("statusChange", ({ status }) => handleStatus(status));
    // Covers a video that got ready before this subscription existed.
    handleStatus(player.status);
    return () => subscription.remove();
  }, [player]);

  // The song waits for the video, as in the feed; a failed load releases it too.
  useEffect(() => {
    setMediaReady(recordaId, isReady || hasFailed, reporter);
  }, [hasFailed, isReady, recordaId, reporter, setMediaReady]);

  useEffect(
    () => () => setMediaReady(recordaId, false, reporter),
    [recordaId, reporter, setMediaReady]
  );

  // Don't keep decoding video while the app is in the background.
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") player.play();
      else player.pause();
    });
    return () => subscription.remove();
  }, [player]);

  return (
    <>
      <VideoView
        accessibilityLabel={label}
        contentFit="cover"
        nativeControls={false}
        player={player}
        style={[StyleSheet.absoluteFill, !isReady && styles.hiddenVideo]}
      />
      {isReady ? null : (
        <View pointerEvents="none" style={styles.videoPlaceholder}>
          <VideoLoadingSpinner />
        </View>
      )}
    </>
  );
}

function SmallAvatar({ source }: Readonly<{ source: AuthImageSource | undefined }>) {
  return source ? (
    <Image source={source} style={styles.smallAvatar} />
  ) : (
    <View style={[styles.smallAvatar, styles.avatarFallback]}>
      <Icon source="account" size={18} color={colors.neutrals[400]} />
    </View>
  );
}

// A component of its own so each row can use the auth image hook.
function CommentRow({ comment }: Readonly<{ comment: FeedComment }>) {
  const avatarSource = useAuthImageSource(comment.avatarUrl);

  return (
    <View style={styles.commentRow}>
      <SmallAvatar source={avatarSource} />
      <AppText style={[styles.comment, styles.commentText]}>
        <AppText style={styles.bold}>{comment.username}</AppText> {comment.text}
      </AppText>
    </View>
  );
}

type CommentsSheetProps = Readonly<{
  comments: FeedComment[];
  commentsError: boolean;
  commentsLoading: boolean;
  commentSubmitError: boolean;
  commentSubmitting: boolean;
  height: number;
  onClose: () => void;
  onComment: (text: string) => Promise<void>;
  onRetryComments?: () => void;
  translateY: Animated.Value;
}>;

function CommentsSheet({
  comments,
  commentsError,
  commentsLoading,
  commentSubmitError,
  commentSubmitting,
  height,
  onClose,
  onComment,
  onRetryComments,
  translateY
}: CommentsSheetProps) {
  const { t } = useTranslation();
  const [comment, setComment] = useState("");
  const list = useRef<FlatList>(null);

  // Only the handle drags the sheet, so the comment list keeps its own scrolling.
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_event, gesture) => Math.abs(gesture.dy) > 4,
        onPanResponderMove: (_event, gesture) => translateY.setValue(Math.max(0, gesture.dy)),
        onPanResponderRelease: (_event, gesture) => {
          if (shouldCloseCommentsSheet(gesture.dy, gesture.vy, height)) {
            onClose();
            return;
          }
          Animated.spring(translateY, {
            bounciness: 0,
            toValue: 0,
            useNativeDriver: true
          }).start();
        },
        onStartShouldSetPanResponder: () => true
      }),
    [height, onClose, translateY]
  );

  const submitComment = async () => {
    const text = comment.trim();
    if (!text || text.length > 500 || commentSubmitting) return;
    try {
      await onComment(text);
      setComment("");
      list.current?.scrollToEnd({ animated: true });
    } catch {
      // The error stays visible above the composer so the draft can be retried.
    }
  };

  return (
    <Animated.View
      // Screen readers stay inside the sheet instead of reaching the media behind it.
      accessibilityViewIsModal
      style={[styles.sheet, { height, transform: [{ translateY }] }]}
      testID="comments-sheet"
    >
      <View
        accessibilityHint={t("publishedRecorda.dragToClose")}
        style={styles.sheetHeader}
        testID="comments-sheet-handle"
        {...panResponder.panHandlers}
      >
        <View style={styles.sheetGrip} />
        <AppText accessibilityRole="header" style={styles.bold}>
          {t("publishedRecorda.comments")}
        </AppText>
      </View>
      <FlatList
        ref={list}
        contentContainerStyle={styles.commentList}
        data={comments}
        keyboardShouldPersistTaps="handled"
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          commentsLoading ? (
            <AppText style={styles.muted}>{t("publishedRecorda.loadingComments")}</AppText>
          ) : commentsError ? (
            <Pressable accessibilityRole="button" onPress={onRetryComments}>
              <AppText style={styles.muted}>{t("publishedRecorda.commentsLoadError")}</AppText>
            </Pressable>
          ) : (
            <AppText style={styles.muted}>{t("publishedRecorda.noComments")}</AppText>
          )
        }
        renderItem={({ item }) => <CommentRow comment={item} />}
        showsVerticalScrollIndicator={false}
        style={styles.commentListContainer}
      />
      {commentSubmitError ? (
        <AppText style={styles.submitError}>{t("publishedRecorda.commentSubmitError")}</AppText>
      ) : null}
      <View style={styles.composer}>
        <TextInput
          accessibilityLabel={t("publishedRecorda.writeComment")}
          maxLength={500}
          multiline
          onChangeText={setComment}
          placeholder={t("publishedRecorda.writeComment")}
          placeholderTextColor={colors.neutrals[300]}
          style={styles.input}
          value={comment}
        />
        <Pressable
          accessibilityLabel={t("publishedRecorda.send")}
          accessibilityRole="button"
          accessibilityState={{ disabled: !comment.trim() || commentSubmitting }}
          disabled={!comment.trim() || commentSubmitting}
          onPress={() => void submitComment()}
          style={styles.iconButton}
        >
          <Icon
            color={comment.trim() ? colors.primary[500] : colors.neutrals[500]}
            size={24}
            source="send"
          />
        </Pressable>
      </View>
    </Animated.View>
  );
}

function ThirdPartyRecordaMenu({
  isOwnPost,
  menu,
  onClose,
  onReport
}: Readonly<{
  isOwnPost: boolean;
  menu: RecordaMenu;
  onClose: () => void;
  onReport: () => void;
}>) {
  const { t } = useTranslation();

  if (isOwnPost || menu !== "options") return null;

  return (
    <>
      <Pressable
        accessibilityLabel={t("publishedRecorda.cancel")}
        onPress={onClose}
        style={StyleSheet.absoluteFill}
        testID="recorda-menu-backdrop"
      />
      <View style={styles.popover} testID="recorda-menu">
        {/* Disabled until the backend has a "not interested" contract, so a tap
            never looks like it did something. */}
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: true }}
          disabled
          style={styles.popoverItem}
        >
          <Icon source="eye-off-outline" size={MENU_ICON_SIZE} color={colors.neutrals[200]} />
          <AppText style={styles.popoverLabel}>{t("publishedRecorda.notInterested")}</AppText>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            onClose();
            onReport();
          }}
          style={styles.popoverItem}
        >
          <Icon source="message-alert-outline" size={MENU_ICON_SIZE} color={colors.error[200]} />
          <AppText style={[styles.popoverLabel, styles.popoverDestructive]}>
            {t("publishedRecorda.report")}
          </AppText>
        </Pressable>
      </View>
    </>
  );
}

function OwnRecordaMenu({
  deleteError,
  deleteSubmitting,
  isOwnPost,
  menu,
  onClose,
  onDelete,
  onRequestDelete
}: Readonly<{
  deleteError: boolean;
  deleteSubmitting: boolean;
  isOwnPost: boolean;
  menu: RecordaMenu;
  onClose: () => void;
  onDelete: () => void;
  onRequestDelete: () => void;
}>) {
  const { t } = useTranslation();

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      transparent
      visible={isOwnPost && menu !== null}
    >
      <View style={styles.scrim}>
        <View accessibilityViewIsModal style={styles.dialog}>
          {menu === "delete" ? (
            <>
              <AppText style={styles.bold}>{t("publishedRecorda.deleteTitle")}</AppText>
              <AppText style={styles.text}>{t("publishedRecorda.deleteMessage")}</AppText>
              {deleteError ? (
                <AppText style={styles.submitError}>{t("publishedRecorda.deleteError")}</AppText>
              ) : null}
              <Pressable
                accessibilityRole="button"
                disabled={deleteSubmitting}
                onPress={onDelete}
                style={styles.dialogButton}
              >
                <AppText style={styles.destructive}>{t("publishedRecorda.confirmDelete")}</AppText>
              </Pressable>
            </>
          ) : (
            <Pressable
              accessibilityRole="button"
              onPress={onRequestDelete}
              style={styles.dialogButton}
            >
              <AppText style={styles.destructive}>{t("publishedRecorda.delete")}</AppText>
            </Pressable>
          )}
          <Pressable
            accessibilityRole="button"
            disabled={deleteSubmitting}
            onPress={onClose}
            style={styles.dialogButton}
          >
            <AppText style={styles.text}>{t("publishedRecorda.cancel")}</AppText>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

export function RecordaDetailView({
  post,
  commentsLoading = false,
  commentsError = false,
  commentSubmitError = false,
  deleteError = false,
  deleteSubmitting = false,
  commentSubmitting = false,
  likeSubmitting = false,
  onRetryComments,
  liked,
  isOwnPost,
  onBack,
  onLike,
  onComment,
  onDelete,
  onReport,
  onShare,
  onTabPress
}: Readonly<Props>) {
  const { t } = useTranslation();
  const { height: windowHeight } = useWindowDimensions();
  const [menu, setMenu] = useState<RecordaMenu>(null);
  const [mediaHeight, setMediaHeight] = useState(0);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [canExpandDescription, setCanExpandDescription] = useState(false);
  const [sheetY] = useState(() => new Animated.Value(windowHeight));
  const authorAvatarSource = useAuthImageSource(post.author.avatarUrl);
  const mediaSource = useAuthImageSource(post.mediaUrl);
  const sheetHeight = Math.round(mediaHeight * SHEET_HEIGHT_RATIO);
  // How far the sheet slides to be fully off the media, margin included.
  const sheetHiddenY = sheetHeight ? sheetHeight + ISLAND_MARGIN : windowHeight;
  // Description and actions fade out while the comments sheet is open so they never show
  // through it. Its own value: an interpolation of the sheet's native-driven position
  // didn't update this sibling view on device.
  const [overlayOpacity] = useState(() => new Animated.Value(1));

  useEffect(() => {
    if (!isCommentsOpen) return;
    sheetY.setValue(sheetHiddenY);
    Animated.parallel([
      Animated.spring(sheetY, {
        bounciness: 0,
        speed: 14,
        toValue: 0,
        useNativeDriver: true
      }),
      Animated.timing(overlayOpacity, {
        duration: OVERLAY_FADE_MS,
        toValue: 0,
        useNativeDriver: true
      })
    ]).start();
    // Opening animates once; later height changes (keyboard) must not replay it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCommentsOpen, overlayOpacity, sheetY]);

  const openComments = () => setIsCommentsOpen(true);

  // The panel resizes between one line and the full text; LayoutAnimation animates that
  // height change without measuring the text.
  const toggleDescription = (expanded: boolean) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsDescriptionExpanded(expanded);
  };

  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    },
    []
  );

  // Stable so the sheet's drag handler isn't rebuilt on every render. The sheet unmounts
  // on a timer matching the slide-out rather than the animation's completion callback.
  const closeComments = useCallback(() => {
    Keyboard.dismiss();
    Animated.parallel([
      Animated.timing(sheetY, {
        duration: SHEET_CLOSE_MS,
        toValue: sheetHiddenY,
        useNativeDriver: true
      }),
      Animated.timing(overlayOpacity, {
        duration: SHEET_CLOSE_MS,
        toValue: 1,
        useNativeDriver: true
      })
    ]).start();
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setIsCommentsOpen(false), SHEET_CLOSE_MS);
  }, [overlayOpacity, sheetHiddenY, sheetY]);

  return (
    <View style={styles.screen} testID="recorda-detail-screen">
      <StatusBar style="light" />
      <FeedGlow />
      <SafeAreaView edges={["top"]} style={styles.content}>
        <View style={styles.header}>
          <View style={styles.backButton}>
            <IconAction
              icon="chevron-left"
              iconSize={BACK_ICON_SIZE}
              label={t("publishedRecorda.back")}
              onPress={onBack}
            />
          </View>
          <AppText style={styles.logo}>{t("feed.logo")}</AppText>
          <View style={styles.headerSpacer} />
        </View>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.content}
        >
          <View
            onLayout={(event) => setMediaHeight(event.nativeEvent.layout.height)}
            style={styles.mediaArea}
          >
            {post.mediaType === "VIDEO" ? (
              <RecordaVideo label={post.description} recordaId={post.id} source={mediaSource} />
            ) : (
              <Image
                accessibilityLabel={post.description}
                contentFit="cover"
                source={mediaSource}
                style={StyleSheet.absoluteFill}
              />
            )}
            <LinearGradient
              colors={[withOpacity(baseColors.black, 0.6), withOpacity(baseColors.black, 0)]}
              pointerEvents="none"
              style={styles.topShade}
            />
            <View style={styles.author}>
              {authorAvatarSource ? (
                <Image source={authorAvatarSource} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarFallback]}>
                  <Icon source="account" size={20} color={colors.neutrals[400]} />
                </View>
              )}
              <View style={styles.authorText}>
                <AppText numberOfLines={1} style={styles.username}>
                  {post.author.username}
                </AppText>
                <AppText numberOfLines={1} style={styles.songLine}>
                  <AppText style={styles.song}>{post.song.title}</AppText>
                  {` · ${post.song.artistName}`}
                </AppText>
              </View>
              <Pressable
                accessibilityLabel={t("feed.more")}
                accessibilityRole="button"
                hitSlop={8}
                onPress={() => setMenu("options")}
                style={styles.moreButton}
              >
                <Icon source="dots-horizontal" size={MORE_ICON_SIZE} color={colors.neutrals[100]} />
              </Pressable>
            </View>
            <Animated.View
              pointerEvents={isCommentsOpen ? "none" : "box-none"}
              style={[StyleSheet.absoluteFill, { opacity: overlayOpacity }]}
              testID="recorda-bottom-overlay"
            >
              <View style={styles.bottomOverlay}>
                <View style={styles.soundSlot}>
                  <RecordaSoundControl hasPreview={Boolean(post.previewUrl)} recordaId={post.id} />
                </View>
                {post.description ? (
                  <View style={styles.descriptionRow} testID="recorda-description">
                    <SmallAvatar source={authorAvatarSource} />
                    {isDescriptionExpanded ? (
                      // Not wrapped in a touchable: the text has to scroll freely, and
                      // collapsing is the chevron's job.
                      <ScrollView
                        showsVerticalScrollIndicator={false}
                        style={[
                          styles.descriptionBody,
                          { maxHeight: mediaHeight * DESCRIPTION_MAX_RATIO || undefined }
                        ]}
                      >
                        <AppText style={styles.comment}>
                          <AppText style={styles.bold}>{post.author.username}</AppText>{" "}
                          {post.description}
                        </AppText>
                      </ScrollView>
                    ) : (
                      <View style={styles.descriptionBody}>
                        {/* Invisible full-width copy: its line count says whether the
                            one-line version is cut off, i.e. whether expanding shows more. */}
                        <AppText
                          accessibilityElementsHidden
                          accessible={false}
                          importantForAccessibility="no-hide-descendants"
                          onTextLayout={(event) =>
                            setCanExpandDescription(event.nativeEvent.lines.length > 1)
                          }
                          pointerEvents="none"
                          style={[styles.comment, styles.descriptionMeasure]}
                          testID="recorda-description-measure"
                        >
                          <AppText style={styles.bold}>{post.author.username}</AppText>{" "}
                          {post.description}
                        </AppText>
                        {canExpandDescription ? (
                          <Pressable
                            accessibilityHint={t("publishedRecorda.expandDescription")}
                            accessibilityRole="button"
                            onPress={() => toggleDescription(true)}
                          >
                            {/* One line; iOS ends it with "…" when the text doesn't fit. */}
                            <AppText ellipsizeMode="tail" numberOfLines={1} style={styles.comment}>
                              <AppText style={styles.bold}>{post.author.username}</AppText>{" "}
                              {post.description}
                            </AppText>
                          </Pressable>
                        ) : (
                          <AppText numberOfLines={1} style={styles.comment}>
                            <AppText style={styles.bold}>{post.author.username}</AppText>{" "}
                            {post.description}
                          </AppText>
                        )}
                      </View>
                    )}
                    {isDescriptionExpanded ? (
                      <Pressable
                        accessibilityLabel={t("publishedRecorda.collapseDescription")}
                        accessibilityRole="button"
                        hitSlop={8}
                        onPress={() => toggleDescription(false)}
                      >
                        <Icon color={colors.neutrals[200]} size={22} source="chevron-down" />
                      </Pressable>
                    ) : null}
                  </View>
                ) : null}
                <View style={styles.actions}>
                  <IconAction
                    label={t("feed.like")}
                    disabled={likeSubmitting}
                    onPress={onLike}
                    selected={liked}
                  >
                    <AnimatedHeart
                      color={colors.primary[500]}
                      liked={liked}
                      size={ACTION_ICON_SIZE}
                    />
                  </IconAction>
                  <IconAction
                    label={t("feed.comment")}
                    icon="message-text-outline"
                    onPress={openComments}
                  />
                  <IconAction
                    label={t("feed.share")}
                    icon="share-variant-outline"
                    onPress={onShare}
                  />
                  <View style={styles.likes}>
                    <Icon source="heart-outline" size={14} color={colors.neutrals[200]} />
                    <AppText numberOfLines={1} style={styles.likesText}>
                      {t("publishedRecorda.likes", { count: post.likesCount + (liked ? 1 : 0) })}
                    </AppText>
                  </View>
                  <AppText style={styles.date}>{post.publishedAt}</AppText>
                </View>
              </View>
            </Animated.View>

            {isCommentsOpen ? (
              <>
                <Pressable
                  accessibilityLabel={t("publishedRecorda.closeComment")}
                  onPress={closeComments}
                  style={[styles.sheetBackdrop, { bottom: sheetHeight + ISLAND_MARGIN }]}
                  testID="comments-backdrop"
                />
                <CommentsSheet
                  comments={post.comments}
                  commentsError={commentsError}
                  commentsLoading={commentsLoading}
                  commentSubmitError={commentSubmitError}
                  commentSubmitting={commentSubmitting}
                  height={sheetHeight}
                  onClose={closeComments}
                  onComment={onComment}
                  onRetryComments={onRetryComments}
                  translateY={sheetY}
                />
              </>
            ) : null}

            <ThirdPartyRecordaMenu
              isOwnPost={isOwnPost}
              menu={menu}
              onClose={() => setMenu(null)}
              onReport={onReport}
            />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
      <BottomTabBar activeTab="feed" onPress={onTabPress} />
      <OwnRecordaMenu
        deleteError={deleteError}
        deleteSubmitting={deleteSubmitting}
        isOwnPost={isOwnPost}
        menu={menu}
        onClose={() => setMenu(null)}
        onDelete={onDelete}
        onRequestDelete={() => setMenu("delete")}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.neutrals[900], overflow: "hidden" },
  content: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing[3]
  },
  headerSpacer: { minWidth: 48 },
  // Bai Jamjuree reserves tall line metrics and "recorda." is all lowercase, so the logo's
  // glyphs sit below its box's center; nudging the chevron down lines their centers up.
  backButton: { transform: [{ translateY: 4 }] },
  logo: {
    color: colors.primary[500],
    fontFamily: fontFamily.display.boldItalic,
    fontSize: 28
  },
  iconButton: { minWidth: 48, minHeight: 48, alignItems: "center", justifyContent: "center" },
  hiddenVideo: { opacity: 0 },
  videoPlaceholder: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    backgroundColor: colors.neutrals[800],
    justifyContent: "center"
  },
  mediaArea: {
    flex: 1,
    backgroundColor: colors.neutrals[800],
    borderRadius: radius.lg,
    marginBottom: spacing[2],
    marginHorizontal: spacing[2],
    overflow: "hidden"
  },
  topShade: { position: "absolute", top: 0, left: 0, right: 0, height: 110 },
  // Same panel as the comments sheet; grows with the expanded description.
  bottomOverlay: {
    backgroundColor: PANEL_BACKGROUND,
    borderRadius: radius.lg,
    bottom: ISLAND_MARGIN,
    left: ISLAND_MARGIN,
    paddingTop: spacing[3],
    position: "absolute",
    right: ISLAND_MARGIN
  },
  author: {
    position: "absolute",
    top: spacing[3],
    left: spacing[3],
    right: spacing[3],
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2]
  },
  authorText: { flex: 1 },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  avatarFallback: {
    backgroundColor: colors.neutrals[800],
    alignItems: "center",
    justifyContent: "center"
  },
  username: { color: colors.neutrals[100], fontFamily: fontFamily.primary.bold, fontSize: 16 },
  songLine: { color: colors.neutrals[100], fontSize: 12 },
  song: { color: colors.primary[500], fontFamily: fontFamily.primary.bold, fontSize: 12 },
  moreButton: { alignSelf: "flex-start" },
  // Hangs from the three-dots button: same top/right inset as the author row, one icon lower.
  popover: {
    backgroundColor: colors.neutrals[800],
    borderRadius: radius.lg,
    paddingVertical: spacing[1],
    position: "absolute",
    right: spacing[3],
    top: spacing[3] + MORE_ICON_SIZE + spacing[1]
  },
  popoverItem: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing[2],
    minHeight: 48,
    paddingHorizontal: spacing[4]
  },
  popoverLabel: { color: colors.neutrals[200], fontFamily: fontFamily.display.medium },
  popoverDestructive: { color: colors.error[200] },
  // Sits just above the bottom overlay, whatever height the description gives it.
  soundSlot: {
    height: 56,
    position: "absolute",
    right: 0,
    top: -56,
    width: 56
  },
  actions: {
    alignItems: "center",
    flexDirection: "row",
    height: ACTION_STRIP_HEIGHT,
    paddingHorizontal: spacing[2]
  },
  likes: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[1],
    marginLeft: spacing[1]
  },
  likesText: { color: colors.neutrals[100], fontSize: 12, flexShrink: 1 },
  date: { color: colors.neutrals[200], fontSize: 12, marginHorizontal: spacing[2] },
  descriptionRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing[2],
    paddingHorizontal: spacing[3]
  },
  descriptionBody: { flex: 1, paddingTop: 6 },
  descriptionMeasure: { left: 0, opacity: 0, position: "absolute", right: 0, top: 6 },
  bold: { color: colors.neutrals[100], fontFamily: fontFamily.primary.bold },
  text: { color: colors.neutrals[100] },
  muted: { color: colors.neutrals[300] },
  comment: { color: colors.neutrals[100], fontSize: 14 },
  sheetBackdrop: { left: 0, position: "absolute", right: 0, top: 0 },
  sheet: {
    backgroundColor: PANEL_BACKGROUND,
    borderRadius: radius.lg,
    bottom: ISLAND_MARGIN,
    left: ISLAND_MARGIN,
    overflow: "hidden",
    position: "absolute",
    right: ISLAND_MARGIN
  },
  sheetHeader: {
    alignItems: "center",
    gap: spacing[2],
    paddingBottom: spacing[2],
    paddingTop: spacing[2]
  },
  sheetGrip: {
    backgroundColor: withOpacity(baseColors.white, 0.35),
    borderRadius: 2,
    height: 4,
    width: 40
  },
  commentListContainer: { flex: 1 },
  commentRow: { alignItems: "flex-start", flexDirection: "row", gap: spacing[2] },
  smallAvatar: { borderRadius: 16, height: 32, width: 32 },
  commentText: { flex: 1, paddingTop: spacing[1] },
  commentList: { gap: spacing[2], paddingBottom: spacing[2], paddingHorizontal: spacing[4] },
  submitError: { color: colors.error[200], paddingHorizontal: spacing[4] },
  composer: {
    alignItems: "center",
    borderTopColor: withOpacity(baseColors.white, 0.12),
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: spacing[2],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2]
  },
  input: {
    backgroundColor: withOpacity(baseColors.white, 0.08),
    borderRadius: radius.md,
    color: colors.neutrals[100],
    flex: 1,
    maxHeight: 100,
    minHeight: 40,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2]
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

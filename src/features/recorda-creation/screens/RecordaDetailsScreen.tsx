import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useVideoPlayer, VideoView } from "expo-video";
import { useTranslation } from "react-i18next";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  TouchableWithoutFeedback,
  View
} from "react-native";
import { Button, IconButton, Text, TextInput } from "react-native-paper";

import { Screen } from "@/components/ui";
import type { RootStackParamList } from "@/app/navigation/RootNavigator";
import { usePublishRecorda, type PublishRecordaDraft } from "@/features/recorda-publish";
import {
  baseColors,
  colors,
  fontFamily,
  radius,
  semanticColors,
  spacing,
  typography
} from "@/theme";

import { useRecordaDraft } from "../context/RecordaDraftContext";
import { mockRecordaDraft } from "../mocks/recordaDraft";
import type { RecordaDraft, RecordaDraftMedia } from "../types";

const DESCRIPTION_MAX_LENGTH = 2200;

type RecordaDetailsScreenProps = {
  draft?: RecordaDraft;
  onPublish?: (draft: RecordaDraft) => void;
  onShare?: (draft: RecordaDraft) => void;
};

export function RecordaDetailsScreen({ draft, onPublish, onShare }: RecordaDetailsScreenProps) {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { clearMedia, media: storedMedia } = useRecordaDraft();
  const publishFlow = usePublishRecorda();
  const handledSuccessRef = useRef(false);
  const currentDraft = useMemo<RecordaDraft>(
    () => draft ?? { ...mockRecordaDraft, media: storedMedia ?? mockRecordaDraft.media },
    [draft, storedMedia]
  );
  const [description, setDescription] = useState(currentDraft.description);
  const [coverLoadFailed, setCoverLoadFailed] = useState(false);
  const videoPlayer = useVideoPlayer(currentDraft.media?.uri ?? "");
  const isPublishing = publishFlow.status === "uploading" || publishFlow.status === "creating";
  const canPublish = Boolean(currentDraft.media && currentDraft.song);

  useEffect(() => {
    if (onPublish || publishFlow.status !== "success" || handledSuccessRef.current) {
      return;
    }

    handledSuccessRef.current = true;
    clearMedia();
    setDescription("");
    Alert.alert(t("recordaDetails.publishSuccessTitle"), t("recordaDetails.publishSuccessMessage"));
    navigation.reset({
      index: 0,
      routes: [{ name: "Profile" }]
    });
  }, [clearMedia, navigation, onPublish, publishFlow.status, t]);

  function getCurrentDraft(): RecordaDraft {
    return { ...currentDraft, description };
  }

  async function handlePublish() {
    const draftToPublish = getCurrentDraft();

    if (onPublish) {
      onPublish(draftToPublish);
      return;
    }

    const publishDraft = toPublishRecordaDraft(draftToPublish);

    if (!publishDraft) {
      return;
    }

    if (publishFlow.status === "error") {
      await publishFlow.retry(publishDraft);
      return;
    }

    await publishFlow.publish(publishDraft);
  }

  function handleShare() {
    const currentDraft = getCurrentDraft();

    if (onShare) {
      onShare(currentDraft);
      return;
    }

    const message = [
      currentDraft.song?.title,
      currentDraft.song?.artistName,
      currentDraft.description
    ]
      .filter(Boolean)
      .join("\n");

    void Share.share({ message });
  }

  return (
    <Screen
      contentContainerStyle={styles.content}
      style={styles.screen}
      testID="recorda-details-screen"
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoiding}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.header}>
              <IconButton
                accessibilityLabel={t("recordaDetails.back")}
                icon={({ color, size }) => (
                  <Ionicons color={color} name="chevron-back" size={size} />
                )}
                iconColor={baseColors.white}
                onPress={() => navigation.goBack()}
                size={32}
                style={styles.backButton}
              />
              <Text
                ellipsizeMode="tail"
                numberOfLines={1}
                style={styles.headerTitle}
                variant="titleMedium"
              >
                {t("recordaDetails.descriptionLabel")}
              </Text>
              <View style={styles.headerSpacer} />
            </View>
            <View style={styles.mediaStage}>
              {currentDraft.media ? (
                currentDraft.media.type === "video" ? (
                  <VideoView
                    accessibilityLabel={t("recordaDetails.mediaSelected")}
                    contentFit="cover"
                    nativeControls={false}
                    player={videoPlayer}
                    style={styles.media}
                    testID="recorda-details-video"
                  />
                ) : (
                  <Image
                    accessibilityLabel={t("recordaDetails.mediaSelected")}
                    source={{ uri: currentDraft.media.uri }}
                    style={styles.media}
                    testID="recorda-details-media"
                  />
                )
              ) : (
                <View style={styles.mediaUnavailable} testID="recorda-details-media">
                  <Text>{t("recordaDetails.mediaUnavailable")}</Text>
                </View>
              )}

              <View style={styles.mediaOverlay} testID="recorda-details-media-overlay" />

              {currentDraft.song ? (
                <View style={styles.song}>
                  {currentDraft.song.coverUrl && !coverLoadFailed ? (
                    <Image
                      accessibilityLabel={t("recordaDetails.songCover")}
                      onError={() => setCoverLoadFailed(true)}
                      source={{ uri: currentDraft.song.coverUrl }}
                      style={styles.songCover}
                      testID="recorda-details-song-cover"
                    />
                  ) : (
                    <View
                      accessibilityLabel={t("recordaDetails.songCover")}
                      style={[styles.songCover, styles.songCoverPlaceholder]}
                      testID="recorda-details-song-cover"
                    />
                  )}
                  <Text style={styles.songTitle} variant="titleMedium">
                    {currentDraft.song.title}
                  </Text>
                  <Text style={styles.songArtist} variant="bodySmall">
                    {currentDraft.song.artistName}
                  </Text>
                </View>
              ) : null}
            </View>

            <View style={styles.bottomArea}>
              <TextInput
                accessibilityLabel={t("recordaDetails.descriptionLabel")}
                contentStyle={styles.descriptionContent}
                cursorColor={semanticColors.actionPrimary}
                maxLength={DESCRIPTION_MAX_LENGTH}
                multiline
                onChangeText={(text) => setDescription(text.slice(0, DESCRIPTION_MAX_LENGTH))}
                placeholder={t("recordaDetails.descriptionPlaceholder")}
                placeholderTextColor="rgba(255, 255, 255, 0.6)"
                selectionColor={semanticColors.actionPrimary}
                style={styles.description}
                textColor={baseColors.white}
                underlineColor="transparent"
                activeUnderlineColor="transparent"
                value={description}
              />

              <View style={styles.actions}>
                <IconButton
                  accessibilityLabel={t("recordaDetails.share")}
                  disabled={!currentDraft.song}
                  icon={({ color, size }) => (
                    <Ionicons color={color} name="share-social-outline" size={size} />
                  )}
                  iconColor={styles.shareIcon.color}
                  mode="outlined"
                  onPress={handleShare}
                  size={32}
                  style={styles.shareButton}
                />
                <Button
                  contentStyle={styles.publishContent}
                  disabled={!canPublish || isPublishing}
                  loading={isPublishing}
                  mode="contained"
                  onPress={handlePublish}
                  style={styles.publishButton}
                >
                  {getPublishLabel(publishFlow.status, t)}
                </Button>
              </View>

              {publishFlow.error ? (
                <Text
                  accessibilityLiveRegion="polite"
                  style={styles.publishError}
                  testID="recorda-publish-error"
                  variant="bodySmall"
                >
                  {publishFlow.error.message}
                </Text>
              ) : null}
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  actions: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing[4]
  },
  bottomArea: {
    backgroundColor: colors.neutrals[900],
    gap: spacing[4],
    paddingHorizontal: spacing[6],
    paddingTop: spacing[4],
    paddingBottom: spacing[6]
  },
  content: {
    backgroundColor: colors.neutrals[900],
    padding: 0
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing[1],
    height: 64,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2]
  },
  backButton: {
    margin: 0,
    width: 48
  },
  headerSpacer: {
    width: 48
  },
  headerTitle: {
    ...typography.headline4,
    color: colors.secondary[100],
    fontFamily: fontFamily.primary.bold,
    flex: 1,
    lineHeight: 27,
    overflow: "hidden",
    textAlign: "center"
  },
  keyboardAvoiding: {
    flex: 1
  },
  media: {
    ...StyleSheet.absoluteFill,
    height: undefined,
    width: undefined
  },
  mediaUnavailable: {
    alignItems: "center",
    backgroundColor: colors.neutrals[900],
    flex: 1,
    justifyContent: "center",
    width: "100%"
  },
  mediaStage: {
    flex: 1,
    minHeight: 0,
    position: "relative"
  },
  mediaOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: baseColors.black,
    opacity: 0.45
  },
  publishButton: {
    borderRadius: radius.full,
    flex: 1
  },
  publishContent: {
    minHeight: 58
  },
  publishError: {
    color: colors.error[200],
    textAlign: "center"
  },
  screen: {
    backgroundColor: colors.neutrals[900]
  },
  scrollContent: {
    flexGrow: 1
  },
  shareButton: {
    borderColor: semanticColors.actionPrimary,
    borderRadius: radius.full,
    flexBasis: 56,
    height: 56,
    margin: 0,
    width: 56
  },
  shareIcon: {
    color: semanticColors.actionPrimary
  },
  description: {
    backgroundColor: "transparent",
    minHeight: 64,
    paddingHorizontal: 0,
    paddingVertical: 0
  },
  descriptionContent: {
    color: baseColors.white,
    fontFamily: fontFamily.display.medium,
    fontSize: 16,
    letterSpacing: 0.15,
    lineHeight: 21,
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 0,
    textAlignVertical: "top"
  },
  song: {
    alignItems: "center",
    left: 0,
    paddingHorizontal: spacing[6],
    position: "absolute",
    right: 0,
    top: spacing[6]
  },
  songArtist: {
    color: colors.neutrals[100],
    fontFamily: fontFamily.display.medium,
    fontSize: 12,
    marginTop: spacing[1]
  },
  songCover: {
    borderRadius: radius.md,
    height: 80,
    marginBottom: spacing[4],
    width: 80
  },
  songCoverPlaceholder: {
    backgroundColor: colors.neutrals[700]
  },
  songTitle: {
    color: colors.neutrals[100],
    fontFamily: fontFamily.display.semiBold,
    fontSize: 20,
    textAlign: "center"
  }
});

function toPublishRecordaDraft(draft: RecordaDraft): PublishRecordaDraft | null {
  if (!draft.media || !draft.song) {
    return null;
  }

  const mediaType = draft.media.type === "video" ? "VIDEO" : "PHOTO";

  return {
    description: draft.description || undefined,
    media: {
      fileName: getMediaFileName(draft.media, mediaType),
      mimeType: mediaType === "VIDEO" ? "video/mp4" : "image/jpeg",
      type: mediaType,
      uri: draft.media.uri
    },
    song: {
      artistName: draft.song.artistName,
      coverUrl: draft.song.coverUrl,
      deezerTrackId: draft.song.deezerTrackId,
      previewUrl: draft.song.previewUrl ?? undefined,
      title: draft.song.title
    }
  };
}

function getMediaFileName(
  media: RecordaDraftMedia,
  mediaType: PublishRecordaDraft["media"]["type"]
) {
  const fallback = mediaType === "VIDEO" ? "recorda.mp4" : "recorda.jpg";
  const pathWithoutQuery = media.uri.split("?")[0];
  const fileName = pathWithoutQuery.split("/").filter(Boolean).pop();

  return fileName && fileName.includes(".") ? fileName : fallback;
}

function getPublishLabel(status: string, t: ReturnType<typeof useTranslation>["t"]) {
  if (status === "uploading") {
    return t("recordaDetails.publishUploading");
  }

  if (status === "creating") {
    return t("recordaDetails.publishCreating");
  }

  if (status === "error") {
    return t("recordaDetails.publishRetry");
  }

  return t("recordaDetails.publish");
}

import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import * as ImageManipulator from "expo-image-manipulator";
import { Image } from "expo-image";
import { createVideoPlayer, type VideoThumbnail } from "expo-video";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Image as RNImage,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import ViewShot, { type ViewShotRef } from "react-native-view-shot";
import { Icon } from "react-native-paper";

import type { RootStackParamList } from "@/app/navigation/RootNavigator";
import { AppText } from "@/components/ui";
import {
  saveCardToGallery,
  shareCardToInstagramStories
} from "@/features/share/services/cardExport";
import { baseColors, colors, fontFamily, radius, spacing, withOpacity } from "@/theme";

type PresetId = "light" | "mint" | "teal" | "dark";
type MediaSource = string | VideoThumbnail;

type Preset = {
  id: PresetId;
  swatch: string;
  card: [string, string, string];
};

const PRESETS: Preset[] = [
  { id: "light", swatch: "#CCF9EE", card: ["#CCF9EE", "#66EECB", "#44C9A8"] },
  { id: "mint", swatch: "#66EECB", card: ["#66EECB", "#00C896", "#00A07A"] },
  { id: "teal", swatch: "#00E2A9", card: ["#00E2A9", "#00B587", "#008F6A"] },
  { id: "dark", swatch: "#006B4F", card: ["#008865", "#004D39", "#003328"] }
];

const GLOW_SOURCE = require("@/assets/images/glow.png");

// Export canvas size (Full HD portrait)
const EXPORT_W = 1080;
const EXPORT_H = 1920;

// Photo dimensions in the preview (photoWrap)
const PHOTO_PREVIEW_W = 250;
const PHOTO_PREVIEW_H = 325;

// Scale factor: how many export pixels per 1 preview pixel
const EXPORT_SCALE = EXPORT_W / 375;

// Photo dimensions in the export canvas, proportional to preview
const EXPORT_PHOTO_W = Math.round(PHOTO_PREVIEW_W * EXPORT_SCALE * 1.2);
const EXPORT_PHOTO_H = Math.round(PHOTO_PREVIEW_H * EXPORT_SCALE * 1.2);
const CARD_PREVIEW_H = 480;
const CARD_PREVIEW_W = 275;
const PHOTO_PREVIEW_FIXED_H = 325;
const PHOTO_PREVIEW_FIXED_W = 250;
const NON_PREVIEW_CONTENT_H = 300;

function showFeedback(title: string, message: string) {
  if (Platform.OS === "web") {
    window.alert(`${title}\n${message}`);
    return;
  }

  Alert.alert(title, message);
}

async function createWebVideoThumbnail(mediaUri: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.crossOrigin = "anonymous";
    video.muted = true;
    video.preload = "auto";

    const cleanup = () => {
      video.removeEventListener("loadeddata", handleLoadedData);
      video.removeEventListener("error", handleError);
      video.removeAttribute("src");
      video.load();
    };

    const handleLoadedData = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext("2d");
        if (!context || canvas.width === 0 || canvas.height === 0) {
          throw new Error("Video frame is unavailable");
        }
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const thumbnail = canvas.toDataURL("image/png");
        cleanup();
        resolve(thumbnail);
      } catch (error) {
        cleanup();
        reject(error);
      }
    };

    const handleError = () => {
      cleanup();
      reject(new Error("Unable to load the video frame"));
    };

    video.addEventListener("loadeddata", handleLoadedData, { once: true });
    video.addEventListener("error", handleError, { once: true });
    video.src = mediaUri;
    video.load();
  });
}

async function createVideoThumbnail(mediaUri: string): Promise<MediaSource> {
  if (Platform.OS === "web") {
    return createWebVideoThumbnail(mediaUri);
  }

  const player = createVideoPlayer(mediaUri);
  try {
    const [thumbnail] = await player.generateThumbnailsAsync(0);
    if (!thumbnail) {
      throw new Error("Video frame is unavailable");
    }
    return thumbnail;
  } finally {
    player.release();
  }
}

export function ShareCardScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, "ShareCard">>();
  const { mediaUri, mediaType, songTitle, artistName, coverUrl } = route.params;
  const { height, width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const [selectedPreset, setSelectedPreset] = useState<PresetId>("teal");
  const [isExporting, setIsExporting] = useState(false);
  const [videoThumbnail, setVideoThumbnail] = useState<{
    mediaUri: string;
    source: MediaSource;
  } | null>(null);
  const [failedVideoUri, setFailedVideoUri] = useState<string | null>(null);
  const [capturedMediaSource, setCapturedMediaSource] = useState<MediaSource | null>(null);

  const exportRef = useRef<ViewShotRef>(null);
  const exportInProgress = useRef(false);

  const previewHeight = Math.min(
    CARD_PREVIEW_H,
    Math.max(280, height - insets.top - insets.bottom - NON_PREVIEW_CONTENT_H)
  );
  const previewScale = previewHeight / CARD_PREVIEW_H;
  const preset = PRESETS.find((p) => p.id === selectedPreset) ?? PRESETS[1];
  const isMediaLoading =
    mediaType === "video" && videoThumbnail?.mediaUri !== mediaUri && failedVideoUri !== mediaUri;
  const previewMediaSource =
    mediaType === "video"
      ? videoThumbnail?.mediaUri === mediaUri
        ? videoThumbnail.source
        : null
      : mediaUri;

  useEffect(() => {
    if (mediaType !== "video") {
      return;
    }

    let isCurrent = true;

    void createVideoThumbnail(mediaUri)
      .then((thumbnail) => {
        if (isCurrent) {
          setVideoThumbnail({ mediaUri, source: thumbnail });
        }
      })
      .catch((error) => {
        console.error("Video thumbnail error:", error);
        if (isCurrent) {
          setFailedVideoUri(mediaUri);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [mediaType, mediaUri]);

  async function handleExport(action: "stories" | "save") {
    if (exportInProgress.current) return;
    if (!exportRef.current) {
      showFeedback(
        t(action === "stories" ? "shareCard.shareErrorTitle" : "shareCard.saveErrorTitle"),
        t(action === "stories" ? "shareCard.shareErrorMessage" : "shareCard.saveErrorMessage")
      );
      return;
    }

    exportInProgress.current = true;
    setIsExporting(true);
    try {
      let mediaSource: MediaSource | null = null;
      if (mediaType === "video") {
        mediaSource = videoThumbnail?.mediaUri === mediaUri ? videoThumbnail.source : null;
        if (!mediaSource) {
          mediaSource = await createVideoThumbnail(mediaUri);
          setVideoThumbnail({ mediaUri, source: mediaSource });
          setFailedVideoUri(null);
        }
      } else if (mediaUri) {
        // Crop the photo to match the preview's cover fit at 250×325.
        const { width: imgW, height: imgH } = await new Promise<{ width: number; height: number }>(
          (resolve, reject) =>
            RNImage.getSize(mediaUri, (w, h) => resolve({ width: w, height: h }), reject)
        );

        const targetAspect = PHOTO_PREVIEW_W / PHOTO_PREVIEW_H;
        const imgAspect = imgW / imgH;

        let cropX: number, cropY: number, cropW: number, cropH: number;
        if (imgAspect > targetAspect) {
          cropH = imgH;
          cropW = Math.round(imgH * targetAspect);
          cropX = Math.round((imgW - cropW) / 2);
          cropY = 0;
        } else {
          cropW = imgW;
          cropH = Math.round(imgW / targetAspect);
          cropX = 0;
          cropY = Math.round((imgH - cropH) / 2);
        }

        const result = await ImageManipulator.manipulateAsync(
          mediaUri,
          [{ crop: { originX: cropX, originY: cropY, width: cropW, height: cropH } }],
          { compress: 1, format: ImageManipulator.SaveFormat.PNG }
        );
        mediaSource = result.uri;
      }

      // Update the export canvas before capturing it.
      setCapturedMediaSource(mediaSource);
      await new Promise<void>((resolve) => setTimeout(resolve, 150));

      // Capture the export canvas at 1080×1920.
      const exportUri = await exportRef.current.capture();
      if (action === "stories") {
        const result = await shareCardToInstagramStories(exportUri);
        showFeedback(
          t(result === "shared" ? "shareCard.storiesOpenedTitle" : "shareCard.fallbackTitle"),
          t(
            result === "shared"
              ? "shareCard.storiesOpenedMessage"
              : Platform.OS === "web"
                ? "shareCard.webFallbackMessage"
                : "shareCard.fallbackMessage"
          )
        );
      } else {
        const result = await saveCardToGallery(exportUri);
        showFeedback(
          t(result === "saved" ? "shareCard.savedTitle" : "shareCard.permissionDeniedTitle"),
          t(result === "saved" ? "shareCard.savedMessage" : "shareCard.permissionDeniedMessage")
        );
      }
    } catch (error) {
      console.error("Card export error:", error);
      showFeedback(
        t(action === "stories" ? "shareCard.shareErrorTitle" : "shareCard.saveErrorTitle"),
        t(action === "stories" ? "shareCard.shareErrorMessage" : "shareCard.saveErrorMessage")
      );
    } finally {
      setCapturedMediaSource(null);
      exportInProgress.current = false;
      setIsExporting(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen} testID="share-card-screen">
      <StatusBar style="light" />

      {/* Radial green glow centered on screen */}
      <View style={styles.background} pointerEvents="none">
        <RNImage
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          resizeMode="contain"
          source={GLOW_SOURCE}
          style={[
            styles.glow,
            {
              width: width * 2.1,
              height: width * 2.1,
              top: height / 2 - (width * 2.1) / 2,
              left: width / 2 - (width * 2.1) / 2
            }
          ]}
        />
      </View>

      {/* Header */}
      <View style={styles.header}>
        <Pressable
          accessibilityLabel={t("shareCard.back")}
          accessibilityRole="button"
          hitSlop={12}
          onPress={() => navigation.goBack()}
          style={styles.headerAction}
        >
          <Icon color={colors.neutrals[100]} size={32} source="chevron-left" />
        </Pressable>
        <AppText style={styles.headerTitle} variant="headline4">
          {t("shareCard.title")}
        </AppText>
        <View style={styles.headerAction} />
      </View>

      {/* Subtitle */}
      <AppText style={styles.subtitle} variant="headline4">
        {t("shareCard.subtitle")}
      </AppText>

      {/* Preview area — visual only, not exported */}
      <View style={[styles.previewArea, { height: previewHeight }]}>
        <View
          style={[styles.card, { height: previewHeight, width: CARD_PREVIEW_W * previewScale }]}
        >
          <LinearGradient
            colors={preset.card}
            end={{ x: 1, y: 1 }}
            start={{ x: 0, y: 0 }}
            style={[StyleSheet.absoluteFill, { borderRadius: 28 }]}
          />
          <LinearGradient
            colors={preset.card}
            end={{ x: 0.5, y: 1 }}
            locations={[0, 0.5, 1]}
            start={{ x: 0.5, y: 0 }}
            style={[styles.cardRect, { borderRadius: 24 }]}
          />
          <View
            style={[
              styles.photoWrap,
              {
                height: PHOTO_PREVIEW_FIXED_H * previewScale,
                width: PHOTO_PREVIEW_FIXED_W * previewScale
              }
            ]}
          >
            {previewMediaSource ? (
              <Image contentFit="cover" source={previewMediaSource} style={styles.photo} />
            ) : (
              <View style={[styles.photo, styles.photoFallback]} />
            )}
            {isMediaLoading ? (
              <ActivityIndicator color={colors.neutrals[100]} style={styles.mediaLoading} />
            ) : null}
            <LinearGradient
              colors={[withOpacity(baseColors.black, 0), withOpacity(baseColors.black, 0.85)]}
              locations={[0.5, 1]}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.songRow}>
              {coverUrl ? (
                <Image contentFit="cover" source={coverUrl} style={styles.cover} />
              ) : (
                <View style={[styles.cover, styles.coverFallback]}>
                  <Icon color={colors.neutrals[100]} size={20} source="music-note" />
                </View>
              )}
              <View style={styles.songText}>
                <AppText numberOfLines={1} style={styles.songTitle}>
                  {songTitle}
                </AppText>
                <AppText numberOfLines={1} style={styles.artistName}>
                  {artistName}
                </AppText>
              </View>
            </View>
            <AppText style={styles.logoText}>recorda.</AppText>
          </View>
        </View>
      </View>

      {/* Preset selectors */}
      <ScrollView
        contentContainerStyle={styles.presetsContent}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.presets}
        testID="share-card-presets"
      >
        {PRESETS.map((p) => (
          <View
            key={p.id}
            style={[styles.presetGlow, selectedPreset === p.id && styles.presetGlowActive]}
          >
            <Pressable
              accessibilityRole="radio"
              accessibilityState={{ checked: selectedPreset === p.id }}
              onPress={() => setSelectedPreset(p.id)}
              style={[styles.presetItem, selectedPreset === p.id && styles.presetItemSelected]}
            >
              <LinearGradient
                colors={p.card}
                end={{ x: 0.5, y: 1 }}
                locations={[0, 0.5, 1]}
                start={{ x: 0.5, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
            </Pressable>
          </View>
        ))}
      </ScrollView>

      <View style={styles.actionRow}>
        <Pressable
          accessibilityRole="button"
          disabled={isExporting || isMediaLoading}
          onPress={() => void handleExport("stories")}
          style={[
            styles.shareButton,
            (isExporting || isMediaLoading) && styles.shareButtonDisabled
          ]}
        >
          {isExporting || isMediaLoading ? (
            <ActivityIndicator color={colors.neutrals[900]} size="small" />
          ) : (
            <AppText style={styles.shareButtonLabel} variant="buttonLarge">
              {t("shareCard.instagramStories")}
            </AppText>
          )}
        </Pressable>
        <Pressable
          accessibilityRole="button"
          disabled={isExporting || isMediaLoading}
          onPress={() => void handleExport("save")}
          style={[
            styles.downloadButton,
            (isExporting || isMediaLoading) && styles.shareButtonDisabled
          ]}
        >
          <AppText style={styles.downloadButtonLabel} variant="buttonLarge">
            {t("shareCard.download")}
          </AppText>
        </Pressable>
      </View>

      {/* Off-screen export canvas — 1080×1920 */}
      <View style={styles.exportContainer} pointerEvents="none">
        <ViewShot
          ref={exportRef}
          options={{
            format: "png",
            quality: 1,
            result: Platform.OS === "web" ? "data-uri" : "tmpfile"
          }}
          style={styles.exportCanvas}
        >
          <LinearGradient
            colors={preset.card}
            end={{ x: 0.5, y: 1 }}
            locations={[0, 0.35, 1]}
            start={{ x: 0.5, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
          <LinearGradient
            colors={[withOpacity(baseColors.black, 0), withOpacity(baseColors.black, 0.4)]}
            end={{ x: 0.5, y: 1 }}
            start={{ x: 0.5, y: 0 }}
            style={StyleSheet.absoluteFill}
          />

          {capturedMediaSource ? (
            <View style={styles.exportPhotoWrap}>
              <Image
                contentFit="cover"
                source={capturedMediaSource}
                style={StyleSheet.absoluteFill}
              />
              <LinearGradient
                colors={[withOpacity(baseColors.black, 0), withOpacity(baseColors.black, 0.85)]}
                locations={[0.5, 1]}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.exportSongRow}>
                {coverUrl ? (
                  <RNImage
                    source={{ uri: coverUrl }}
                    style={styles.exportCover}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={[styles.exportCover, styles.exportCoverFallback]} />
                )}
                <View style={styles.exportSongText}>
                  <AppText numberOfLines={1} style={styles.exportSongTitle}>
                    {songTitle}
                  </AppText>
                  <AppText numberOfLines={1} style={styles.exportArtistName}>
                    {artistName}
                  </AppText>
                </View>
              </View>
              <AppText style={styles.exportLogoText}>recorda.</AppText>
            </View>
          ) : null}
        </ViewShot>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  actionRow: {
    flexDirection: "row",
    gap: spacing[3],
    marginBottom: spacing[3],
    marginHorizontal: spacing[4],
    marginTop: spacing[12]
  },
  artistName: {
    color: withOpacity(baseColors.white, 0.85),
    fontFamily: fontFamily.primary.regular,
    fontSize: 9
  },
  background: {
    bottom: 0,
    left: 0,
    overflow: "hidden",
    position: "absolute",
    right: 0,
    top: 0
  },
  card: {
    alignItems: "center",
    borderRadius: 28,
    justifyContent: "center"
  },
  cardRect: {
    borderRadius: radius.lg,
    height: "100%",
    left: "50%",
    position: "absolute",
    top: "50%",
    transform: [{ translateX: "-50%" }, { translateY: "-50%" }],
    width: "100%"
  },
  cover: {
    borderRadius: radius.sm,
    height: 44,
    width: 44
  },
  coverFallback: {
    alignItems: "center",
    backgroundColor: withOpacity(baseColors.black, 0.3),
    justifyContent: "center"
  },
  downloadButton: {
    alignItems: "center",
    borderColor: colors.primary[500],
    borderRadius: radius.full,
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
    minHeight: 58,
    paddingHorizontal: spacing[2]
  },
  downloadButtonLabel: {
    color: colors.primary[500],
    fontSize: 14,
    textAlign: "center"
  },
  exportArtistName: {
    color: withOpacity(baseColors.white, 0.85),
    fontFamily: fontFamily.primary.regular,
    fontSize: Math.round(9 * EXPORT_SCALE)
  },
  exportCanvas: {
    alignItems: "center",
    height: EXPORT_H,
    justifyContent: "center",
    width: EXPORT_W
  },
  exportContainer: {
    height: EXPORT_H,
    left: -EXPORT_W * 2,
    position: "absolute",
    top: 0,
    width: EXPORT_W
  },
  exportCover: {
    borderRadius: Math.round(radius.sm * EXPORT_SCALE),
    height: Math.round(44 * EXPORT_SCALE),
    width: Math.round(44 * EXPORT_SCALE)
  },
  exportCoverFallback: {
    backgroundColor: withOpacity(baseColors.black, 0.3)
  },
  exportLogoText: {
    bottom: Math.round(spacing[4] * EXPORT_SCALE),
    color: colors.neutrals[200],
    fontFamily: fontFamily.display.boldItalic,
    fontSize: Math.round(12 * EXPORT_SCALE),
    left: Math.round(spacing[4] * EXPORT_SCALE),
    position: "absolute"
  },
  exportPhotoWrap: {
    borderRadius: Math.round(17 * EXPORT_SCALE),
    height: EXPORT_PHOTO_H,
    overflow: "hidden",
    width: EXPORT_PHOTO_W
  },
  exportSongRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: Math.round(spacing[3] * EXPORT_SCALE),
    padding: Math.round(spacing[3] * EXPORT_SCALE)
  },
  exportSongText: {
    flex: 1
  },
  exportSongTitle: {
    color: baseColors.white,
    fontFamily: fontFamily.primary.bold,
    fontSize: Math.round(11 * EXPORT_SCALE)
  },
  glow: {
    opacity: 0.75,
    position: "absolute"
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    height: 64,
    justifyContent: "space-between",
    paddingHorizontal: spacing[4]
  },
  headerAction: {
    justifyContent: "center",
    width: 48
  },
  headerTitle: {
    color: colors.neutrals[100],
    fontFamily: fontFamily.primary.semiBold
  },
  logoText: {
    bottom: spacing[4],
    color: colors.neutrals[200],
    fontFamily: fontFamily.display.boldItalic,
    fontSize: 12,
    left: spacing[4],
    position: "absolute"
  },
  mediaLoading: {
    alignSelf: "center",
    position: "absolute",
    top: "45%"
  },
  photo: {
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0
  },
  photoFallback: {
    backgroundColor: withOpacity(baseColors.black, 0.35)
  },
  photoWrap: {
    borderRadius: 17,
    elevation: 12,
    overflow: "hidden",
    position: "relative",
    shadowColor: baseColors.black,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 16
  },
  presetGlow: {
    borderRadius: 11
  },
  presetGlowActive: {
    shadowColor: baseColors.white,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 10
  },
  presetItem: {
    borderRadius: 11,
    height: 50,
    overflow: "hidden",
    width: 50
  },
  presetItemSelected: {
    borderColor: baseColors.white,
    borderWidth: 1.5
  },
  presets: {
    height: 50,
    marginTop: spacing[6]
  },
  presetsContent: {
    alignItems: "center",
    flexDirection: "row",
    flexGrow: 1,
    gap: spacing[3],
    justifyContent: "center",
    paddingHorizontal: spacing[4]
  },
  previewArea: {
    alignItems: "center",
    flexGrow: 0,
    flexShrink: 0,
    justifyContent: "center",
    paddingHorizontal: spacing[6],
    position: "relative"
  },
  screen: {
    backgroundColor: colors.neutrals[900],
    flex: 1
  },
  shareButton: {
    alignItems: "center",
    backgroundColor: colors.primary[500],
    borderRadius: radius.full,
    flex: 1,
    justifyContent: "center",
    minHeight: 58,
    paddingHorizontal: spacing[2]
  },
  shareButtonDisabled: {
    opacity: 0.7
  },
  shareButtonLabel: {
    color: colors.neutrals[900],
    fontSize: 14,
    textAlign: "center"
  },
  songRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing[3],
    padding: spacing[3]
  },
  songText: {
    flex: 1
  },
  songTitle: {
    color: baseColors.white,
    fontFamily: fontFamily.primary.bold,
    fontSize: 11
  },
  subtitle: {
    color: colors.neutrals[100],
    fontFamily: fontFamily.primary.bold,
    paddingBottom: spacing[2],
    paddingHorizontal: spacing[4],
    paddingTop: spacing[2],
    textAlign: "center"
  }
});

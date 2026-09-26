import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import * as ImageManipulator from "expo-image-manipulator";
import * as Sharing from "expo-sharing";
import { Image } from "expo-image";
import { StatusBar } from "expo-status-bar";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Image as RNImage,
  Platform,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ViewShot, { type ViewShotRef } from "react-native-view-shot";
import { Icon } from "react-native-paper";

import type { RootStackParamList } from "@/app/navigation/RootNavigator";
import { AppText } from "@/components/ui";
import { baseColors, colors, fontFamily, radius, spacing, withOpacity } from "@/theme";

type PresetId = "light" | "mint" | "teal" | "dark";

type Preset = {
  id: PresetId;
  swatch: string;
  card: [string, string, string];
};

const PRESETS: Preset[] = [
  { id: "light", swatch: "#CCF9EE", card: ["#CCF9EE", "#66EECB", "#44C9A8"] },
  { id: "mint",  swatch: "#66EECB", card: ["#66EECB", "#00C896", "#00A07A"] },
  { id: "teal",  swatch: "#00E2A9", card: ["#00E2A9", "#00B587", "#008F6A"] },
  { id: "dark",  swatch: "#006B4F", card: ["#008865", "#004D39", "#003328"] }
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

export function ShareCardScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, "ShareCard">>();
  const { mediaUri, songTitle, artistName, coverUrl } = route.params;
  const { height, width } = useWindowDimensions();

  const [selectedPreset, setSelectedPreset] = useState<PresetId>("teal");
  const [isSharing, setIsSharing] = useState(false);
  const [capturedPhotoUri, setCapturedPhotoUri] = useState<string | null>(null);

  const exportRef = useRef<ViewShotRef>(null);

  const preset = PRESETS.find((p) => p.id === selectedPreset) ?? PRESETS[2];

  async function handleShare() {
    if (isSharing) return;
    if (!exportRef.current) {
      Alert.alert("Erro", "Ref não disponível");
      return;
    }

    setIsSharing(true);
    try {
      // Step 1: crop the original photo to match contentFit="cover" at 250×325 ratio
      let croppedUri: string | null = null;
      if (mediaUri) {
        const { width: imgW, height: imgH } = await new Promise<{ width: number; height: number }>(
          (resolve, reject) => RNImage.getSize(mediaUri, (w, h) => resolve({ width: w, height: h }), reject)
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
        croppedUri = result.uri;
      }

      // Step 2: set cropped photo and wait for exportRef to re-render
      setCapturedPhotoUri(croppedUri);
      await new Promise<void>((resolve) => setTimeout(resolve, 150));

      // Step 3: capture the export canvas (1080×1920)
      const exportUri = await exportRef.current.capture();
      setCapturedPhotoUri(null);

      if (Platform.OS === "web") {
        const link = document.createElement("a");
        link.href = exportUri;
        link.download = "recorda.png";
        link.click();
        return;
      }

      await Sharing.shareAsync(exportUri, {
        mimeType: "image/png",
        dialogTitle: t("shareCard.shareDialogTitle")
      });
    } catch (error) {
      console.error("Share error:", error);
      setCapturedPhotoUri(null);
      Alert.alert(t("shareCard.shareErrorTitle"), t("shareCard.shareErrorMessage"));
    } finally {
      setIsSharing(false);
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
      <View style={styles.previewArea}>
        <View style={styles.card}>
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
          <View style={styles.photoWrap}>
            {mediaUri ? (
              <Image contentFit="cover" source={mediaUri} style={styles.photo} />
            ) : (
              <View style={[styles.photo, styles.photoFallback]} />
            )}
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
      <View style={styles.presets}>
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
      </View>

      {/* Share button */}
      <Pressable
        accessibilityRole="button"
        disabled={isSharing}
        onPress={() => void handleShare()}
        style={[styles.shareButton, isSharing && styles.shareButtonDisabled]}
      >
        {isSharing ? (
          <ActivityIndicator color={colors.neutrals[900]} size="small" />
        ) : (
          <AppText style={styles.shareButtonLabel} variant="buttonLarge">
            {t("shareCard.share")}
          </AppText>
        )}
      </Pressable>

      {/* Off-screen export canvas — 1080×1920 */}
      <View style={styles.exportContainer} pointerEvents="none">
        <ViewShot
          ref={exportRef}
          options={{ format: "png", quality: 1, result: Platform.OS === "web" ? "data-uri" : "tmpfile" }}
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
            colors={[withOpacity(baseColors.black, 0), withOpacity(baseColors.black, 0.40)]}
            end={{ x: 0.5, y: 1 }}
            start={{ x: 0.5, y: 0 }}
            style={StyleSheet.absoluteFill}
          />

          {capturedPhotoUri ? (
            <View style={styles.exportPhotoWrap}>
              <RNImage
                source={{ uri: capturedPhotoUri }}
                style={StyleSheet.absoluteFill}
                resizeMode="cover"
              />
              <LinearGradient
                colors={[withOpacity(baseColors.black, 0), withOpacity(baseColors.black, 0.85)]}
                locations={[0.5, 1]}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.exportSongRow}>
                {coverUrl ? (
                  <RNImage source={{ uri: coverUrl }} style={styles.exportCover} resizeMode="cover" />
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
    height: 480,
    justifyContent: "center",
    width: 275
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
    height: 325,
    overflow: "hidden",
    position: "relative",
    shadowColor: baseColors.black,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    width: 250
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
    flexDirection: "row",
    gap: spacing[3],
    justifyContent: "center",
    marginBottom: spacing[0],
    marginTop: spacing[8],
    paddingHorizontal: spacing[4],
    paddingTop: spacing[2]
  },
  previewArea: {
    alignItems: "center",
    flex: 0.85,
    justifyContent: "center",
    paddingBottom: spacing[4],
    paddingHorizontal: spacing[6],
    paddingTop: spacing[10],
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
    justifyContent: "center",
    marginBottom: spacing[6],
    marginHorizontal: spacing[4],
    marginTop: "auto",
    minHeight: 58
  },
  shareButtonDisabled: {
    opacity: 0.7
  },
  shareButtonLabel: {
    color: colors.neutrals[900]
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
    paddingBottom: spacing[8],
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
    textAlign: "center"
  }
});

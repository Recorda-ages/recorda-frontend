import { type ComponentRef, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  BackHandler,
  PixelRatio,
  Pressable,
  StyleSheet,
  View
} from "react-native";
import { Icon } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppText } from "@/components/ui";
import { baseColors, colors, fontFamily, radius, spacing, withOpacity } from "@/theme";

import {
  POSTER_EXPORT_WIDTH,
  type RetrospectiveExportAction,
  useRetrospectiveExport
} from "../hooks/useRetrospectiveExport";
import {
  POSTER_ASPECT_RATIO,
  type RetrospectiveSummary,
  RetrospectiveSummaryPoster
} from "./RetrospectiveSummaryPoster";

type RetrospectiveSummaryCardProps = Readonly<{
  onFinish: () => void;
  summary: RetrospectiveSummary;
}>;

/**
 * Final retrospective slide: the celebration poster, plus sharing it (Instagram Stories,
 * system share menu or gallery) and finishing the retrospective.
 */
export function RetrospectiveSummaryCard({ onFinish, summary }: RetrospectiveSummaryCardProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const posterRef = useRef<ComponentRef<typeof View>>(null);
  const { exportPoster, pendingAction } = useRetrospectiveExport(posterRef);
  const [area, setArea] = useState<{ height: number; width: number } | null>(null);
  const [isShareMenuOpen, setShareMenuOpen] = useState(false);
  const isExporting = pendingAction !== null;
  const previewWidth = area ? Math.min(area.width, area.height * POSTER_ASPECT_RATIO) : 0;
  // Laid out in dp so the capture comes out at exactly POSTER_EXPORT_WIDTH pixels.
  const exportWidth = POSTER_EXPORT_WIDTH / PixelRatio.get();

  function handleShareAction(action: RetrospectiveExportAction) {
    setShareMenuOpen(false);
    void exportPoster(action);
  }

  return (
    <View style={styles.container} testID="retrospective-summary">
      <View
        onLayout={(event) => {
          const { height, width } = event.nativeEvent.layout;
          setArea({ height, width });
        }}
        style={styles.previewArea}
        testID="retrospective-summary-preview-area"
      >
        {previewWidth > 0 ? (
          <RetrospectiveSummaryPoster
            rounded
            summary={summary}
            testID="retrospective-summary-poster"
            width={previewWidth}
          />
        ) : null}
      </View>

      <View style={[styles.actions, { paddingBottom: insets.bottom + spacing[4] }]}>
        <Pressable
          accessibilityLabel={t("retrospectiveSummary.share")}
          accessibilityRole="button"
          accessibilityState={{ busy: isExporting, disabled: isExporting }}
          disabled={isExporting}
          hitSlop={4}
          onPress={() => setShareMenuOpen(true)}
          style={({ pressed }) => [styles.shareButton, pressed && styles.pressed]}
          testID="retrospective-summary-share"
        >
          {isExporting ? (
            <ActivityIndicator color={colors.primary[500]} size="small" />
          ) : (
            <Icon color={colors.primary[500]} size={24} source="share-variant" />
          )}
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={onFinish}
          style={({ pressed }) => [styles.finishButton, pressed && styles.pressed]}
          testID="retrospective-summary-finish"
        >
          <AppText style={styles.finishLabel} variant="buttonLarge">
            {t("retrospectiveSummary.finish")}
          </AppText>
        </Pressable>
      </View>

      {/* Off-screen copy that is captured, so the PNG never depends on the preview size. */}
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        pointerEvents="none"
        style={[styles.exportContainer, { left: -exportWidth * 2 }]}
      >
        <View collapsable={false} ref={posterRef} testID="retrospective-summary-export">
          <RetrospectiveSummaryPoster
            summary={summary}
            testID="retrospective-summary-export-poster"
            width={exportWidth}
          />
        </View>
      </View>

      {isShareMenuOpen ? (
        <ShareMenu
          bottomInset={insets.bottom}
          onClose={() => setShareMenuOpen(false)}
          onSelect={handleShareAction}
        />
      ) : null}
    </View>
  );
}

const SHARE_OPTIONS: readonly {
  action: RetrospectiveExportAction;
  icon: string;
  labelKey: string;
}[] = [
  { action: "stories", icon: "instagram", labelKey: "retrospectiveSummary.instagramStories" },
  { action: "share", icon: "share-variant", labelKey: "retrospectiveSummary.moreOptions" },
  { action: "save", icon: "download", labelKey: "retrospectiveSummary.saveToGallery" }
];

function ShareMenu({
  bottomInset,
  onClose,
  onSelect
}: Readonly<{
  bottomInset: number;
  onClose: () => void;
  onSelect: (action: RetrospectiveExportAction) => void;
}>) {
  const { t } = useTranslation();

  // Rendered inline (not in a Modal) so the native share sheet never opens while a
  // modal is still dismissing; the back button closes it like one.
  useEffect(() => {
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      onClose();
      return true;
    });
    return () => subscription.remove();
  }, [onClose]);

  return (
    <View style={StyleSheet.absoluteFill} testID="retrospective-summary-share-menu">
      <Pressable
        accessibilityLabel={t("retrospectiveSummary.cancel")}
        onPress={onClose}
        style={[StyleSheet.absoluteFill, styles.backdrop]}
        testID="retrospective-summary-share-backdrop"
      />
      <View style={[styles.sheet, { paddingBottom: bottomInset + spacing[4] }]}>
        <AppText style={styles.sheetTitle} variant="buttonLarge">
          {t("retrospectiveSummary.shareOptionsTitle")}
        </AppText>
        {SHARE_OPTIONS.map((option) => (
          <Pressable
            accessibilityRole="button"
            key={option.action}
            onPress={() => onSelect(option.action)}
            style={({ pressed }) => [styles.sheetOption, pressed && styles.sheetOptionPressed]}
            testID={`retrospective-summary-share-${option.action}`}
          >
            <Icon color={colors.primary[500]} size={22} source={option.icon} />
            <AppText style={styles.sheetOptionLabel}>{t(option.labelKey)}</AppText>
          </Pressable>
        ))}
        <Pressable
          accessibilityRole="button"
          onPress={onClose}
          style={({ pressed }) => [styles.sheetCancel, pressed && styles.pressed]}
          testID="retrospective-summary-share-cancel"
        >
          <AppText style={styles.sheetCancelLabel} variant="buttonLarge">
            {t("retrospectiveSummary.cancel")}
          </AppText>
        </Pressable>
      </View>
    </View>
  );
}

const ACTION_HEIGHT = 56;

const styles = StyleSheet.create({
  actions: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing[4],
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4]
  },
  backdrop: {
    backgroundColor: withOpacity(baseColors.black, 0.6)
  },
  container: {
    flex: 1
  },
  exportContainer: {
    position: "absolute",
    top: 0
  },
  finishButton: {
    alignItems: "center",
    backgroundColor: colors.primary[500],
    borderRadius: radius.full,
    flex: 1,
    height: ACTION_HEIGHT,
    justifyContent: "center"
  },
  finishLabel: {
    color: colors.neutrals[900]
  },
  pressed: {
    opacity: 0.8
  },
  previewArea: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    marginHorizontal: spacing[4]
  },
  shareButton: {
    alignItems: "center",
    borderColor: colors.primary[500],
    borderRadius: radius.full,
    borderWidth: 1.5,
    height: ACTION_HEIGHT,
    justifyContent: "center",
    width: ACTION_HEIGHT
  },
  sheet: {
    backgroundColor: colors.neutrals[800],
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    bottom: 0,
    gap: spacing[1],
    left: 0,
    paddingHorizontal: spacing[4],
    paddingTop: spacing[5],
    position: "absolute",
    right: 0
  },
  sheetCancel: {
    alignItems: "center",
    borderColor: colors.neutrals[600],
    borderRadius: radius.full,
    borderWidth: 1,
    justifyContent: "center",
    marginTop: spacing[3],
    minHeight: 48
  },
  sheetCancelLabel: {
    color: colors.neutrals[100]
  },
  sheetOption: {
    alignItems: "center",
    borderRadius: radius.lg,
    flexDirection: "row",
    gap: spacing[3],
    minHeight: 52,
    paddingHorizontal: spacing[3]
  },
  sheetOptionLabel: {
    color: colors.neutrals[100],
    fontFamily: fontFamily.display.medium,
    fontSize: 16
  },
  sheetOptionPressed: {
    backgroundColor: withOpacity(baseColors.white, 0.06)
  },
  sheetTitle: {
    color: baseColors.white,
    marginBottom: spacing[2],
    paddingHorizontal: spacing[3]
  }
});

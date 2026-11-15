import { File } from "expo-file-system";
import { type ComponentRef, type RefObject, useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, type AlertButton, Linking, Platform, type View } from "react-native";
import { captureRef } from "react-native-view-shot";

import {
  saveCardToGallery,
  shareCardGeneric,
  shareCardToInstagramStories
} from "@/features/share/services/cardExport";

/** Full HD portrait (9:16), the size Instagram Stories expects. */
export const POSTER_EXPORT_WIDTH = 1080;
export const POSTER_EXPORT_HEIGHT = 1920;

export type RetrospectiveExportAction = "stories" | "share" | "save";

const CAPTURE_OPTIONS = {
  format: "png",
  height: POSTER_EXPORT_HEIGHT,
  quality: 1,
  result: Platform.OS === "web" ? "data-uri" : "tmpfile",
  width: POSTER_EXPORT_WIDTH
} as const;

function notify(title: string, message: string, buttons?: AlertButton[]) {
  if (Platform.OS === "web") {
    window.alert(`${title}\n${message}`);
    return;
  }

  Alert.alert(title, message, buttons);
}

function deleteTemporaryFile(uri: string) {
  if (!uri.startsWith("file://")) return;
  try {
    new File(uri).delete();
  } catch {
    // Already gone: nothing to clean up.
  }
}

/**
 * Captures the retrospective poster as a PNG and hands it to Instagram Stories, the
 * system share menu or the gallery, telling the user how each attempt ended.
 */
export function useRetrospectiveExport(posterRef: RefObject<ComponentRef<typeof View> | null>) {
  const { t } = useTranslation();
  const [pendingAction, setPendingAction] = useState<RetrospectiveExportAction | null>(null);
  const inProgress = useRef(false);

  const exportPoster = useCallback(
    async (action: RetrospectiveExportAction) => {
      if (inProgress.current) return;
      inProgress.current = true;
      setPendingAction(action);

      try {
        if (!posterRef.current) throw new Error("The retrospective poster is not mounted.");
        const uri = await captureRef(posterRef, CAPTURE_OPTIONS);

        if (action === "stories") {
          const result = await shareCardToInstagramStories(uri);
          if (result === "fallback") {
            notify(
              t("retrospectiveSummary.fallbackTitle"),
              t(
                Platform.OS === "web"
                  ? "retrospectiveSummary.webFallbackMessage"
                  : "retrospectiveSummary.fallbackMessage"
              )
            );
          }
        } else if (action === "share") {
          await shareCardGeneric(uri);
        } else {
          const result = await saveCardToGallery(uri);
          if (result === "saved") {
            // The gallery keeps its own copy. Shared files are left to the OS cache,
            // because the receiving app may still be reading them.
            deleteTemporaryFile(uri);
            notify(t("retrospectiveSummary.savedTitle"), t("retrospectiveSummary.savedMessage"));
          } else {
            notify(
              t("retrospectiveSummary.permissionDeniedTitle"),
              t("retrospectiveSummary.permissionDeniedMessage"),
              [
                { style: "cancel", text: t("retrospectiveSummary.cancel") },
                {
                  onPress: () => void Linking.openSettings().catch(() => undefined),
                  text: t("retrospectiveSummary.openSettings")
                }
              ]
            );
          }
        }
      } catch (error) {
        console.error("Retrospective poster export error:", error);
        const isSave = action === "save";
        notify(
          t(
            isSave ? "retrospectiveSummary.saveErrorTitle" : "retrospectiveSummary.shareErrorTitle"
          ),
          t(
            isSave
              ? "retrospectiveSummary.saveErrorMessage"
              : "retrospectiveSummary.shareErrorMessage"
          )
        );
      } finally {
        inProgress.current = false;
        setPendingAction(null);
      }
    },
    [posterRef, t]
  );

  return { exportPoster, pendingAction };
}

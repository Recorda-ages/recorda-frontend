import * as MediaLibrary from "expo-media-library";
import * as Sharing from "expo-sharing";
import { Linking, Platform } from "react-native";
import type { Social } from "react-native-share";

const INSTAGRAM_ANDROID_PACKAGE = "com.instagram.android";
const INSTAGRAM_STORIES_SCHEME = "instagram-stories://share";

function downloadCard(uri: string) {
  if (typeof document === "undefined") {
    throw new Error("Card downloads are unavailable outside a browser.");
  }

  const anchor = document.createElement("a");
  anchor.href = uri;
  anchor.download = "recorda-card.png";
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

export async function shareCardGeneric(uri: string): Promise<void> {
  if (Platform.OS === "web") {
    downloadCard(uri);
    return;
  }

  if (!(await Sharing.isAvailableAsync())) {
    throw new Error("System sharing is unavailable on this device.");
  }

  await Sharing.shareAsync(uri, {
    mimeType: "image/png",
    UTI: "public.png",
    dialogTitle: "Share Recorda card"
  });
}

export async function shareCardToInstagramStories(uri: string): Promise<"shared" | "fallback"> {
  if (Platform.OS === "web") {
    downloadCard(uri);
    return "fallback";
  }

  const appId = process.env.EXPO_PUBLIC_META_APP_ID?.trim();
  if (!appId) {
    await shareCardGeneric(uri);
    return "fallback";
  }

  let isInstagramAvailable = false;
  let Share: typeof import("react-native-share").default;
  try {
    ({ default: Share } = await import("react-native-share"));
  } catch {
    await shareCardGeneric(uri);
    return "fallback";
  }

  if (Platform.OS === "android") {
    try {
      ({ isInstalled: isInstagramAvailable } =
        await Share.isPackageInstalled(INSTAGRAM_ANDROID_PACKAGE));
    } catch {
      // The targeted native module may be unavailable in a preview runtime such as Expo Go.
      await shareCardGeneric(uri);
      return "fallback";
    }
  } else if (Platform.OS === "ios") {
    isInstagramAvailable = await Linking.canOpenURL(INSTAGRAM_STORIES_SCHEME);
  }

  if (!isInstagramAvailable) {
    await shareCardGeneric(uri);
    return "fallback";
  }

  const result = await Share.shareSingle({
    appId,
    backgroundImage: uri,
    social: "instagramstories" as Social
  });
  if (!result.success) {
    throw new Error(result.message || "Instagram Stories did not open.");
  }
  return "shared";
}

export async function saveCardToGallery(uri: string): Promise<"saved" | "permission-denied"> {
  if (Platform.OS === "web") {
    downloadCard(uri);
    return "saved";
  }

  const permission = await MediaLibrary.requestPermissionsAsync(true, ["photo"]);
  if (!permission.granted) return "permission-denied";

  await MediaLibrary.Asset.create(uri);
  return "saved";
}

import { Image as ExpoImage } from "expo-image";
import { Image as RNImage } from "react-native";

/** Background glow used from the very first screens (splash, auth, onboarding, feed). */
const STARTUP_IMAGES = [require("@/assets/images/glow.png")];

/** Past this the app starts anyway: a slow network must never hold it on the splash. */
export const IMAGE_PRELOAD_TIMEOUT_MS = 3000;

/**
 * Warms the image caches while the native splash is still up. In development the
 * bundled images are served by Metro over the network on first use, which made the
 * first screens' backgrounds pop in late. Both caches are warmed because screens use
 * both React Native's `Image` and expo-image's. Never rejects.
 */
export async function preloadStartupImages() {
  const uris = STARTUP_IMAGES.map((image) => RNImage.resolveAssetSource(image).uri);
  const preload = Promise.allSettled(
    uris.flatMap((uri) => [RNImage.prefetch(uri), ExpoImage.prefetch(uri)])
  );
  const timeout = new Promise<void>((resolve) => setTimeout(resolve, IMAGE_PRELOAD_TIMEOUT_MS));
  await Promise.race([preload, timeout]);
}

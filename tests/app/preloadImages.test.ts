import { Image as ExpoImage } from "expo-image";
import { Image as RNImage, Platform } from "react-native";

import { IMAGE_PRELOAD_TIMEOUT_MS, preloadStartupImages } from "@/app/preloadImages";

describe("preloadStartupImages", () => {
  it("starts on web without invoking the unavailable native asset resolver", async () => {
    const platform = jest.replaceProperty(Platform, "OS", "web");
    const resolver = jest.spyOn(RNImage, "resolveAssetSource").mockImplementation(() => {
      throw new Error("native resolver unavailable");
    });
    await expect(preloadStartupImages()).resolves.toBeUndefined();
    expect(resolver).not.toHaveBeenCalled();
    platform.restore();
  });
  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it("warms both image caches with the startup background", async () => {
    const rnPrefetch = jest.spyOn(RNImage, "prefetch").mockResolvedValue(true);
    const expoPrefetch = jest.spyOn(ExpoImage, "prefetch").mockResolvedValue(true);

    await preloadStartupImages();

    expect(rnPrefetch).toHaveBeenCalledTimes(1);
    expect(expoPrefetch).toHaveBeenCalledWith(rnPrefetch.mock.calls[0][0]);
  });

  it("never rejects when prefetching fails", async () => {
    jest.spyOn(RNImage, "prefetch").mockRejectedValue(new Error("offline"));
    jest.spyOn(ExpoImage, "prefetch").mockRejectedValue(new Error("offline"));

    await expect(preloadStartupImages()).resolves.toBeUndefined();
  });

  it("clears the fallback timer when preloading finishes", async () => {
    jest.useFakeTimers();
    jest.spyOn(RNImage, "prefetch").mockResolvedValue(true);
    jest.spyOn(ExpoImage, "prefetch").mockResolvedValue(true);
    await preloadStartupImages();
    expect(jest.getTimerCount()).toBe(0);
  });

  it("gives up waiting after the timeout", async () => {
    jest.useFakeTimers();
    jest.spyOn(RNImage, "prefetch").mockReturnValue(new Promise(() => {}));
    jest.spyOn(ExpoImage, "prefetch").mockReturnValue(new Promise(() => {}));
    let done = false;

    void preloadStartupImages().then(() => {
      done = true;
    });
    await jest.advanceTimersByTimeAsync(IMAGE_PRELOAD_TIMEOUT_MS);

    expect(done).toBe(true);
  });
});

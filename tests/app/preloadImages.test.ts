import { Image as ExpoImage } from "expo-image";
import { Image as RNImage } from "react-native";

import { IMAGE_PRELOAD_TIMEOUT_MS, preloadStartupImages } from "@/app/preloadImages";

describe("preloadStartupImages", () => {
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

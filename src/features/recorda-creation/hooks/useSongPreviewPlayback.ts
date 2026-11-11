import { type AudioPlayer, useAudioPlayer } from "expo-audio";
import { useEffect, useState } from "react";

import { authApiClient, isApiUrl } from "@/services/api";

function loadPreview(player: AudioPlayer, url: string) {
  player.replace(url);
  player.loop = true;
}

function applyMuted(player: AudioPlayer, muted: boolean) {
  player.muted = muted;
}

export function useSongPreviewPlayback(previewUrl: string | null, active: boolean, muted: boolean) {
  const player = useAudioPlayer();
  const [loadedUrl, setLoadedUrl] = useState<string | null>(null);
  const ready = previewUrl !== null && loadedUrl === previewUrl;

  useEffect(() => {
    if (!previewUrl) return;
    let cancelled = false;
    const resolved = isApiUrl(previewUrl)
      ? authApiClient
          .get<{ preview_url: string }>(previewUrl)
          .then((response) => response.preview_url)
      : Promise.resolve(previewUrl);
    resolved
      .then((url) => {
        if (cancelled) return;
        loadPreview(player, url);
        setLoadedUrl(previewUrl);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [player, previewUrl]);

  useEffect(() => {
    applyMuted(player, muted);
  }, [muted, player]);

  useEffect(() => {
    try {
      if (active && ready) player.play();
      else player.pause();
    } catch {
      return;
    }
  }, [active, player, ready]);

  return { hasPreview: previewUrl !== null };
}

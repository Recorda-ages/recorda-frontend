import { type AudioPlayer, useAudioPlayer } from "expo-audio";
import { useCallback, useEffect, useRef, useState } from "react";

import { authApiClient, isApiUrl } from "@/services/api";

type Playing = Readonly<{ stopToken: number; url: string }>;

function loadPreview(player: AudioPlayer, url: string) {
  player.replace(url);
  player.loop = true;
}

export function useFavoriteSongPreview(previewUrl: string | null, stopToken = 0) {
  const player = useAudioPlayer();
  const [playing, setPlaying] = useState<Playing | null>(null);
  const loadedUrl = useRef<string | null>(null);
  const wantedUrl = useRef<string | null>(null);
  const isPlaying =
    previewUrl !== null && playing?.url === previewUrl && playing.stopToken === stopToken;

  useEffect(() => {
    if (isPlaying) return;
    wantedUrl.current = null;
    try {
      player.pause();
    } catch {
      return;
    }
  }, [isPlaying, player]);

  const toggle = useCallback(async () => {
    if (!previewUrl) return;
    if (isPlaying) {
      setPlaying(null);
      return;
    }
    wantedUrl.current = previewUrl;
    setPlaying({ stopToken, url: previewUrl });
    try {
      if (loadedUrl.current !== previewUrl) {
        const resolved = isApiUrl(previewUrl)
          ? (await authApiClient.get<{ preview_url: string }>(previewUrl)).preview_url
          : previewUrl;
        if (wantedUrl.current !== previewUrl) return;
        loadPreview(player, resolved);
        loadedUrl.current = previewUrl;
      }
      if (wantedUrl.current === previewUrl) player.play();
    } catch {
      setPlaying((current) => (current?.url === previewUrl ? null : current));
    }
  }, [isPlaying, player, previewUrl, stopToken]);

  return { canPlay: Boolean(previewUrl), isPlaying, toggle };
}

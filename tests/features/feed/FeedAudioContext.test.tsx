import { act, renderHook } from "@testing-library/react-native";
import { AppState } from "react-native";

import {
  FeedAudioProvider,
  useFeedAudioActions,
  useFeedAudioMuted,
  useFeedFocusKey
} from "@/features/feed/state/FeedAudioContext";
import { authApiClient } from "@/services/api";

import { mockAudioPlayer, resetAudioMock } from "../../mocks/expoAudio";

const PREVIEW = "https://cdn.example.com/preview-1.mp3";
const OTHER_PREVIEW = "https://cdn.example.com/preview-2.mp3";

function renderProvider() {
  const { result } = renderHook(
    () => ({
      ...useFeedAudioActions(),
      focusKey: useFeedFocusKey(),
      isMuted: useFeedAudioMuted()
    }),
    { wrapper: FeedAudioProvider }
  );
  return result;
}

beforeEach(() => {
  resetAudioMock();
});

describe("FeedAudioContext", () => {
  // US16: "Somente uma Recorda pode reproduzir áudio por vez."
  it("swaps the source instead of stacking players when the focused card changes", () => {
    const api = renderProvider();

    act(() => api.current.setActivePreview("recorda-1", PREVIEW));
    act(() => api.current.setActivePreview("recorda-2", OTHER_PREVIEW));

    expect(mockAudioPlayer.replace).toHaveBeenNthCalledWith(1, PREVIEW);
    expect(mockAudioPlayer.replace).toHaveBeenNthCalledWith(2, OTHER_PREVIEW);
    expect(api.current.focusKey).toBe("recorda-2");
  });

  it("moves focus between cards of the same Recorda without restarting its song", () => {
    const api = renderProvider();

    act(() => api.current.setActivePreview("recorda-1", PREVIEW, { focusKey: "geral:recorda-1" }));
    mockAudioPlayer.replace.mockClear();
    act(() =>
      api.current.setActivePreview("recorda-1", PREVIEW, { focusKey: "following:recorda-1" })
    );

    expect(api.current.focusKey).toBe("following:recorda-1");
    expect(mockAudioPlayer.replace).not.toHaveBeenCalled();
  });

  it("leaves the feed card focused when its details re-activate the same Recorda", () => {
    const api = renderProvider();

    act(() => api.current.setActivePreview("recorda-1", PREVIEW, { focusKey: "geral:recorda-1" }));
    act(() => api.current.setActivePreview("recorda-1", PREVIEW));

    expect(api.current.focusKey).toBe("geral:recorda-1");
  });

  it("retries once when the loaded song reports it isn't playing", () => {
    const api = renderProvider();
    act(() => api.current.setActivePreview("recorda-1", PREVIEW));
    mockAudioPlayer.play.mockClear();

    act(() => mockAudioPlayer.emitStatus({ isLoaded: true, playing: false }));
    act(() => mockAudioPlayer.emitStatus({ isLoaded: true, playing: false }));

    expect(mockAudioPlayer.play).toHaveBeenCalledTimes(1);
  });

  it("doesn't restart a song that was meant to stay paused", () => {
    const api = renderProvider();
    act(() => api.current.setActivePreview("recorda-1", PREVIEW));
    act(() => api.current.setActiveRoute("Camera"));
    mockAudioPlayer.play.mockClear();

    act(() => mockAudioPlayer.emitStatus({ isLoaded: true, playing: false }));

    expect(mockAudioPlayer.play).not.toHaveBeenCalled();
  });

  // US16: "Preview de 30 segundos deve entrar em loop enquanto o card estiver em foco."
  it("loops the preview and starts playing when a card takes focus", () => {
    const api = renderProvider();

    act(() => api.current.setActivePreview("recorda-1", PREVIEW));

    expect(mockAudioPlayer.loop).toBe(true);
    expect(mockAudioPlayer.play).toHaveBeenCalled();
  });

  describe("previews served by the API", () => {
    const API_PREVIEW = "/api/v1/music/tracks/3135556/preview";
    const FRESH_LINK = "https://cdnt-preview.dzcdn.net/fresh.mp3";

    afterEach(() => jest.restoreAllMocks());

    it("fetches the fresh Deezer link and plays that, not the API route", async () => {
      const get = jest.spyOn(authApiClient, "get").mockResolvedValue({ preview_url: FRESH_LINK });
      const api = renderProvider();

      await act(async () => api.current.setActivePreview("recorda-1", API_PREVIEW));

      expect(get).toHaveBeenCalledWith(API_PREVIEW);
      expect(mockAudioPlayer.replace).toHaveBeenLastCalledWith(FRESH_LINK);
      expect(mockAudioPlayer.replace).not.toHaveBeenCalledWith(API_PREVIEW);
      expect(mockAudioPlayer.play).toHaveBeenCalled();
    });

    it("drops a link that arrives after another card took focus", async () => {
      let resolveFirst!: (value: { preview_url: string }) => void;
      jest
        .spyOn(authApiClient, "get")
        .mockReturnValueOnce(
          new Promise((resolve) => {
            resolveFirst = resolve;
          })
        )
        .mockResolvedValueOnce({ preview_url: FRESH_LINK });
      const api = renderProvider();

      act(() => api.current.setActivePreview("recorda-1", API_PREVIEW));
      await act(async () => api.current.setActivePreview("recorda-2", API_PREVIEW));
      await act(async () => resolveFirst({ preview_url: "https://stale.example/old.mp3" }));

      expect(mockAudioPlayer.replace).toHaveBeenLastCalledWith(FRESH_LINK);
      expect(mockAudioPlayer.replace).not.toHaveBeenCalledWith("https://stale.example/old.mp3");
    });

    it("stays silent when the preview can't be fetched", async () => {
      jest.spyOn(authApiClient, "get").mockRejectedValue(new Error("404"));
      const api = renderProvider();

      await act(async () => api.current.setActivePreview("recorda-1", API_PREVIEW));

      expect(mockAudioPlayer.replace).not.toHaveBeenCalled();
      expect(mockAudioPlayer.play).not.toHaveBeenCalled();
    });

    it("never hands the native player an empty source", async () => {
      jest.spyOn(authApiClient, "get").mockResolvedValue({ preview_url: FRESH_LINK });
      const api = renderProvider();

      await act(async () => api.current.setActivePreview("recorda-1", API_PREVIEW));

      expect(mockAudioPlayer.replace).not.toHaveBeenCalledWith(null);
    });

    it("keeps the previous song paused while the next link is fetched", async () => {
      let resolveLink!: (value: { preview_url: string }) => void;
      jest.spyOn(authApiClient, "get").mockReturnValue(
        new Promise((resolve) => {
          resolveLink = resolve;
        })
      );
      const api = renderProvider();
      act(() => api.current.setActivePreview("recorda-1", PREVIEW));
      mockAudioPlayer.play.mockClear();
      mockAudioPlayer.pause.mockClear();

      act(() => api.current.setActivePreview("recorda-2", API_PREVIEW));
      expect(mockAudioPlayer.pause).toHaveBeenCalled();
      expect(mockAudioPlayer.play).not.toHaveBeenCalled();

      await act(async () => resolveLink({ preview_url: FRESH_LINK }));
      expect(mockAudioPlayer.replace).toHaveBeenLastCalledWith(FRESH_LINK);
      expect(mockAudioPlayer.play).toHaveBeenCalled();
    });

    it("plays external links directly without calling the API", () => {
      const get = jest.spyOn(authApiClient, "get");
      const api = renderProvider();

      act(() => api.current.setActivePreview("recorda-1", PREVIEW));

      expect(get).not.toHaveBeenCalled();
      expect(mockAudioPlayer.replace).toHaveBeenCalledWith(PREVIEW);
    });
  });

  it("holds a video Recorda's song until its video is ready", () => {
    const api = renderProvider();

    act(() => api.current.setActivePreview("recorda-1", PREVIEW, { waitForMedia: true }));
    expect(mockAudioPlayer.replace).toHaveBeenCalledWith(PREVIEW);
    expect(mockAudioPlayer.play).not.toHaveBeenCalled();

    act(() => api.current.setMediaReady("recorda-1", true));
    expect(mockAudioPlayer.play).toHaveBeenCalled();
  });

  it("plays at once when the focused video had already loaded", () => {
    const api = renderProvider();

    act(() => api.current.setMediaReady("recorda-1", true));
    act(() => api.current.setActivePreview("recorda-1", PREVIEW, { waitForMedia: true }));

    expect(mockAudioPlayer.play).toHaveBeenCalled();
  });

  it("keeps a Recorda ready while any view still has its video loaded", () => {
    const api = renderProvider();

    act(() => api.current.setMediaReady("recorda-1", true, "feed-card"));
    act(() => api.current.setMediaReady("recorda-1", true, "details"));
    // Leaving the details screen withdraws only its own report.
    act(() => api.current.setMediaReady("recorda-1", false, "details"));
    act(() => api.current.setActivePreview("recorda-1", PREVIEW, { waitForMedia: true }));

    expect(mockAudioPlayer.play).toHaveBeenCalled();
  });

  it("ignores readiness reported by a video that isn't the one being waited on", () => {
    const api = renderProvider();

    act(() => api.current.setActivePreview("recorda-1", PREVIEW, { waitForMedia: true }));
    act(() => api.current.setMediaReady("recorda-2", true));

    expect(mockAudioPlayer.play).not.toHaveBeenCalled();
  });

  it("does not restart the preview when the same card stays in focus", () => {
    const api = renderProvider();

    act(() => api.current.setActivePreview("recorda-1", PREVIEW));
    mockAudioPlayer.replace.mockClear();
    act(() => api.current.setActivePreview("recorda-1", PREVIEW));

    expect(mockAudioPlayer.replace).not.toHaveBeenCalled();
  });

  // US16: "Recorda sem preview deve mostrar Fallback Visual" — nada deve tocar.
  it("stops playback for a Recorda without a preview", () => {
    const api = renderProvider();

    act(() => api.current.setActivePreview("recorda-1", PREVIEW));
    act(() => api.current.setActivePreview("recorda-2", null));

    // The focused card has no song: nothing new is loaded and playback stops.
    expect(mockAudioPlayer.replace).toHaveBeenCalledTimes(1);
    expect(mockAudioPlayer.pause).toHaveBeenCalled();
  });

  // US16: "Deve existir controle para silenciar/reativar" + "Estado de mute persiste".
  it("keeps the mute choice across card changes", () => {
    const api = renderProvider();

    act(() => api.current.setActivePreview("recorda-1", PREVIEW));
    act(() => api.current.toggleMuted());

    expect(mockAudioPlayer.muted).toBe(true);
    expect(api.current.isMuted).toBe(true);

    act(() => api.current.setActivePreview("recorda-2", OTHER_PREVIEW));

    expect(mockAudioPlayer.muted).toBe(true);
  });

  // US16: "Áudio para ao sair do Feed."
  it("pauses when navigating away from the feed and resumes on the way back", () => {
    const api = renderProvider();

    act(() => api.current.setActivePreview("recorda-1", PREVIEW));
    mockAudioPlayer.play.mockClear();

    act(() => api.current.setActiveRoute("Camera"));
    expect(mockAudioPlayer.pause).toHaveBeenCalled();
    expect(mockAudioPlayer.play).not.toHaveBeenCalled();

    act(() => api.current.setActiveRoute("Feed"));
    expect(mockAudioPlayer.play).toHaveBeenCalled();
  });

  // US16: "Ao abrir Detalhes, a música deve continuar do mesmo ponto."
  it("keeps playing on the published Recorda screen without replacing the source", () => {
    const api = renderProvider();

    act(() => api.current.setActivePreview("recorda-1", PREVIEW));
    mockAudioPlayer.pause.mockClear();
    mockAudioPlayer.replace.mockClear();

    act(() => api.current.setActiveRoute("PublishedRecorda"));

    expect(mockAudioPlayer.pause).not.toHaveBeenCalled();
    expect(mockAudioPlayer.replace).not.toHaveBeenCalled();
  });

  // US16: "Áudio para ao minimizar o app."
  it("pauses when the app goes to the background", () => {
    const listeners: ((state: string) => void)[] = [];
    jest.spyOn(AppState, "addEventListener").mockImplementation(((_event, handler) => {
      listeners.push(handler as (state: string) => void);
      return { remove: jest.fn() };
    }) as typeof AppState.addEventListener);

    const api = renderProvider();
    act(() => api.current.setActivePreview("recorda-1", PREVIEW));
    mockAudioPlayer.play.mockClear();

    act(() => listeners.forEach((listener) => listener("background")));
    expect(mockAudioPlayer.pause).toHaveBeenCalled();

    act(() => listeners.forEach((listener) => listener("active")));
    expect(mockAudioPlayer.play).toHaveBeenCalled();

    jest.restoreAllMocks();
  });

  // US16: "Bloqueio de autoplay deve ser tratado sem erro visível."
  it("survives a platform that refuses autoplay", () => {
    mockAudioPlayer.play.mockImplementation(() => {
      throw new Error("NotAllowedError");
    });

    const api = renderProvider();

    expect(() => act(() => api.current.setActivePreview("recorda-1", PREVIEW))).not.toThrow();
    expect(api.current.focusKey).toBe("recorda-1");
    expect(mockAudioPlayer.replace).toHaveBeenCalledWith(PREVIEW);
  });
});

import { act, renderHook } from "@testing-library/react-native";
import { AppState } from "react-native";

import { FeedAudioProvider, useFeedAudio } from "@/features/feed/state/FeedAudioContext";

import { mockAudioPlayer, resetAudioMock } from "../../mocks/expoAudio";

const PREVIEW = "https://cdn.example.com/preview-1.mp3";
const OTHER_PREVIEW = "https://cdn.example.com/preview-2.mp3";

function renderProvider() {
  const { result } = renderHook(() => useFeedAudio(), { wrapper: FeedAudioProvider });
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
    expect(api.current.activeRecordaId).toBe("recorda-2");
  });

  // US16: "Preview de 30 segundos deve entrar em loop enquanto o card estiver em foco."
  it("loops the preview and starts playing when a card takes focus", () => {
    const api = renderProvider();

    act(() => api.current.setActivePreview("recorda-1", PREVIEW));

    expect(mockAudioPlayer.loop).toBe(true);
    expect(mockAudioPlayer.play).toHaveBeenCalled();
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

    expect(api.current.activeRecordaId).toBeNull();
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
    expect(api.current.activeRecordaId).toBe("recorda-1");
  });
});

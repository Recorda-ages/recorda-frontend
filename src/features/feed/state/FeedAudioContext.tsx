import { type AudioPlayer, useAudioPlayer } from "expo-audio";
import {
  type Context,
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { AppState } from "react-native";

import { authApiClient, isApiUrl } from "@/services/api";

/**
 * Rotas onde a prévia continua tocando. Detalhes entra aqui porque a US16
 * exige que a música siga do mesmo ponto ao abrir a Recorda; qualquer outra
 * tela silencia o áudio.
 */
const AUDIO_ROUTES = new Set(["Feed", "PublishedRecorda"]);

type ActivePreview = Readonly<{
  previewUrl: string;
  recordaId: string;
}>;

type ActivePreviewOptions = Readonly<{
  /**
   * Which on-screen card holds focus. The same Recorda can show up in both feed tabs;
   * the key tells those cards apart. Defaults to the Recorda id.
   */
  focusKey?: string;
  waitForMedia?: boolean;
}>;

type FeedAudioActions = Readonly<{
  setActivePreview: (
    recordaId: string,
    previewUrl: string | null,
    options?: ActivePreviewOptions
  ) => void;
  setActiveRoute: (routeName: string | undefined) => void;
  /**
   * A view reports whether a Recorda's video can be shown (ready, or failed to load).
   * `reporter` tells apart several views showing the same Recorda.
   */
  setMediaReady: (recordaId: string, ready: boolean, reporter?: string) => void;
  toggleMuted: () => void;
}>;

const DEFAULT_MEDIA_REPORTER = "default";

function loadPreview(player: AudioPlayer, url: string) {
  player.replace(url);
  // `loop` e `muted` são propriedades atribuíveis: o expo-audio não expõe
  // setters equivalentes, então a mutação é a única via oferecida pela API.
  player.loop = true;
}

const FeedAudioActionsContext = createContext<FeedAudioActions | undefined>(undefined);
const FeedAudioMutedContext = createContext<boolean | undefined>(undefined);
const FeedFocusContext = createContext<string | null | undefined>(undefined);

/**
 * Dono do único player de prévia do app (US16).
 *
 * Player único é o que garante "somente uma Recorda pode reproduzir por vez":
 * não há como dois cards soarem juntos porque só existe um. Vive acima do
 * navegador para sobreviver à ida do Feed para os Detalhes sem recomeçar.
 */
export function FeedAudioProvider({ children }: PropsWithChildren) {
  const player = useAudioPlayer();
  const [active, setActive] = useState<ActivePreview | null>(null);
  // The preview whose fresh link has been handed to the player (API previews only).
  const [loadedPreview, setLoadedPreview] = useState<ActivePreview | null>(null);
  const [focusKey, setFocusKey] = useState<string | null>(null);
  const focusedRecordaId = useRef<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isRouteAllowed, setIsRouteAllowed] = useState(true);
  const [isForeground, setIsForeground] = useState(true);
  // A video Recorda's song waits for the video: playing music over a loading spinner
  // feels broken. The hold lifts once that card reports its media as ready.
  const [waitingRecordaId, setWaitingRecordaId] = useState<string | null>(null);
  // Per Recorda, which views (the feed card, the details screen) have its video ready. A
  // view going away only withdraws its own report, so the other one's still counts.
  const [readyMediaReporters, setReadyMediaReporters] = useState<
    ReadonlyMap<string, ReadonlySet<string>>
  >(() => new Map());
  const isWaitingForMedia =
    active !== null &&
    waitingRecordaId === active.recordaId &&
    !readyMediaReporters.has(active.recordaId);
  // While a fresh link is being fetched the player still holds the previous song, so
  // nothing may play until the new one is loaded.
  const isLoaded = active !== null && (!isApiUrl(active.previewUrl) || loadedPreview === active);
  const shouldPlay =
    active !== null && isLoaded && isRouteAllowed && isForeground && !isWaitingForMedia;
  // Read by the native status listener below.
  const playbackRef = useRef({ active, retried: null as ActivePreview | null, shouldPlay });

  useEffect(() => {
    playbackRef.current.active = active;
    playbackRef.current.shouldPlay = shouldPlay;
  }, [active, shouldPlay]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      setIsForeground(nextState === "active");
    });

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (!active) {
      return;
    }

    if (!isApiUrl(active.previewUrl)) {
      loadPreview(player, active.previewUrl);
      return;
    }

    // A API route answers with a freshly issued Deezer link (they expire after ~15 min).
    // The player gets that link directly, never the API route, so the auth token only
    // travels on this request. Meanwhile the previous song stays paused (the play effect
    // waits for `loadedPreview`): the native player rejects an empty source, so it can't
    // be cleared with `replace(null)`.
    let isCurrent = true;
    authApiClient
      .get<{ preview_url: string }>(active.previewUrl)
      .then(({ preview_url }) => {
        if (!isCurrent) return;
        loadPreview(player, preview_url);
        // Playback is decided by the play effect, with the state as it is by now.
        setLoadedPreview(active);
      })
      .catch(() => {
        // Sem prévia (404) ou sem rede: o card fica em silêncio.
      });

    return () => {
      isCurrent = false;
    };
  }, [active, player]);

  useEffect(() => {
    // The native player can report a freshly loaded song as ready but not playing when
    // `play()` reached it before the stream was ready. One retry per song covers that.
    const subscription = player.addListener("playbackStatusUpdate", (status) => {
      const playback = playbackRef.current;
      if (!playback.shouldPlay || !status.isLoaded || status.playing) return;
      if (playback.retried === playback.active) return;
      playback.retried = playback.active;
      try {
        player.play();
      } catch {
        // Autoplay recusado: silêncio, como no efeito de reprodução.
      }
    });

    return () => subscription.remove();
  }, [player]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability
    player.muted = isMuted;
  }, [isMuted, player]);

  useEffect(() => {
    if (!shouldPlay) {
      player.pause();
      return;
    }

    // Autoplay pode ser recusado pela plataforma. Falhar em silêncio é o
    // comportamento pedido: nenhum erro visível para o usuário.
    try {
      player.play();
    } catch {
      // ignorado de propósito
    }
    // `active` is a dependency so a new song starts even when `shouldPlay` stays true.
  }, [active, shouldPlay, player]);

  const setMediaReady = useCallback(
    (recordaId: string, ready: boolean, reporter = DEFAULT_MEDIA_REPORTER) => {
      setReadyMediaReporters((current) => {
        const reporters = current.get(recordaId);
        if ((reporters?.has(reporter) ?? false) === ready) return current;
        const nextReporters = new Set(reporters);
        if (ready) nextReporters.add(reporter);
        else nextReporters.delete(reporter);
        const next = new Map(current);
        if (nextReporters.size > 0) next.set(recordaId, nextReporters);
        else next.delete(recordaId);
        return next;
      });
    },
    []
  );

  const setActivePreview = useCallback(
    (recordaId: string, previewUrl: string | null, options?: ActivePreviewOptions) => {
      // The details screen re-activates the Recorda it was opened from without a key; the
      // feed card keeps its focus so its video is still playing on the way back.
      const keepsFocus =
        !options?.focusKey && recordaId !== "" && focusedRecordaId.current === recordaId;
      focusedRecordaId.current = recordaId || null;
      if (!keepsFocus) setFocusKey(options?.focusKey ?? (recordaId || null));
      setWaitingRecordaId(options?.waitForMedia ? recordaId : null);
      setActive((current) => {
        if (!previewUrl) {
          return null;
        }

        // Mesmo card em foco: não recomeça a prévia.
        if (current?.recordaId === recordaId) {
          return current;
        }

        return { previewUrl, recordaId };
      });
    },
    []
  );

  const setActiveRoute = useCallback((routeName: string | undefined) => {
    setIsRouteAllowed(routeName === undefined || AUDIO_ROUTES.has(routeName));
  }, []);

  const toggleMuted = useCallback(() => setIsMuted((current) => !current), []);

  const actions = useMemo(
    () => ({ setActivePreview, setActiveRoute, setMediaReady, toggleMuted }),
    [setActivePreview, setActiveRoute, setMediaReady, toggleMuted]
  );

  // Focus changes on every scroll between Recordas. Split contexts keep that from
  // re-rendering the navigator, the feed screen and every card's sound button.
  return (
    <FeedAudioActionsContext.Provider value={actions}>
      <FeedAudioMutedContext.Provider value={isMuted}>
        <FeedFocusContext.Provider value={focusKey}>{children}</FeedFocusContext.Provider>
      </FeedAudioMutedContext.Provider>
    </FeedAudioActionsContext.Provider>
  );
}

function useRequired<T>(context: Context<T | undefined>, hook: string): T {
  const value = useContext(context);

  if (value === undefined) {
    throw new Error(`${hook} must be used within FeedAudioProvider`);
  }

  return value;
}

/** Stable callbacks only: never triggers a re-render. */
export function useFeedAudioActions() {
  return useRequired(FeedAudioActionsContext, "useFeedAudioActions");
}

export function useFeedAudioMuted() {
  return useRequired(FeedAudioMutedContext, "useFeedAudioMuted");
}

/** The focus key of the card in focus (see `ActivePreviewOptions.focusKey`). */
export function useFeedFocusKey() {
  return useRequired(FeedFocusContext, "useFeedFocusKey");
}

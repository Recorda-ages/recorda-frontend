import { useAudioPlayer } from "expo-audio";
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import { AppState } from "react-native";

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

type FeedAudioState = Readonly<{
  activeRecordaId: string | null;
  isMuted: boolean;
  setActivePreview: (recordaId: string, previewUrl: string | null) => void;
  setActiveRoute: (routeName: string | undefined) => void;
  toggleMuted: () => void;
}>;

const FeedAudioContext = createContext<FeedAudioState | null>(null);

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
  const [isMuted, setIsMuted] = useState(false);
  const [isRouteAllowed, setIsRouteAllowed] = useState(true);
  const [isForeground, setIsForeground] = useState(true);

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

    player.replace(active.previewUrl);
    // `loop` e `muted` são propriedades atribuíveis: o expo-audio não expõe
    // setters equivalentes, então a mutação é a única via oferecida pela API.
    // eslint-disable-next-line react-hooks/immutability
    player.loop = true;
  }, [active, player]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability
    player.muted = isMuted;
  }, [isMuted, player]);

  useEffect(() => {
    if (!active || !isRouteAllowed || !isForeground) {
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
  }, [active, isForeground, isRouteAllowed, player]);

  const setActivePreview = useCallback((recordaId: string, previewUrl: string | null) => {
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
  }, []);

  const setActiveRoute = useCallback((routeName: string | undefined) => {
    setIsRouteAllowed(routeName === undefined || AUDIO_ROUTES.has(routeName));
  }, []);

  const toggleMuted = useCallback(() => setIsMuted((current) => !current), []);

  const value = useMemo(
    () => ({
      activeRecordaId: active?.recordaId ?? null,
      isMuted,
      setActivePreview,
      setActiveRoute,
      toggleMuted
    }),
    [active, isMuted, setActivePreview, setActiveRoute, toggleMuted]
  );

  return <FeedAudioContext.Provider value={value}>{children}</FeedAudioContext.Provider>;
}

export function useFeedAudio() {
  const value = useContext(FeedAudioContext);

  if (!value) {
    throw new Error("useFeedAudio must be used within FeedAudioProvider");
  }

  return value;
}

import { useAudioPlayer } from "expo-audio";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Modal,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  PanResponder,
  Pressable,
  type StyleProp,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type ViewStyle
} from "react-native";
import { Icon } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { authApiClient, isApiUrl } from "@/services/api";
import { baseColors, radius, spacing, typography, withOpacity } from "@/theme";

import { useDayMemories } from "../hooks/useDayMemories";
import type { DayRecordaDetail } from "../types";
import { DayMemorySlide } from "./DayMemorySlide";
import { DayPaginationSegments } from "./DayPaginationSegments";
import { MusicPreviewPill } from "./MusicPreviewPill";

const DISMISS_DISTANCE = 120;
const DISMISS_VELOCITY = 0.8;

/** Pull-down fecha quando o arrasto passa da distância ou é rápido o bastante. */
export function shouldDismiss(dy: number, vy: number) {
  return dy > DISMISS_DISTANCE || vy > DISMISS_VELOCITY;
}

type DayMemoriesViewerModalProps = Readonly<{
  date: string;
  onClose: () => void;
  visible: boolean;
}>;

/** Visualizador em tela cheia das Recordas de um dia do calendário (US37). */
export function DayMemoriesViewerModal({ date, onClose, visible }: DayMemoriesViewerModalProps) {
  return (
    <Modal animationType="fade" onRequestClose={onClose} statusBarTranslucent visible={visible}>
      {/* Desmontar o conteúdo ao fechar libera o player de áudio. */}
      {/* A chave recomeça o visualizador se o pai trocar a data com ele aberto. */}
      {visible ? <ViewerContent initialDate={date} key={date} onClose={onClose} /> : null}
    </Modal>
  );
}

function ViewerContent({
  initialDate,
  onClose
}: Readonly<{ initialDate: string; onClose: () => void }>) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { height, width } = useWindowDimensions();
  const [currentDate, setCurrentDate] = useState(initialDate);
  const [activeIndex, setActiveIndex] = useState(0);
  const { data, isError, isLoading } = useDayMemories(currentDate);
  const memories = data?.memories ?? [];
  const previousDate = data?.previous_date_with_memories ?? null;
  const nextDate = data?.next_date_with_memories ?? null;
  // Um refetch pode trazer menos Recordas que o índice em que o usuário estava.
  const index = Math.min(activeIndex, Math.max(memories.length - 1, 0));
  const active: DayRecordaDetail | undefined = memories[index];
  const preview = useDayPreview(active?.recorda_id ?? null, active?.song_preview_url ?? null);

  const { stop } = preview;
  const close = useCallback(() => {
    stop();
    onClose();
  }, [onClose, stop]);
  const goToDate = (next: string) => {
    setCurrentDate(next);
    setActiveIndex(0);
  };

  const { panHandlers, style: dragStyle } = usePullDownToDismiss(height, close);

  const onScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setActiveIndex(Math.round(event.nativeEvent.contentOffset.x / width));
  };

  return (
    <Animated.View
      {...panHandlers}
      style={[styles.container, dragStyle]}
      testID="day-memories-viewer"
    >
      {isLoading ? (
        <ActivityIndicator color={baseColors.white} style={styles.centered} />
      ) : isError || memories.length === 0 ? (
        <Text style={[styles.centered, styles.message]}>
          {isError ? t("memoriesCalendar.viewer.error") : t("memoriesCalendar.viewer.empty")}
        </Text>
      ) : (
        <FlatList
          data={memories}
          horizontal
          // Nova data, nova lista: volta para a primeira Recorda.
          key={currentDate}
          keyExtractor={(memory) => memory.recorda_id}
          onMomentumScrollEnd={onScrollEnd}
          pagingEnabled
          renderItem={({ index: itemIndex, item }) => (
            <DayMemorySlide
              height={height}
              isActive={itemIndex === index}
              memory={item}
              width={width}
            />
          )}
          showsHorizontalScrollIndicator={false}
          testID="day-memories-carousel"
        />
      )}

      <View style={[styles.top, { paddingTop: insets.top + spacing[2] }]}>
        <DayPaginationSegments activeIndex={index} count={memories.length} />
        <Pressable
          accessibilityLabel={t("memoriesCalendar.viewer.close")}
          accessibilityRole="button"
          hitSlop={8}
          onPress={close}
          style={[styles.roundButton, styles.closeButton]}
          testID="day-memories-close"
        >
          <Icon color={baseColors.white} size={22} source="close" />
        </Pressable>
      </View>

      {previousDate ? (
        <DayNavButton
          icon="chevron-left"
          label={t("memoriesCalendar.viewer.previousDay")}
          onPress={() => goToDate(previousDate)}
          style={styles.previous}
          testID="day-memories-previous"
        />
      ) : null}
      {nextDate ? (
        <DayNavButton
          icon="chevron-right"
          label={t("memoriesCalendar.viewer.nextDay")}
          onPress={() => goToDate(nextDate)}
          style={styles.next}
          testID="day-memories-next"
        />
      ) : null}

      {active ? (
        <View style={[styles.pill, { bottom: insets.bottom + spacing[6] }]}>
          <MusicPreviewPill
            artist={active.song_artist_name}
            canPlay={preview.isLoaded}
            coverUrl={active.song_cover_url}
            isPlaying={preview.isPlaying}
            onToggle={preview.toggle}
            title={active.song_title}
          />
        </View>
      ) : null}
    </Animated.View>
  );
}

function DayNavButton({
  icon,
  label,
  onPress,
  style,
  testID
}: Readonly<{
  icon: string;
  label: string;
  onPress: () => void;
  style: StyleProp<ViewStyle>;
  testID: string;
}>) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      hitSlop={8}
      onPress={onPress}
      style={[styles.roundButton, styles.navButton, style]}
      testID={testID}
    >
      <Icon color={baseColors.white} size={26} source={icon} />
    </Pressable>
  );
}

/**
 * Prévia de 30s da Recorda ativa. O player é do visualizador: ele só abre a partir
 * do Perfil, onde o player do feed já está calado pela regra de rotas, então as
 * duas músicas não se sobrepõem.
 */
function useDayPreview(recordaId: string | null, previewUrl: string | null) {
  const player = useAudioPlayer();
  const [loadedUrl, setLoadedUrl] = useState<string | null>(null);
  // Pausar vale só para a Recorda atual: a próxima volta a tocar sozinha, mesmo
  // quando usa a mesma música.
  const [pausedId, setPausedId] = useState<string | null>(null);
  const isPlaying = previewUrl !== null && pausedId !== recordaId;
  // Até o link carregar (ou se falhar) não há o que tocar.
  const isLoaded = previewUrl !== null && loadedUrl === previewUrl;

  useEffect(() => {
    if (!previewUrl) return;
    let cancelled = false;
    // Prévias da API devolvem um link novo do Deezer, que expira.
    const resolved = isApiUrl(previewUrl)
      ? authApiClient
          .get<{ preview_url: string }>(previewUrl)
          .then((response) => response.preview_url)
      : Promise.resolve(previewUrl);
    resolved
      .then((url) => {
        if (cancelled) return;
        player.replace(url);
        player.loop = true;
        setLoadedUrl(previewUrl);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [player, previewUrl]);

  useEffect(() => {
    if (isPlaying && isLoaded) player.play();
    else player.pause();
  }, [isLoaded, isPlaying, player]);

  const stop = useCallback(() => player.pause(), [player]);

  return {
    isLoaded,
    isPlaying,
    stop,
    toggle: () => setPausedId(isPlaying ? recordaId : null)
  };
}

function usePullDownToDismiss(height: number, onDismiss: () => void) {
  const [translateY] = useState(() => new Animated.Value(0));

  const panHandlers = useMemo(
    () =>
      PanResponder.create({
        // Só arrastos verticais para baixo: o horizontal é do carrossel.
        onMoveShouldSetPanResponder: (_, gesture) =>
          gesture.dy > 10 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
        onPanResponderMove: (_, gesture) => translateY.setValue(Math.max(0, gesture.dy)),
        onPanResponderRelease: (_, gesture) => {
          if (shouldDismiss(gesture.dy, gesture.vy)) {
            onDismiss();
            return;
          }
          Animated.spring(translateY, { toValue: 0, useNativeDriver: true }).start();
        }
      }).panHandlers,
    [onDismiss, translateY]
  );

  const style = useMemo(
    () => ({
      opacity: translateY.interpolate({
        extrapolate: "clamp",
        inputRange: [0, height],
        outputRange: [1, 0.3]
      }),
      transform: [{ translateY }]
    }),
    [height, translateY]
  );

  return { panHandlers, style };
}

const styles = StyleSheet.create({
  centered: {
    alignSelf: "center",
    marginTop: "auto",
    marginBottom: "auto"
  },
  closeButton: {
    alignSelf: "flex-end"
  },
  container: {
    backgroundColor: baseColors.black,
    flex: 1
  },
  message: {
    ...typography.body1,
    color: baseColors.white,
    paddingHorizontal: spacing[6],
    textAlign: "center"
  },
  navButton: {
    position: "absolute",
    top: "50%"
  },
  next: {
    right: spacing[2]
  },
  pill: {
    left: spacing[4],
    position: "absolute",
    right: spacing[4]
  },
  previous: {
    left: spacing[2]
  },
  roundButton: {
    alignItems: "center",
    backgroundColor: withOpacity(baseColors.black, 0.45),
    borderRadius: radius.full,
    height: 40,
    justifyContent: "center",
    width: 40
  },
  top: {
    gap: spacing[3],
    left: 0,
    paddingHorizontal: spacing[3],
    position: "absolute",
    right: 0
  }
});

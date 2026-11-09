import { useAudioPlayer } from "expo-audio";
import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Animated, Easing, Modal, Pressable, StyleSheet, View } from "react-native";
import { Icon } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppText } from "@/components/ui";
import { authApiClient, isApiUrl } from "@/services/api";
import { baseColors, colors, radius, spacing, withOpacity } from "@/theme";

import { EngagementSlide } from "../components/slides/EngagementSlide";
import { GenresSlide } from "../components/slides/GenresSlide";
import { TaggedUsersSlide } from "../components/slides/TaggedUsersSlide";
import { TopArtistsSlide } from "../components/slides/TopArtistsSlide";
import { TotalRecordasSlide } from "../components/slides/TotalRecordasSlide";
import { StoryProgressBar } from "../components/StoryProgressBar";
import type { RetrospectiveStory } from "../storyData";

export const SLIDE_DURATION_MS = 5000;
const LONG_PRESS_MS = 250;

type RetrospectiveScreenProps = Readonly<{
  onClose: () => void;
  story: RetrospectiveStory;
  title: string;
  visible: boolean;
}>;

/** Story Viewer da Retrospectiva (US39): cinco slides que avançam sozinhos. */
export function RetrospectiveScreen({ onClose, story, title, visible }: RetrospectiveScreenProps) {
  return (
    <Modal animationType="fade" onRequestClose={onClose} statusBarTranslucent visible={visible}>
      {/* Desmontar o conteúdo ao fechar libera o player e o timer. */}
      {visible ? <StoryViewer onClose={onClose} story={story} title={title} /> : null}
    </Modal>
  );
}

function buildSlides(story: RetrospectiveStory): ReactNode[] {
  return [
    <TotalRecordasSlide key="total" total={story.total_recordas} />,
    <TopArtistsSlide
      artists={story.top_artists}
      featuredSong={story.featured_song}
      key="artists"
    />,
    <GenresSlide genres={story.top_genres} key="genres" />,
    <TaggedUsersSlide key="tagged" users={story.tagged_users} />,
    <EngagementSlide engagement={story.engagement} key="engagement" maxStreak={story.max_streak} />
  ];
}

function StoryViewer({
  onClose,
  story,
  title
}: Readonly<{ onClose: () => void; story: RetrospectiveStory; title: string }>) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const slides = buildSlides(story);
  const [index, setIndex] = useState(0);
  // Conta reinícios: voltar no primeiro slide recomeça o mesmo índice.
  const [run, setRun] = useState(0);
  const [paused, setPaused] = useState(false);
  const [progress] = useState(() => new Animated.Value(0));
  const elapsed = useRef(0);
  const audio = useFeaturedSong(story.featured_song?.preview_url ?? null, paused);

  const { stop } = audio;
  const close = useCallback(() => {
    stop();
    onClose();
  }, [onClose, stop]);

  const next = useCallback(() => {
    if (index >= slides.length - 1) close();
    else setIndex(index + 1);
  }, [close, index, slides.length]);

  const previous = () => {
    setIndex((current) => Math.max(0, current - 1));
    setRun((current) => current + 1);
  };

  // Slide novo (ou reiniciado) começa do zero.
  useEffect(() => {
    elapsed.current = 0;
    progress.setValue(0);
  }, [index, progress, run]);

  // Pausar guarda o tempo já corrido; retomar continua dali.
  useEffect(() => {
    if (paused) return;
    const remaining = Math.max(0, SLIDE_DURATION_MS - elapsed.current);
    const startedAt = Date.now();
    const animation = Animated.timing(progress, {
      duration: remaining,
      easing: Easing.linear,
      toValue: 1,
      useNativeDriver: false
    });
    animation.start();
    const timer = setTimeout(next, remaining);
    return () => {
      clearTimeout(timer);
      animation.stop();
      elapsed.current += Date.now() - startedAt;
    };
  }, [index, next, paused, progress, run]);

  const zoneProps = {
    delayLongPress: LONG_PRESS_MS,
    onLongPress: () => setPaused(true),
    onPressOut: () => setPaused(false)
  };

  return (
    <View style={styles.screen} testID="retrospective-screen">
      <View style={[styles.header, { paddingTop: insets.top + spacing[2] }]}>
        <StoryProgressBar activeIndex={index} count={slides.length} progress={progress} />
        <View style={styles.titleRow}>
          <AppText style={styles.title} variant="buttonLarge">
            {title}
          </AppText>
          <Pressable
            accessibilityLabel={t("retrospective.close")}
            accessibilityRole="button"
            hitSlop={8}
            onPress={close}
            style={styles.closeButton}
            testID="retrospective-close"
          >
            <Icon color={baseColors.white} size={22} source="close" />
          </Pressable>
        </View>
        <AppText style={styles.step} variant="caption">
          {t("retrospective.step", { current: index + 1, total: slides.length })}
        </AppText>
      </View>

      <View style={styles.body}>
        {slides[index]}
        {/* Toques por cima do slide: esquerda volta, direita avança, segurar pausa. */}
        <View style={StyleSheet.absoluteFill}>
          <View style={styles.zones}>
            <Pressable
              {...zoneProps}
              accessibilityLabel={t("retrospective.previous")}
              accessibilityRole="button"
              onPress={previous}
              style={styles.previousZone}
              testID="retrospective-previous"
            />
            <Pressable
              {...zoneProps}
              accessibilityLabel={t("retrospective.next")}
              accessibilityRole="button"
              onPress={next}
              style={styles.nextZone}
              testID="retrospective-next"
            />
          </View>
        </View>
      </View>
    </View>
  );
}

/**
 * Faixa destaque em loop enquanto o Story Viewer está aberto. O player é da tela:
 * ela abre a partir do Perfil, onde o player do feed já está calado pela regra de
 * rotas, então as músicas não se sobrepõem.
 */
function useFeaturedSong(previewUrl: string | null, paused: boolean) {
  const player = useAudioPlayer();
  const [loaded, setLoaded] = useState(false);

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
        setLoaded(true);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [player, previewUrl]);

  useEffect(() => {
    if (loaded && !paused) player.play();
    else player.pause();
  }, [loaded, paused, player]);

  const stop = useCallback(() => player.pause(), [player]);

  return { stop };
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    marginTop: spacing[6]
  },
  closeButton: {
    alignItems: "center",
    backgroundColor: withOpacity(baseColors.white, 0.08),
    borderRadius: radius.full,
    height: 36,
    justifyContent: "center",
    width: 36
  },
  header: {
    gap: spacing[3],
    paddingHorizontal: spacing[4]
  },
  nextZone: {
    flex: 2
  },
  previousZone: {
    flex: 1
  },
  screen: {
    backgroundColor: colors.neutrals[900],
    flex: 1
  },
  step: {
    color: colors.primary[500],
    textTransform: "uppercase"
  },
  title: {
    color: baseColors.white,
    flex: 1
  },
  titleRow: {
    alignItems: "center",
    flexDirection: "row"
  },
  zones: {
    flex: 1,
    flexDirection: "row"
  }
});

import { Image } from "expo-image";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Icon } from "react-native-paper";

import { AppText, Button, ErrorState, Loading } from "@/components/ui";
import { resolveApiAssetUrl, useAuthImageSource } from "@/services/api";
import { colors, radius, spacing, withOpacity } from "@/theme";

import type { RecordaGridItem } from "../types";

const COLUMNS = 3;
const TILE_GAP = spacing[1];
const PLAY_ICON_SIZE = 28;
// Keeps the area from collapsing while the first page loads or fails.
const MIN_STATE_HEIGHT = 160;

/** Pagination state the screen reads from `useProfileRecordas`. */
export type RecordaGridPagination = {
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  isFetchNextPageError: boolean;
};

type RecordaGridProps = Readonly<
  RecordaGridPagination & {
    /** Already flattened from the pages, in the backend order (newest first). */
    items: readonly RecordaGridItem[];
    /** State of the first page. Later pages are reported by the pagination fields. */
    status: "pending" | "error" | "success";
    /** Overrides the default empty message (e.g. a hint for the own profile). */
    emptyMessage?: string;
    onLoadMore: () => void;
    onPressItem: (recordaId: string) => void;
    onRetry: () => void;
  }
>;

/**
 * Only when it makes sense to ask for the next page: one at a time, and not right after
 * a failure (the footer offers the retry).
 */
export function canLoadMore(pagination: RecordaGridPagination) {
  return (
    pagination.hasNextPage && !pagination.isFetchingNextPage && !pagination.isFetchNextPageError
  );
}

/**
 * Three-column grid of a profile's Recordas. Presentation only: the screen fetches the
 * pages and owns the scroll, so the grid sits inside the profile's single ScrollView
 * instead of nesting a second scrolling list. The screen asks for more pages (see
 * `canLoadMore`); the grid shows the footer and the retry.
 */
export function RecordaGrid({
  emptyMessage,
  hasNextPage,
  isFetchNextPageError,
  isFetchingNextPage,
  items,
  onLoadMore,
  onPressItem,
  onRetry,
  status
}: RecordaGridProps) {
  const { t } = useTranslation();

  if (status === "pending") {
    return (
      <View style={styles.state} testID="recorda-grid-loading">
        <Loading label={t("profile.grid.loading")} />
      </View>
    );
  }

  if (status === "error") {
    return (
      <View style={[styles.state, styles.feedback]} testID="recorda-grid-error">
        <ErrorState message={t("profile.grid.loadError")} />
        <Button label={t("profile.grid.retry")} onPress={onRetry} variant="secondary" />
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={styles.state} testID="recorda-grid-empty">
        <AppText style={styles.empty}>{emptyMessage ?? t("profile.grid.empty")}</AppText>
      </View>
    );
  }

  const handleLoadMoreRetry = () => {
    if (hasNextPage && !isFetchingNextPage) onLoadMore();
  };

  return (
    <View testID="recorda-grid">
      {chunk(items, COLUMNS).map((row) => (
        <View key={row[0].recorda_id} style={styles.row} testID="recorda-grid-row">
          {row.map((item) => (
            <RecordaGridTile item={item} key={item.recorda_id} onPress={onPressItem} />
          ))}
          {/* Keeps the tiles of a short last row the same size as the others. */}
          {Array.from({ length: COLUMNS - row.length }, (_, index) => (
            <View key={`spacer-${index}`} style={styles.tile} />
          ))}
        </View>
      ))}

      {isFetchingNextPage ? (
        <ActivityIndicator
          accessibilityLabel={t("profile.grid.loadingMore")}
          color={colors.neutrals[100]}
          style={styles.footer}
          testID="recorda-grid-loading-more"
        />
      ) : isFetchNextPageError ? (
        <View style={[styles.footer, styles.feedback]} testID="recorda-grid-load-more-error">
          <ErrorState message={t("profile.grid.loadMoreError")} />
          <Button
            label={t("profile.grid.retry")}
            onPress={handleLoadMoreRetry}
            variant="secondary"
          />
        </View>
      ) : null}
    </View>
  );
}

function RecordaGridTile({
  item,
  onPress
}: Readonly<{ item: RecordaGridItem; onPress: (recordaId: string) => void }>) {
  const { t } = useTranslation();
  const isVideo = item.media_type === "VIDEO";
  // The contract has no video thumbnail: videos show the song cover, as the feed does.
  // Photos are served by the API and need the auth header; covers come from Deezer.
  const photoSource = useAuthImageSource(isVideo ? null : resolveApiAssetUrl(item.media_url));
  const source = isVideo
    ? item.song_cover_url
      ? { uri: item.song_cover_url }
      : null
    : photoSource;
  const labelKey = isVideo ? "profile.grid.videoA11y" : "profile.grid.photoA11y";

  return (
    <Pressable
      accessibilityLabel={t(labelKey, { artist: item.song_artist_name, title: item.song_title })}
      accessibilityRole="button"
      onPress={() => onPress(item.recorda_id)}
      style={({ pressed }) => [styles.tile, styles.tileSurface, pressed && styles.pressed]}
      testID={`recorda-grid-item-${item.recorda_id}`}
    >
      {source ? (
        <Image
          contentFit="cover"
          source={source}
          style={StyleSheet.absoluteFill}
          testID={`recorda-grid-image-${item.recorda_id}`}
        />
      ) : (
        <View style={styles.fallback}>
          <Icon color={colors.neutrals[400]} size={24} source="music-note" />
        </View>
      )}
      {isVideo ? (
        <View pointerEvents="none" style={styles.videoBadge}>
          <Icon
            color={colors.neutrals[100]}
            size={PLAY_ICON_SIZE}
            source="play-circle-outline"
            testID={`recorda-grid-video-${item.recorda_id}`}
          />
        </View>
      ) : null}
    </Pressable>
  );
}

function chunk<T>(list: readonly T[], size: number): T[][] {
  const rows: T[][] = [];
  for (let index = 0; index < list.length; index += size) {
    rows.push(list.slice(index, index + size));
  }
  return rows;
}

const styles = StyleSheet.create({
  empty: {
    color: colors.neutrals[300],
    textAlign: "center"
  },
  fallback: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center"
  },
  feedback: {
    gap: spacing[3]
  },
  footer: {
    marginTop: spacing[4]
  },
  pressed: {
    opacity: 0.8
  },
  row: {
    flexDirection: "row",
    gap: TILE_GAP,
    marginBottom: TILE_GAP
  },
  state: {
    justifyContent: "center",
    minHeight: MIN_STATE_HEIGHT,
    paddingVertical: spacing[6]
  },
  tile: {
    aspectRatio: 1,
    flex: 1
  },
  tileSurface: {
    backgroundColor: colors.neutrals[800],
    borderRadius: radius.md,
    overflow: "hidden"
  },
  videoBadge: {
    alignItems: "center",
    backgroundColor: withOpacity(colors.neutrals[900], 0.25),
    bottom: 0,
    justifyContent: "center",
    left: 0,
    position: "absolute",
    right: 0,
    top: 0
  }
});

import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Icon } from "react-native-paper";

import { AppText } from "@/components/ui";
import { resolveApiAssetUrl, useAuthImageSource } from "@/services/api";
import { colors, fontFamily, radius, spacing } from "@/theme";

import type { TopArtistMetric } from "../../types";
import { WidgetCard } from "./WidgetCard";

type TopArtistsRankingCardProps = {
  artists: readonly TopArtistMetric[];
};

export function TopArtistsRankingCard({ artists }: Readonly<TopArtistsRankingCardProps>) {
  const { t } = useTranslation();

  return (
    <WidgetCard testID="top-artists-card" title={t("memoriesMetrics.widgets.topArtists.title")}>
      {artists.length > 0 ? (
        <View style={styles.list}>
          {artists.map((artist, index) => (
            <ArtistRow artist={artist} key={artist.artist_name} position={index + 1} />
          ))}
        </View>
      ) : (
        <AppText style={styles.empty} variant="body2">
          {t("memoriesMetrics.widgets.topArtists.empty")}
        </AppText>
      )}
    </WidgetCard>
  );
}

function ArtistRow({ artist, position }: Readonly<{ artist: TopArtistMetric; position: number }>) {
  const { t } = useTranslation();
  const source = useAuthImageSource(artist.image_url ? resolveApiAssetUrl(artist.image_url) : null);
  const countKey =
    artist.memory_count === 1
      ? "memoriesMetrics.widgets.topArtists.countSingular"
      : "memoriesMetrics.widgets.topArtists.countPlural";

  return (
    <View style={styles.row} testID={`top-artist-row-${position}`}>
      <AppText style={styles.position} variant="body2">
        {String(position)}
      </AppText>
      {source ? (
        <Image
          accessibilityLabel={t("memoriesMetrics.widgets.topArtists.photo", {
            name: artist.artist_name
          })}
          contentFit="cover"
          source={source}
          style={styles.photo}
          testID={`top-artist-photo-${position}`}
        />
      ) : (
        <View
          style={[styles.photo, styles.photoFallback]}
          testID={`top-artist-fallback-${position}`}
        >
          <Icon color={colors.neutrals[400]} size={22} source="music-note" />
        </View>
      )}
      <View style={styles.copy}>
        <AppText numberOfLines={1} style={styles.name} variant="body1">
          {artist.artist_name}
        </AppText>
        <AppText style={styles.count} variant="caption">
          {t(countKey, { count: artist.memory_count })}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  copy: {
    flex: 1,
    gap: 2,
    minWidth: 0
  },
  count: {
    color: colors.neutrals[300]
  },
  empty: {
    color: colors.neutrals[300]
  },
  list: {
    gap: spacing[3]
  },
  name: {
    color: colors.neutrals[100],
    fontFamily: fontFamily.display.semiBold
  },
  photo: {
    backgroundColor: colors.neutrals[700],
    borderRadius: radius.md,
    height: 44,
    width: 44
  },
  photoFallback: {
    alignItems: "center",
    justifyContent: "center"
  },
  position: {
    color: colors.neutrals[300],
    fontFamily: fontFamily.primary.semiBold,
    textAlign: "center",
    width: 16
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing[3]
  }
});

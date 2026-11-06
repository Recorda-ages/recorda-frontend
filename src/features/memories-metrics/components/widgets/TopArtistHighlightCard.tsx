import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Icon } from "react-native-paper";

import { AppText } from "@/components/ui";
import { resolveApiAssetUrl, useAuthImageSource } from "@/services/api";
import { colors, fontFamily, radius, spacing } from "@/theme";

import type { TopArtistMetric } from "../../types";
import { WidgetCard } from "./WidgetCard";

type TopArtistHighlightCardProps = {
  artist: TopArtistMetric | null;
};

export function TopArtistHighlightCard({ artist }: Readonly<TopArtistHighlightCardProps>) {
  const { t } = useTranslation();

  return (
    <WidgetCard testID="top-artist-card" title={t("memoriesMetrics.widgets.topArtist.title")}>
      {artist ? (
        <ArtistContent artist={artist} />
      ) : (
        <AppText style={styles.empty} variant="body2">
          {t("memoriesMetrics.widgets.topArtist.empty")}
        </AppText>
      )}
    </WidgetCard>
  );
}

function ArtistContent({ artist }: Readonly<{ artist: TopArtistMetric }>) {
  const { t } = useTranslation();
  const source = useAuthImageSource(artist.image_url ? resolveApiAssetUrl(artist.image_url) : null);
  const countKey =
    artist.memory_count === 1
      ? "memoriesMetrics.widgets.topArtist.countSingular"
      : "memoriesMetrics.widgets.topArtist.countPlural";

  return (
    <View style={styles.row}>
      {source ? (
        <Image
          accessibilityLabel={t("memoriesMetrics.widgets.topArtist.photo", {
            name: artist.artist_name
          })}
          contentFit="cover"
          source={source}
          style={styles.photo}
          testID="top-artist-photo"
        />
      ) : (
        <View style={[styles.photo, styles.photoFallback]} testID="top-artist-photo-fallback">
          <Icon color={colors.neutrals[400]} size={32} source="music-note" />
        </View>
      )}
      <View style={styles.copy}>
        <AppText numberOfLines={2} style={styles.name} variant="headline4">
          {artist.artist_name}
        </AppText>
        <AppText style={styles.count} variant="body2">
          {t(countKey, { count: artist.memory_count })}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  copy: {
    flex: 1,
    gap: spacing[1],
    minWidth: 0
  },
  count: {
    color: colors.neutrals[300]
  },
  empty: {
    color: colors.neutrals[300]
  },
  name: {
    color: colors.neutrals[100],
    fontFamily: fontFamily.display.semiBold
  },
  photo: {
    backgroundColor: colors.neutrals[700],
    borderRadius: radius.lg,
    height: 72,
    width: 72
  },
  photoFallback: {
    alignItems: "center",
    justifyContent: "center"
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing[3]
  }
});

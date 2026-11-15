import { Image } from "expo-image";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui";
import { radius } from "@/theme";

import type { RetrospectiveStory } from "../../storyData";
import { SlideFrame, slideStyles } from "./SlideFrame";

type TopArtistsSlideProps = Readonly<{
  artists: RetrospectiveStory["top_artists"];
  featuredSong: RetrospectiveStory["featured_song"];
}>;

/** Slide 2: ranking de artistas e a faixa destaque, que é a que toca no visualizador. */
export function TopArtistsSlide({ artists, featuredSong }: TopArtistsSlideProps) {
  const { t } = useTranslation();

  return (
    <SlideFrame
      eyebrow={t("retrospective.artists.eyebrow")}
      subtitle={t("retrospective.artists.subtitle")}
      title={artists[0]?.name ?? t("retrospective.artists.empty")}
    >
      {featuredSong ? (
        <View style={[slideStyles.card, slideStyles.row]} testID="retrospective-featured-song">
          <Image source={{ uri: featuredSong.cover_url }} style={styles.cover} />
          <View>
            <AppText style={slideStyles.muted} variant="caption">
              {t("retrospective.featuredSong")}
            </AppText>
            <AppText style={slideStyles.value} variant="headline4">
              {featuredSong.title}
            </AppText>
            <AppText style={slideStyles.muted} variant="body2">
              {featuredSong.artist_name}
            </AppText>
          </View>
        </View>
      ) : null}
      {artists.map((artist, index) => (
        <View key={artist.name} style={[slideStyles.card, slideStyles.row]}>
          <AppText style={slideStyles.value} variant="buttonLarge">
            {index + 1}
          </AppText>
          <AppText style={[slideStyles.white, styles.name]} variant="body1">
            {artist.name}
          </AppText>
          <AppText style={slideStyles.muted} variant="body2">
            {t("retrospective.recordasCount", { count: artist.recordas_count })}
          </AppText>
        </View>
      ))}
    </SlideFrame>
  );
}

const styles = StyleSheet.create({
  cover: {
    borderRadius: radius.md,
    height: 48,
    width: 48
  },
  name: {
    flex: 1
  }
});

import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useVideoPlayer, VideoView } from "expo-video";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import {
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableWithoutFeedback,
  View
} from "react-native";
import { Button, IconButton, Text, TextInput } from "react-native-paper";

import { Screen } from "@/components/ui";
import type { RootStackParamList } from "@/app/navigation/RootNavigator";
import {
  baseColors,
  colors,
  fontFamily,
  radius,
  semanticColors,
  spacing,
  typography
} from "@/theme";

import { mockRecordaDraft } from "../mocks/recordaDraft";
import type { RecordaDraft } from "../types";

const DESCRIPTION_MAX_LENGTH = 2200;

type RecordaDetailsScreenProps = {
  draft?: RecordaDraft;
  onPublish?: () => void;
};

export function RecordaDetailsScreen({
  draft = mockRecordaDraft,
  onPublish = () => undefined
}: RecordaDetailsScreenProps) {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [description, setDescription] = useState(draft.description);
  const [coverLoadFailed, setCoverLoadFailed] = useState(false);
  const videoPlayer = useVideoPlayer(draft.media?.uri ?? "");

  return (
    <Screen
      contentContainerStyle={styles.content}
      style={styles.screen}
      testID="recorda-details-screen"
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoiding}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
            keyboardShouldPersistTaps="handled"
          >
          <View style={styles.header}>
            <IconButton
              accessibilityLabel="Voltar"
              icon={({ color, size }) => <Ionicons color={color} name="chevron-back" size={size} />}
              iconColor={baseColors.white}
              onPress={() => navigation.goBack()}
              size={32}
              style={styles.backButton}
            />
            <Text
              ellipsizeMode="tail"
              numberOfLines={1}
              style={styles.headerTitle}
              variant="titleMedium"
            >
              Descrição
            </Text>
            <View style={styles.headerSpacer} />
          </View>
          <View style={styles.mediaStage}>
        {draft.media ? (
          draft.media.type === "video" ? (
            <VideoView
              accessibilityLabel={t("recordaDetails.mediaSelected")}
              contentFit="cover"
              nativeControls={false}
              player={videoPlayer}
              style={styles.media}
              testID="recorda-details-video"
            />
          ) : (
            <Image
              accessibilityLabel={t("recordaDetails.mediaSelected")}
              source={{ uri: draft.media.uri }}
              style={styles.media}
              testID="recorda-details-media"
            />
          )
        ) : (
          <View style={styles.mediaUnavailable} testID="recorda-details-media">
            <Text>{t("recordaDetails.mediaUnavailable")}</Text>
          </View>
        )}

        <View style={styles.mediaOverlay} testID="recorda-details-media-overlay" />

            {draft.song ? (
              <View style={styles.song}>
            {draft.song.coverUrl && !coverLoadFailed ? (
              <Image
                accessibilityLabel={t("recordaDetails.songCover")}
                onError={() => setCoverLoadFailed(true)}
                source={{ uri: draft.song.coverUrl }}
                style={styles.songCover}
                testID="recorda-details-song-cover"
              />
            ) : (
              <View
                accessibilityLabel={t("recordaDetails.songCover")}
                style={[styles.songCover, styles.songCoverPlaceholder]}
                testID="recorda-details-song-cover"
              />
            )}
            <Text style={styles.songTitle} variant="titleMedium">
              {draft.song.title}
            </Text>
            <Text style={styles.songArtist} variant="bodySmall">
              {draft.song.artistName}
            </Text>
              </View>
            ) : null}
          </View>

          <View style={styles.bottomArea}>
        <TextInput
          accessibilityLabel={t("recordaDetails.descriptionLabel")}
          contentStyle={styles.descriptionContent}
          cursorColor={semanticColors.actionPrimary}
          maxLength={DESCRIPTION_MAX_LENGTH}
          multiline
          onChangeText={(text) => setDescription(text.slice(0, DESCRIPTION_MAX_LENGTH))}
          placeholder={t("recordaDetails.descriptionPlaceholder")}
          placeholderTextColor="rgba(255, 255, 255, 0.6)"
          selectionColor={semanticColors.actionPrimary}
          style={styles.description}
          textColor={baseColors.white}
          underlineColor="transparent"
          activeUnderlineColor="transparent"
          value={description}
        />

          <View style={styles.actions}>
          <IconButton
            accessibilityLabel={t("recordaDetails.share")}
            icon={({ color, size }) => (
              <Ionicons color={color} name="share-social-outline" size={size} />
            )}
            iconColor={styles.shareIcon.color}
            mode="outlined"
            size={32}
            style={styles.shareButton}
          />
          <Button
            contentStyle={styles.publishContent}
            disabled={!draft.song}
            mode="contained"
            onPress={onPublish}
            style={styles.publishButton}
          >
            {t("recordaDetails.publish")}
          </Button>
            </View>
          </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  actions: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing[4]
  },
  bottomArea: {
    backgroundColor: colors.neutrals[900],
    gap: spacing[4],
    paddingHorizontal: spacing[6],
    paddingTop: spacing[4],
    paddingBottom: spacing[6]
  },
  content: {
    backgroundColor: colors.neutrals[900],
    padding: 0
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing[1],
    height: 64,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2]
  },
  backButton: {
    margin: 0,
    width: 48
  },
  headerSpacer: {
    width: 48
  },
  headerTitle: {
    ...typography.headline4,
    color: colors.secondary[100],
    fontFamily: fontFamily.primary.bold,
    flex: 1,
    lineHeight: 27,
    overflow: "hidden",
    textAlign: "center"
  },
  keyboardAvoiding: {
    flex: 1
  },
  media: {
    ...StyleSheet.absoluteFillObject,
    height: undefined,
    width: undefined
  },
  mediaUnavailable: {
    alignItems: "center",
    backgroundColor: colors.neutrals[900],
    flex: 1,
    justifyContent: "center",
    width: "100%"
  },
  mediaStage: {
    flex: 1,
    minHeight: 0,
    position: "relative"
  },
  mediaOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: baseColors.black,
    opacity: 0.6
  },
  publishButton: {
    borderRadius: radius.full,
    flex: 1
  },
  publishContent: {
    minHeight: 58
  },
  screen: {
    backgroundColor: colors.neutrals[900]
  },
  scrollContent: {
    flexGrow: 1
  },
  shareButton: {
    borderColor: semanticColors.actionPrimary,
    borderRadius: radius.full,
    flexBasis: 56,
    height: 56,
    margin: 0,
    width: 56
  },
  shareIcon: {
    color: semanticColors.actionPrimary
  },
  description: {
    backgroundColor: "transparent",
    minHeight: 64,
    paddingHorizontal: 0,
    paddingVertical: 0
  },
  descriptionContent: {
    color: baseColors.white,
    fontFamily: fontFamily.display.medium,
    fontSize: 16,
    letterSpacing: 0.15,
    lineHeight: 21,
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 0,
    textAlignVertical: "top"
  },
  song: {
    alignItems: "center",
    left: 0,
    paddingHorizontal: spacing[6],
    position: "absolute",
    right: 0,
    top: spacing[6]
  },
  songArtist: {
    color: colors.neutrals[100],
    fontFamily: fontFamily.display.medium,
    fontSize: 12,
    marginTop: spacing[1]
  },
  songCover: {
    borderRadius: radius.md,
    height: 80,
    marginBottom: spacing[4],
    width: 80
  },
  songCoverPlaceholder: {
    backgroundColor: colors.neutrals[700]
  },
  songTitle: {
    color: colors.neutrals[100],
    fontFamily: fontFamily.display.semiBold,
    fontSize: 20,
    textAlign: "center"
  }
});

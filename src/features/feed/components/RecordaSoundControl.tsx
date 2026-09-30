import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import { Icon } from "react-native-paper";

import { baseColors, colors, radius, spacing, withOpacity } from "@/theme";

import { useFeedAudioActions, useFeedAudioMuted } from "../state/FeedAudioContext";

type RecordaSoundControlProps = Readonly<{
  hasPreview: boolean;
  recordaId: string;
}>;

/**
 * Botão de silenciar/reativar sobre a mídia (US16).
 *
 * Quando a Recorda não tem prévia, ocupa o mesmo espaço com um indicador
 * apagado e sem toque — é o Fallback Visual. Mantê-lo no mesmo lugar evita
 * que a interface dance entre um card e outro durante o scroll.
 */
export function RecordaSoundControl({ hasPreview, recordaId }: RecordaSoundControlProps) {
  const { t } = useTranslation();
  const isMuted = useFeedAudioMuted();
  const { toggleMuted } = useFeedAudioActions();

  if (!hasPreview) {
    return (
      <View
        accessibilityLabel={t("feed.sound.unavailable")}
        accessibilityRole="image"
        style={[styles.control, styles.unavailable]}
        testID={`recorda-sound-unavailable-${recordaId}`}
      >
        <Icon color={colors.neutrals[300]} size={18} source="music-note-off" />
      </View>
    );
  }

  return (
    <Pressable
      accessibilityLabel={isMuted ? t("feed.sound.unmute") : t("feed.sound.mute")}
      accessibilityRole="button"
      accessibilityState={{ selected: isMuted }}
      hitSlop={8}
      onPress={toggleMuted}
      style={styles.control}
      testID={`recorda-sound-toggle-${recordaId}`}
    >
      <Icon
        color={colors.neutrals[100]}
        size={18}
        source={isMuted ? "volume-off" : "volume-high"}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  control: {
    alignItems: "center",
    backgroundColor: withOpacity(baseColors.black, 0.55),
    borderRadius: radius.full,
    bottom: spacing[3],
    height: 32,
    justifyContent: "center",
    position: "absolute",
    right: spacing[3],
    width: 32
  },
  unavailable: {
    backgroundColor: withOpacity(baseColors.black, 0.35)
  }
});

import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet } from "react-native";
import { Icon } from "react-native-paper";

import { colors, radius, spacing } from "@/theme";

type SongSoundToggleProps = Readonly<{
  muted: boolean;
  onToggle: () => void;
}>;

export function SongSoundToggle({ muted, onToggle }: SongSoundToggleProps) {
  const { t } = useTranslation();

  return (
    <Pressable
      accessibilityLabel={muted ? t("feed.sound.unmute") : t("feed.sound.mute")}
      accessibilityRole="button"
      accessibilityState={{ selected: muted }}
      hitSlop={8}
      onPress={onToggle}
      style={styles.button}
      testID="draft-sound-toggle"
    >
      <Icon color={colors.neutrals[100]} size={24} source={muted ? "volume-off" : "volume-high"} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    borderRadius: radius.full,
    height: 40,
    justifyContent: "center",
    marginRight: spacing[1],
    width: 40
  }
});

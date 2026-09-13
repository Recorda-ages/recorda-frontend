import { Pressable, StyleSheet, View } from "react-native";

import { colors } from "@/theme";

type PasswordVisibilityToggleProps = {
  hideLabel: string;
  onToggle: () => void;
  showLabel: string;
  visible: boolean;
};

export function PasswordVisibilityToggle({
  hideLabel,
  onToggle,
  showLabel,
  visible
}: PasswordVisibilityToggleProps) {
  const accessibilityLabel = visible ? hideLabel : showLabel;

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      hitSlop={12}
      onPress={onToggle}
      style={styles.eyeButton}
      testID="toggle-password-visibility"
    >
      <View style={styles.eyeIconContainer}>
        <View style={styles.eyeOuter}>
          <View style={styles.eyePupil} />
        </View>
        {!visible ? <View style={styles.eyeSlash} /> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  eyeButton: {
    alignItems: "center",
    height: 32,
    justifyContent: "center",
    width: 32
  },
  eyeIconContainer: {
    alignItems: "center",
    height: 18,
    justifyContent: "center",
    width: 24
  },
  eyeOuter: {
    alignItems: "center",
    borderColor: colors.neutrals[300],
    borderRadius: 9,
    borderWidth: 1.8,
    height: 14,
    justifyContent: "center",
    width: 22
  },
  eyePupil: {
    backgroundColor: colors.neutrals[300],
    borderRadius: 3,
    height: 6,
    width: 6
  },
  eyeSlash: {
    backgroundColor: colors.neutrals[300],
    height: 2,
    position: "absolute",
    transform: [{ rotate: "-45deg" }],
    width: 22
  }
});

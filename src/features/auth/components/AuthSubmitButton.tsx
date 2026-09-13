import type { PressableProps } from "react-native";
import { ActivityIndicator, Pressable, StyleSheet } from "react-native";

import { AppText } from "@/components/ui";
import { colors, fontWeight, spacing } from "@/theme";

type AuthSubmitButtonProps = {
  disabled: boolean;
  label: string;
  loading: boolean;
  onPress: PressableProps["onPress"];
  testID?: string;
};

export function AuthSubmitButton({
  disabled,
  label,
  loading,
  onPress,
  testID = "submit-button"
}: AuthSubmitButtonProps) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{
        busy: loading,
        disabled
      }}
      disabled={disabled}
      onPress={onPress}
      style={[styles.button, disabled ? styles.buttonDisabled : undefined]}
      testID={testID}
    >
      {loading ? (
        <ActivityIndicator color={colors.neutrals[900]} size="small" />
      ) : (
        <AppText style={styles.buttonText} variant="buttonLarge">
          {label}
        </AppText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    backgroundColor: colors.primary[500],
    borderRadius: 28,
    justifyContent: "center",
    marginTop: spacing[2],
    minHeight: 56,
    width: "100%"
  },
  buttonDisabled: {
    opacity: 0.6
  },
  buttonText: {
    color: colors.neutrals[900],
    fontWeight: fontWeight.bold
  }
});

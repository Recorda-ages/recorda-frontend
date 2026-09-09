import type { ReactNode } from "react";
import type { StyleProp, TextInputProps, ViewStyle } from "react-native";
import { StyleSheet, TextInput, View } from "react-native";

import { baseColors, colors, radius, semanticColors, spacing, typography } from "@/theme";

import { AppText } from "./Text";

export type InputVariant = "default" | "dark";

export type InputProps = TextInputProps & {
  containerStyle?: StyleProp<ViewStyle>;
  error?: string;
  inputContainerStyle?: StyleProp<ViewStyle>;
  label?: string;
  rightAccessory?: ReactNode;
  variant?: InputVariant;
};

export function Input({
  containerStyle,
  error,
  inputContainerStyle,
  label,
  rightAccessory,
  style,
  variant = "default",
  ...props
}: InputProps) {
  const isDark = variant === "dark";
  const defaultPlaceholderColor = isDark ? colors.neutrals[400] : semanticColors.textDisabled;

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? (
        <AppText
          color={isDark ? "muted" : "default"}
          style={isDark ? styles.darkLabel : undefined}
          variant="body2"
        >
          {label}
        </AppText>
      ) : null}

      <View
        style={[
          styles.inputFrame,
          isDark ? styles.darkFrame : styles.defaultFrame,
          error ? (isDark ? styles.darkFrameError : styles.defaultFrameError) : undefined,
          inputContainerStyle
        ]}
      >
        <TextInput
          accessibilityHint={error}
          accessibilityLabel={props.accessibilityLabel ?? label}
          placeholderTextColor={props.placeholderTextColor ?? defaultPlaceholderColor}
          style={[styles.input, isDark ? styles.darkInput : styles.defaultInput, style]}
          {...props}
        />
        {rightAccessory ? <View style={styles.accessory}>{rightAccessory}</View> : null}
      </View>

      {error ? (
        <AppText
          accessibilityLiveRegion="polite"
          style={isDark ? styles.darkError : styles.defaultError}
          variant="caption"
        >
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  accessory: {
    alignItems: "center",
    justifyContent: "center",
    marginLeft: spacing[2]
  },
  container: {
    gap: spacing[1]
  },
  darkError: {
    color: colors.error[200]
  },
  darkFrame: {
    backgroundColor: "rgba(41, 41, 41, 0.92)",
    borderColor: colors.primary[100],
    borderRadius: 16,
    borderWidth: 1.5,
    minHeight: 56,
    paddingHorizontal: spacing[4]
  },
  darkFrameError: {
    borderColor: colors.error[200]
  },
  darkInput: {
    color: baseColors.white
  },
  darkLabel: {
    color: colors.neutrals[200]
  },
  defaultError: {
    color: semanticColors.error
  },
  defaultFrame: {
    backgroundColor: semanticColors.background,
    borderColor: semanticColors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    minHeight: 48,
    paddingHorizontal: spacing[3]
  },
  defaultFrameError: {
    borderColor: semanticColors.error
  },
  defaultInput: {
    color: semanticColors.textPrimary
  },
  input: {
    flex: 1,
    paddingVertical: spacing[2],
    ...typography.body1
  },
  inputFrame: {
    alignItems: "center",
    flexDirection: "row"
  }
});

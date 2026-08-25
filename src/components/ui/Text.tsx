import type { TextProps as NativeTextProps } from "react-native";
import { StyleSheet, Text as NativeText } from "react-native";

import { semanticColors, typography } from "@/theme";

type TextColor = "default" | "muted" | "primary";
type TypographyVariant = keyof typeof typography;

type AppTextProps = NativeTextProps & {
  color?: TextColor;
  variant?: TypographyVariant;
};

export function Text({ color = "default", style, variant = "body1", ...props }: AppTextProps) {
  return (
    <NativeText style={[styles.base, typography[variant], colorStyles[color], style]} {...props} />
  );
}

export const AppText = Text;

const styles = StyleSheet.create({
  base: {
    color: semanticColors.textPrimary
  }
});

const colorStyles = StyleSheet.create({
  default: {
    color: semanticColors.textPrimary
  },
  muted: {
    color: semanticColors.textSecondary
  },
  primary: {
    color: semanticColors.actionPrimary
  }
});

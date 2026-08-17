import type { TextProps as NativeTextProps } from "react-native";
import { StyleSheet, Text as NativeText } from "react-native";

import { colors, typography } from "@/theme";

type TextColor = "default" | "muted" | "primary";
type TextVariant = "caption" | "body" | "label" | "subtitle" | "title" | "button";

type AppTextProps = NativeTextProps & {
  color?: TextColor;
  variant?: TextVariant;
};

export function AppText({ color = "default", style, variant = "body", ...props }: AppTextProps) {
  return (
    <NativeText
      style={[styles.base, variantStyles[variant], colorStyles[color], style]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    color: colors.text
  }
});

const variantStyles = StyleSheet.create({
  body: {
    fontSize: typography.size.md,
    lineHeight: typography.lineHeight.md
  },
  button: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    lineHeight: typography.lineHeight.md
  },
  caption: {
    fontSize: typography.size.xs,
    lineHeight: typography.lineHeight.xs
  },
  label: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    lineHeight: typography.lineHeight.sm
  },
  subtitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    lineHeight: typography.lineHeight.lg
  },
  title: {
    fontSize: typography.size.xxl,
    fontWeight: typography.weight.bold,
    lineHeight: typography.lineHeight.xxl
  }
});

const colorStyles = StyleSheet.create({
  default: {
    color: colors.text
  },
  muted: {
    color: colors.muted
  },
  primary: {
    color: colors.primary
  }
});

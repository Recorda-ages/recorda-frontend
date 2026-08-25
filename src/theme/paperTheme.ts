import { DefaultTheme as NavigationDefaultTheme } from "@react-navigation/native";
import type { Theme as NavigationTheme } from "@react-navigation/native";
import { configureFonts, MD3LightTheme } from "react-native-paper";
import type { MD3Theme } from "react-native-paper";

import { colors } from "./colors";
import { radius } from "./radius";
import { typography } from "./typography";

const paperFonts = configureFonts({
  config: {
    bodyLarge: {
      fontSize: typography.size.md,
      fontWeight: typography.weight.regular,
      letterSpacing: 0,
      lineHeight: typography.lineHeight.md
    },
    bodyMedium: {
      fontSize: typography.size.sm,
      fontWeight: typography.weight.regular,
      letterSpacing: 0,
      lineHeight: typography.lineHeight.sm
    },
    bodySmall: {
      fontSize: typography.size.xs,
      fontWeight: typography.weight.regular,
      letterSpacing: 0,
      lineHeight: typography.lineHeight.xs
    },
    displayLarge: {
      fontSize: typography.size.xxl,
      fontWeight: typography.weight.bold,
      letterSpacing: 0,
      lineHeight: typography.lineHeight.xxl
    },
    displayMedium: {
      fontSize: typography.size.xxl,
      fontWeight: typography.weight.bold,
      letterSpacing: 0,
      lineHeight: typography.lineHeight.xxl
    },
    displaySmall: {
      fontSize: typography.size.xl,
      fontWeight: typography.weight.bold,
      letterSpacing: 0,
      lineHeight: typography.lineHeight.xl
    },
    headlineLarge: {
      fontSize: typography.size.xl,
      fontWeight: typography.weight.bold,
      letterSpacing: 0,
      lineHeight: typography.lineHeight.xl
    },
    headlineMedium: {
      fontSize: typography.size.lg,
      fontWeight: typography.weight.bold,
      letterSpacing: 0,
      lineHeight: typography.lineHeight.lg
    },
    headlineSmall: {
      fontSize: typography.size.lg,
      fontWeight: typography.weight.medium,
      letterSpacing: 0,
      lineHeight: typography.lineHeight.lg
    },
    labelLarge: {
      fontSize: typography.size.md,
      fontWeight: typography.weight.bold,
      letterSpacing: 0,
      lineHeight: typography.lineHeight.md
    },
    labelMedium: {
      fontSize: typography.size.sm,
      fontWeight: typography.weight.medium,
      letterSpacing: 0,
      lineHeight: typography.lineHeight.sm
    },
    labelSmall: {
      fontSize: typography.size.xs,
      fontWeight: typography.weight.medium,
      letterSpacing: 0,
      lineHeight: typography.lineHeight.xs
    },
    titleLarge: {
      fontSize: typography.size.lg,
      fontWeight: typography.weight.bold,
      letterSpacing: 0,
      lineHeight: typography.lineHeight.lg
    },
    titleMedium: {
      fontSize: typography.size.md,
      fontWeight: typography.weight.medium,
      letterSpacing: 0,
      lineHeight: typography.lineHeight.md
    },
    titleSmall: {
      fontSize: typography.size.sm,
      fontWeight: typography.weight.medium,
      letterSpacing: 0,
      lineHeight: typography.lineHeight.sm
    }
  }
});

export const paperTheme: MD3Theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    background: colors.background,
    error: colors.danger,
    errorContainer: colors.dangerSurface,
    onBackground: colors.text,
    onErrorContainer: colors.danger,
    onPrimary: colors.onPrimary,
    onSurface: colors.text,
    onSurfaceVariant: colors.muted,
    outline: colors.border,
    outlineVariant: colors.border,
    primary: colors.primary,
    surface: colors.surface,
    surfaceVariant: colors.surfaceMuted
  },
  fonts: paperFonts,
  roundness: radius.md
};

export const navigationTheme: NavigationTheme = {
  ...NavigationDefaultTheme,
  colors: {
    ...NavigationDefaultTheme.colors,
    background: colors.background,
    border: colors.border,
    card: colors.surface,
    notification: colors.danger,
    primary: colors.primary,
    text: colors.text
  }
};

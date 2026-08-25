import { DefaultTheme as NavigationDefaultTheme } from "@react-navigation/native";
import type { Theme as NavigationTheme } from "@react-navigation/native";
import { configureFonts, MD3LightTheme } from "react-native-paper";
import type { MD3Theme } from "react-native-paper";

import { baseColors, semanticColors } from "./colors";
import { radius } from "./radius";
import { fontWeight, typography } from "./typography";

const paperFonts = configureFonts({
  config: {
    bodyLarge: {
      fontFamily: typography.body1.fontFamily,
      fontSize: typography.body1.fontSize,
      fontWeight: fontWeight.regular
    },
    bodyMedium: {
      fontFamily: typography.body1.fontFamily,
      fontSize: typography.body1.fontSize,
      fontWeight: fontWeight.regular
    },
    bodySmall: {
      fontFamily: typography.body2.fontFamily,
      fontSize: typography.body2.fontSize,
      fontWeight: fontWeight.regular
    },
    displayLarge: {
      fontFamily: typography.title.fontFamily,
      fontSize: typography.title.fontSize,
      fontWeight: fontWeight.bold
    },
    displayMedium: {
      fontFamily: typography.headline1.fontFamily,
      fontSize: typography.headline1.fontSize,
      fontWeight: fontWeight.regular
    },
    displaySmall: {
      fontFamily: typography.headline2.fontFamily,
      fontSize: typography.headline2.fontSize,
      fontWeight: fontWeight.regular
    },
    headlineLarge: {
      fontFamily: typography.headline1.fontFamily,
      fontSize: typography.headline1.fontSize,
      fontWeight: fontWeight.regular
    },
    headlineMedium: {
      fontFamily: typography.headline2.fontFamily,
      fontSize: typography.headline2.fontSize,
      fontWeight: fontWeight.regular
    },
    headlineSmall: {
      fontFamily: typography.headline3.fontFamily,
      fontSize: typography.headline3.fontSize,
      fontWeight: fontWeight.regular
    },
    labelLarge: {
      fontFamily: typography.buttonLarge.fontFamily,
      fontSize: typography.buttonLarge.fontSize,
      fontWeight: fontWeight.semiBold
    },
    labelMedium: {
      fontFamily: typography.buttonSmall.fontFamily,
      fontSize: typography.buttonSmall.fontSize,
      fontWeight: fontWeight.semiBold
    },
    labelSmall: {
      fontFamily: typography.caption.fontFamily,
      fontSize: typography.caption.fontSize,
      fontWeight: fontWeight.regular
    },
    titleLarge: {
      fontFamily: typography.headline4.fontFamily,
      fontSize: typography.headline4.fontSize,
      fontWeight: fontWeight.regular
    },
    titleMedium: {
      fontFamily: typography.body1.fontFamily,
      fontSize: typography.body1.fontSize,
      fontWeight: fontWeight.regular
    },
    titleSmall: {
      fontFamily: typography.body2.fontFamily,
      fontSize: typography.body2.fontSize,
      fontWeight: fontWeight.regular
    }
  }
});

export const paperTheme: MD3Theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    background: semanticColors.background,
    error: semanticColors.error,
    errorContainer: MD3LightTheme.colors.errorContainer,
    onBackground: semanticColors.textPrimary,
    onErrorContainer: semanticColors.error,
    onPrimary: baseColors.black,
    onSurface: semanticColors.textPrimary,
    onSurfaceVariant: semanticColors.textSecondary,
    outline: semanticColors.border,
    outlineVariant: semanticColors.border,
    primary: semanticColors.actionPrimary,
    surface: semanticColors.surface,
    surfaceVariant: semanticColors.surface
  },
  fonts: paperFonts,
  roundness: radius.md
};

export const navigationTheme: NavigationTheme = {
  ...NavigationDefaultTheme,
  colors: {
    ...NavigationDefaultTheme.colors,
    background: semanticColors.background,
    border: semanticColors.border,
    card: semanticColors.surface,
    notification: semanticColors.error,
    primary: semanticColors.actionPrimary,
    text: semanticColors.textPrimary
  }
};

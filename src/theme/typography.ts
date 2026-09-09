import type { TextStyle } from "react-native";

export const fontFamily = {
  primary: {
    regular: "Inter_400Regular",
    semiBold: "Inter_600SemiBold",
    bold: "Inter_700Bold"
  },
  display: {
    regular: "BaiJamjuree_400Regular",
    medium: "BaiJamjuree_500Medium",
    semiBold: "BaiJamjuree_600SemiBold",
    bold: "BaiJamjuree_700Bold"
  }
} as const;

export const fontWeight = {
  regular: "400",
  semiBold: "600",
  bold: "700"
} as const;

// lineHeight and letterSpacing are intentionally absent until synced from Figma.
// Variant-specific weights for Headline/Body/Caption still need Figma confirmation.
export const typography = {
  headline1: {
    fontFamily: fontFamily.primary.regular,
    fontSize: 32
  },
  headline2: {
    fontFamily: fontFamily.primary.regular,
    fontSize: 28
  },
  headline3: {
    fontFamily: fontFamily.primary.regular,
    fontSize: 24
  },
  headline4: {
    fontFamily: fontFamily.primary.regular,
    fontSize: 20
  },
  body1: {
    fontFamily: fontFamily.primary.regular,
    fontSize: 14
  },
  body2: {
    fontFamily: fontFamily.primary.regular,
    fontSize: 12
  },
  caption: {
    fontFamily: fontFamily.primary.regular,
    fontSize: 10
  },
  buttonLarge: {
    fontFamily: fontFamily.primary.semiBold,
    fontSize: 16
  },
  buttonSmall: {
    fontFamily: fontFamily.primary.semiBold,
    fontSize: 12
  },
  title: {
    fontFamily: fontFamily.display.bold,
    fontSize: 32
  }
} as const satisfies Record<string, TextStyle>;

export const colors = {
  primary: {
    100: "#CCF9EE",
    200: "#99F3DD",
    300: "#66EECB",
    400: "#33E8BA",
    500: "#00E2A9",
    600: "#00B587",
    700: "#008865",
    800: "#005A44",
    900: "#002D22"
  },

  secondary: {
    100: "#F4FFFC",
    200: "#EAFFF9",
    300: "#DFFFF7",
    400: "#D5FFF4",
    500: "#CAFFF1",
    600: "#A2CCC1",
    700: "#799991",
    800: "#516660",
    900: "#283330"
  },

  neutrals: {
    100: "#EAEAEA",
    200: "#BFBFBF",
    300: "#A9A9A9",
    400: "#7F7F7F",
    500: "#696969",
    600: "#545454",
    700: "#3E3E3E",
    800: "#292929",
    900: "#151515"
  },

  success: {
    100: "#D8F1E8",
    200: "#77CDAE",
    300: "#38AA81",
    400: "#17694C",
    500: "#12372A"
  },

  info: {
    100: "#CFEEF5",
    200: "#6FCDE2",
    300: "#0FACCE",
    400: "#09677C",
    500: "#064552"
  },

  warning: {
    100: "#FFF6D7",
    200: "#FFECAE",
    300: "#FFD035",
    400: "#997D20",
    500: "#665315"
  },

  error: {
    100: "#FADFDC",
    200: "#EF9E97",
    300: "#E45D51",
    400: "#A04139",
    500: "#5B2520"
  }
} as const;

export const baseColors = {
  white: "#FFFFFF",
  black: "#000000",
  transparent: "transparent"
} as const;

export const semanticColors = {
  background: baseColors.white,
  surface: colors.secondary[100],

  textPrimary: colors.neutrals[900],
  textSecondary: colors.neutrals[600],
  textDisabled: colors.neutrals[300],

  border: colors.neutrals[200],

  actionPrimary: colors.primary[500],
  actionPrimaryPressed: colors.primary[600],
  actionPrimaryDisabled: colors.primary[200],

  success: colors.success[300],
  info: colors.info[300],
  warning: colors.warning[300],
  error: colors.error[300]
} as const;

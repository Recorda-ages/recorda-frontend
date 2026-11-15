import { StyleSheet } from "react-native";

import { baseColors, colors, fontFamily, radius, spacing } from "@/theme";

/**
 * Layout, typography and action colors shared by confirmation dialogs with a destructive
 * primary action. Feature-specific extras (e.g. an error line) remain in each dialog.
 */
export const destructiveDialogStyles = StyleSheet.create({
  actions: {
    flexDirection: "row",
    gap: spacing[3],
    width: "100%"
  },
  backdrop: {
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.74)",
    flex: 1,
    justifyContent: "center",
    padding: spacing[6]
  },
  button: {
    alignItems: "center",
    borderCurve: "continuous",
    borderRadius: radius.xl,
    flex: 1,
    justifyContent: "center",
    minHeight: 48
  },
  cancelButton: {
    backgroundColor: colors.neutrals[600],
    borderColor: colors.neutrals[400],
    borderWidth: 1
  },
  cancelLabel: {
    color: colors.neutrals[100]
  },
  confirmButton: {
    backgroundColor: colors.error[300]
  },
  confirmLabel: {
    color: baseColors.white
  },
  copy: {
    alignItems: "center",
    gap: spacing[2]
  },
  dialog: {
    alignItems: "center",
    backgroundColor: colors.neutrals[800],
    borderCurve: "continuous",
    borderRadius: 32,
    gap: spacing[4],
    maxWidth: 520,
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[5],
    width: "100%"
  },
  iconBox: {
    alignItems: "center",
    backgroundColor: colors.error[300],
    borderCurve: "continuous",
    borderRadius: radius.xl,
    height: 56,
    justifyContent: "center",
    width: 56
  },
  message: {
    color: colors.neutrals[300],
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center"
  },
  pressed: {
    opacity: 0.82
  },
  title: {
    color: colors.neutrals[100],
    fontFamily: fontFamily.primary.semiBold,
    fontSize: 20,
    textAlign: "center"
  }
});

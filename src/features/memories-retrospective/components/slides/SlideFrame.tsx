import type { PropsWithChildren } from "react";
import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui";
import { baseColors, colors, fontFamily, radius, spacing, withOpacity } from "@/theme";

type SlideFrameProps = PropsWithChildren<
  Readonly<{
    eyebrow: string;
    subtitle?: string;
    title: string;
  }>
>;

/** Cabeçalho comum dos slides: rótulo verde, título grande e subtítulo. */
export function SlideFrame({ children, eyebrow, subtitle, title }: SlideFrameProps) {
  return (
    <View style={styles.frame}>
      <AppText style={styles.eyebrow} variant="buttonSmall">
        {eyebrow}
      </AppText>
      <AppText style={styles.title} variant="headline2">
        {title}
      </AppText>
      {subtitle ? (
        <AppText style={styles.subtitle} variant="body1">
          {subtitle}
        </AppText>
      ) : null}
      <View style={styles.body}>{children}</View>
    </View>
  );
}

/** Card escuro com borda, usado nos rankings e números. */
export const slideStyles = StyleSheet.create({
  card: {
    backgroundColor: withOpacity(baseColors.white, 0.06),
    borderColor: withOpacity(colors.primary[500], 0.5),
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing[4]
  },
  muted: {
    color: colors.neutrals[300]
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing[3]
  },
  value: {
    color: colors.primary[500]
  },
  white: {
    color: baseColors.white
  }
});

const styles = StyleSheet.create({
  body: {
    gap: spacing[3],
    marginTop: spacing[6]
  },
  eyebrow: {
    color: colors.primary[500],
    textTransform: "uppercase"
  },
  frame: {
    flex: 1,
    paddingHorizontal: spacing[4]
  },
  subtitle: {
    color: colors.neutrals[300],
    marginTop: spacing[2]
  },
  title: {
    color: baseColors.white,
    fontFamily: fontFamily.primary.extraBold,
    marginTop: spacing[2]
  }
});

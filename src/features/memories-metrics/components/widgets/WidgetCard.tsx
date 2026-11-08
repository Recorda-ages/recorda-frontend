import type { PropsWithChildren } from "react";
import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { AppText } from "@/components/ui";
import { colors, fontFamily, radius, spacing } from "@/theme";

type WidgetCardProps = PropsWithChildren<{
  testID: string;
  title: string;
}>;

export function WidgetCard({ children, testID, title }: Readonly<WidgetCardProps>) {
  const { i18n } = useTranslation();

  return (
    <View style={styles.card} testID={testID}>
      <AppText style={styles.title} variant="caption">
        {title.toLocaleUpperCase(i18n.language)}
      </AppText>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.neutrals[800],
    borderRadius: radius.lg,
    gap: spacing[3],
    padding: spacing[4]
  },
  title: {
    color: colors.primary[300],
    fontFamily: fontFamily.primary.semiBold,
    letterSpacing: 0.6
  }
});

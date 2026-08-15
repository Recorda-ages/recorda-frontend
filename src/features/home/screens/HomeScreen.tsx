import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { AppText, Button, Screen } from "@/components/ui";
import { spacing } from "@/theme";

export function HomeScreen() {
  const { t } = useTranslation();

  return (
    <Screen contentContainerStyle={styles.content} testID="home-screen">
      <View style={styles.hero}>
        <AppText variant="title">{t("home.title")}</AppText>
        <AppText color="muted">{t("home.subtitle")}</AppText>
      </View>

      <View style={styles.actions}>
        <Button label={t("home.primaryAction")} onPress={() => undefined} />
        <Button label={t("home.secondaryAction")} onPress={() => undefined} variant="secondary" />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: spacing.sm,
    width: "100%"
  },
  content: {
    gap: spacing.xl,
    justifyContent: "center"
  },
  hero: {
    gap: spacing.sm
  }
});

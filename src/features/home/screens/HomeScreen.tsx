import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/app/navigation/RootNavigator";

import { AppText, Button, Screen } from "@/components/ui";
import { spacing } from "@/theme";

export function HomeScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <Screen contentContainerStyle={styles.content} testID="home-screen">
      <View style={styles.hero}>
        <AppText variant="title">{t("home.title")}</AppText>
        <AppText color="muted">{t("home.subtitle")}</AppText>
      </View>

      <View style={styles.actions}>
        {__DEV__ ? (
          <Button
            label={t("onboarding.music.preview")}
            onPress={() => navigation.navigate("OnboardingMusicPreview")}
          />
        ) : null}
        <Button label={t("home.primaryAction")} onPress={() => undefined} />
        <Button label={t("home.secondaryAction")} onPress={() => undefined} variant="secondary" />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: spacing[2],
    width: "100%"
  },
  content: {
    gap: spacing[8],
    justifyContent: "center"
  },
  hero: {
    gap: spacing[2]
  }
});

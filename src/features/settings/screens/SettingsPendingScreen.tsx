import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { StyleSheet } from "react-native";

import type { RootStackParamList } from "@/app/navigation/RootNavigator";
import { AppText, Button, Screen } from "@/components/ui";
import { colors } from "@/theme";

export function SettingsPendingScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, "SettingsPending">>();
  return (
    <Screen style={styles.screen}>
      <AppText style={styles.title} variant="headline3">
        {t(`settings.${route.params.destination}`)}
      </AppText>
      <AppText style={styles.message}>{t("settings.pending")}</AppText>
      <Button label={t("settings.back")} onPress={() => navigation.goBack()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.neutrals[900] },
  title: { color: colors.neutrals[100] },
  message: { color: colors.neutrals[300], marginVertical: 24 }
});

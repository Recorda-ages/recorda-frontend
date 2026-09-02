import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Pressable, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import type { RootStackParamList } from "@/app/navigation/RootNavigator";
import { AppText, Button, Input, Screen } from "@/components/ui";
import { spacing } from "@/theme";

type LoginScreenProps = NativeStackScreenProps<RootStackParamList, "Login">;

export function LoginScreen({ navigation }: LoginScreenProps) {
  const { t } = useTranslation();

  return (
    <Screen contentContainerStyle={styles.content} testID="login-screen">
      <View style={styles.header}>
        <AppText variant="title">{t("auth.login.title")}</AppText>
        <AppText color="muted">{t("auth.login.subtitle")}</AppText>
      </View>

      <View style={styles.form}>
        <Input
          accessibilityLabel={t("auth.login.email")}
          autoCapitalize="none"
          keyboardType="email-address"
          label={t("auth.login.email")}
          textContentType="emailAddress"
        />
        <Input
          accessibilityLabel={t("auth.login.password")}
          label={t("auth.login.password")}
          secureTextEntry
          textContentType="password"
        />
        <Pressable
          accessibilityLabel={t("auth.login.forgotPassword")}
          accessibilityRole="button"
          onPress={() => navigation.navigate("PasswordRecovery")}
          style={styles.forgotPassword}
        >
          <AppText color="primary" variant="body2">
            {t("auth.login.forgotPassword")}
          </AppText>
        </Pressable>
      </View>

      <Button label={t("auth.login.submit")} onPress={() => undefined} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing[8],
    justifyContent: "center"
  },
  forgotPassword: {
    alignSelf: "flex-end",
    paddingVertical: spacing[1]
  },
  form: {
    gap: spacing[3]
  },
  header: {
    gap: spacing[2]
  }
});

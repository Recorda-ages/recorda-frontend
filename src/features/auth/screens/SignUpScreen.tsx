import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";

import type { RootStackParamList } from "@/app/navigation/RootNavigator";
import { AppText, Input } from "@/components/ui";
import { ApiError } from "@/services/api/errors";
import { baseColors, colors, fontWeight, spacing } from "@/theme";

import { useSignUpMutation } from "../hooks/useSignUpMutation";
import { signUpSchema, type SignUpFormValues } from "../validation/signUpSchema";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "SignUp">;

export function SignUpScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp>();
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const signUpMutation = useSignUpMutation();

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors }
  } = useForm<SignUpFormValues>({
    defaultValues: {
      email: "",
      name: "",
      password: "",
      username: ""
    },
    mode: "onBlur",
    resolver: zodResolver(signUpSchema)
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);

    try {
      await signUpMutation.mutateAsync({
        email: values.email.trim(),
        name: values.name.trim(),
        password: values.password,
        username: values.username.trim()
      });

      navigation.reset({
        index: 0,
        routes: [{ name: "Onboarding" }]
      });
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 409 || error.code === "CONFLICT") {
          const details = error.details as {
            fields?: { field?: string; message?: string }[];
          } | null;
          let mapped = false;

          if (details?.fields && Array.isArray(details.fields)) {
            for (const item of details.fields) {
              if (item.field === "username" || item.field === "email") {
                setError(item.field, { message: item.message ?? "Valor já cadastrado." });
                mapped = true;
              }
            }
          }

          if (!mapped) {
            const msg = error.message.toLowerCase();
            if (msg.includes("usuário") || msg.includes("username")) {
              setError("username", { message: "Este usuário já está cadastrado." });
            } else if (msg.includes("email") || msg.includes("e-mail")) {
              setError("email", { message: "Este email já está cadastrado." });
            } else {
              setFormError(error.message);
            }
          }
          return;
        }

        if (error.status === 422) {
          const details = error.details as {
            fields?: { field?: string; message?: string }[];
          } | null;
          if (details?.fields && Array.isArray(details.fields)) {
            for (const item of details.fields) {
              if (
                item.field === "name" ||
                item.field === "username" ||
                item.field === "email" ||
                item.field === "password"
              ) {
                setError(item.field, { message: item.message ?? "Campo inválido." });
              }
            }
            return;
          }
        }

        if (error.code === "NETWORK_ERROR" || error.status === 0) {
          setFormError(t("auth.signUp.networkError"));
          return;
        }

        setFormError(error.message || t("auth.signUp.networkError"));
        return;
      }

      setFormError(t("auth.signUp.networkError"));
    }
  });

  return (
    <View style={styles.screen} testID="sign-up-screen">
      <StatusBar style="light" />
      <Image
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        resizeMode="contain"
        source={require("@/assets/images/glow.png")}
        style={styles.radialGlowTop}
      />
      <Image
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        resizeMode="contain"
        source={require("@/assets/images/glow.png")}
        style={styles.radialGlowBottom}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardAvoiding}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          contentInsetAdjustmentBehavior="automatic"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <AppText style={styles.logo} variant="title">
              {t("auth.signUp.logo")}
            </AppText>
            <AppText style={styles.title} variant="headline1">
              {t("auth.signUp.title")}
            </AppText>
            <AppText style={styles.subtitle} variant="body1">
              {t("auth.signUp.subtitle")}
            </AppText>
          </View>

          <View style={styles.form}>
            <Controller
              control={control}
              name="name"
              render={({ field: { onBlur, onChange, value } }) => (
                <Input
                  accessibilityHint={errors.name?.message}
                  accessibilityLabel={t("auth.signUp.name")}
                  autoCapitalize="words"
                  autoComplete="name"
                  error={errors.name?.message}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  placeholder={t("auth.signUp.name")}
                  testID="input-name"
                  textContentType="name"
                  value={value}
                  variant="dark"
                />
              )}
            />

            <Controller
              control={control}
              name="username"
              render={({ field: { onBlur, onChange, value } }) => (
                <Input
                  accessibilityHint={errors.username?.message}
                  accessibilityLabel={t("auth.signUp.username")}
                  autoCapitalize="none"
                  autoCorrect={false}
                  error={errors.username?.message}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  placeholder={t("auth.signUp.username")}
                  testID="input-username"
                  textContentType="username"
                  value={value}
                  variant="dark"
                />
              )}
            />

            <Controller
              control={control}
              name="email"
              render={({ field: { onBlur, onChange, value } }) => (
                <Input
                  accessibilityHint={errors.email?.message}
                  accessibilityLabel={t("auth.signUp.email")}
                  autoCapitalize="none"
                  autoComplete="email"
                  autoCorrect={false}
                  error={errors.email?.message}
                  keyboardType="email-address"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  placeholder={t("auth.signUp.email")}
                  testID="input-email"
                  textContentType="emailAddress"
                  value={value}
                  variant="dark"
                />
              )}
            />

            <Controller
              control={control}
              name="password"
              render={({ field: { onBlur, onChange, value } }) => (
                <Input
                  accessibilityHint={errors.password?.message}
                  accessibilityLabel={t("auth.signUp.password")}
                  autoCapitalize="none"
                  autoCorrect={false}
                  error={errors.password?.message}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  placeholder={t("auth.signUp.password")}
                  rightAccessory={
                    <Pressable
                      accessibilityLabel={
                        showPassword ? t("auth.signUp.hidePassword") : t("auth.signUp.showPassword")
                      }
                      accessibilityRole="button"
                      hitSlop={12}
                      onPress={() => setShowPassword((prev) => !prev)}
                      style={styles.eyeButton}
                      testID="toggle-password-visibility"
                    >
                      <View style={styles.eyeIconContainer}>
                        <View style={styles.eyeOuter}>
                          <View style={styles.eyePupil} />
                        </View>
                        {!showPassword ? <View style={styles.eyeSlash} /> : null}
                      </View>
                    </Pressable>
                  }
                  secureTextEntry={!showPassword}
                  testID="input-password"
                  textContentType="newPassword"
                  value={value}
                  variant="dark"
                />
              )}
            />

            {formError ? (
              <AppText accessibilityLiveRegion="polite" style={styles.formError} variant="body2">
                {formError}
              </AppText>
            ) : null}

            <Pressable
              accessibilityLabel={t("auth.signUp.submit")}
              accessibilityRole="button"
              accessibilityState={{
                busy: signUpMutation.isPending,
                disabled: signUpMutation.isPending
              }}
              disabled={signUpMutation.isPending}
              onPress={onSubmit}
              style={[
                styles.submitButton,
                signUpMutation.isPending ? styles.submitButtonDisabled : undefined
              ]}
              testID="submit-button"
            >
              {signUpMutation.isPending ? (
                <ActivityIndicator color={colors.neutrals[900]} size="small" />
              ) : (
                <AppText style={styles.submitButtonText} variant="buttonLarge">
                  {t("auth.signUp.submit")}
                </AppText>
              )}
            </Pressable>
          </View>

          <View style={styles.footer}>
            <AppText style={styles.footerText} variant="body2">
              {t("auth.signUp.hasAccount")}{" "}
            </AppText>
            <Pressable
              accessibilityLabel={t("auth.signUp.loginAction")}
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => navigation.navigate("SignIn")}
              testID="login-link"
            >
              <AppText style={styles.footerLink} variant="body2">
                {t("auth.signUp.loginAction")}
              </AppText>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  eyeButton: {
    alignItems: "center",
    height: 32,
    justifyContent: "center",
    width: 32
  },
  eyeIconContainer: {
    alignItems: "center",
    height: 18,
    justifyContent: "center",
    width: 24
  },
  eyeOuter: {
    alignItems: "center",
    borderColor: colors.neutrals[300],
    borderRadius: 9,
    borderWidth: 1.8,
    height: 14,
    justifyContent: "center",
    width: 22
  },
  eyePupil: {
    backgroundColor: colors.neutrals[300],
    borderRadius: 3,
    height: 6,
    width: 6
  },
  eyeSlash: {
    backgroundColor: colors.neutrals[300],
    height: 2,
    position: "absolute",
    transform: [{ rotate: "-45deg" }],
    width: 22
  },
  footer: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    marginTop: spacing[4],
    paddingBottom: spacing[6]
  },
  footerLink: {
    color: colors.primary[500],
    fontWeight: fontWeight.bold
  },
  footerText: {
    color: colors.neutrals[100]
  },
  form: {
    gap: spacing[4],
    width: "100%"
  },
  formError: {
    color: colors.error[200],
    textAlign: "center"
  },
  header: {
    gap: spacing[2],
    paddingTop: spacing[4]
  },
  keyboardAvoiding: {
    flex: 1
  },
  logo: {
    color: colors.primary[500],
    fontFamily: "Inter_700Bold",
    fontSize: 38,
    fontStyle: "italic",
    letterSpacing: -1
  },
  radialGlowBottom: {
    bottom: -150,
    height: 480,
    left: -150,
    opacity: 0.4,
    pointerEvents: "none",
    position: "absolute",
    width: 480
  },
  radialGlowTop: {
    height: 520,
    opacity: 0.5,
    pointerEvents: "none",
    position: "absolute",
    right: -150,
    top: -150,
    width: 520
  },
  screen: {
    backgroundColor: baseColors.black,
    flex: 1
  },
  scrollContent: {
    flexGrow: 1,
    gap: spacing[8],
    justifyContent: "center",
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[8]
  },
  submitButton: {
    alignItems: "center",
    backgroundColor: colors.primary[500],
    borderRadius: 28,
    justifyContent: "center",
    marginTop: spacing[2],
    minHeight: 56,
    width: "100%"
  },
  submitButtonDisabled: {
    opacity: 0.6
  },
  submitButtonText: {
    color: colors.neutrals[900],
    fontWeight: fontWeight.bold
  },
  subtitle: {
    color: colors.neutrals[200],
    fontSize: 16,
    lineHeight: 22
  },
  title: {
    color: baseColors.white,
    fontSize: 34,
    fontWeight: fontWeight.bold,
    lineHeight: 40
  }
});

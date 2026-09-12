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

import { useSignInMutation } from "../hooks/useSignInMutation";
import { signInSchema, type SignInFormValues } from "../validation/signInSchema";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "SignIn">;

const GENERIC_ERROR_MESSAGE = "Usuário ou senha inválidos.";

export function SignInScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp>();
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const signInMutation = useSignInMutation();

  const {
    control,
    handleSubmit,
    formState: { errors }
  } = useForm<SignInFormValues>({
    defaultValues: {
      password: "",
      username: ""
    },
    mode: "onBlur",
    resolver: zodResolver(signInSchema)
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);

    try {
      const response = await signInMutation.mutateAsync({
        password: values.password,
        username: values.username.trim()
      });

      const destination = response.user.account_type === "admin" ? "Admin" : "Home";

      navigation.reset({
        index: 0,
        routes: [{ name: destination }]
      });
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.code === "NETWORK_ERROR" || error.status === 0) {
          setFormError(t("auth.signIn.networkError"));
          return;
        }
      }

      setFormError(GENERIC_ERROR_MESSAGE);
    }
  });

  return (
    <View style={styles.screen} testID="sign-in-screen">
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
              {t("auth.signIn.logo")}
            </AppText>
            <AppText style={styles.title} variant="headline1">
              {t("auth.signIn.title")}
            </AppText>
            <AppText style={styles.subtitle} variant="body1">
              {t("auth.signIn.subtitle")}
            </AppText>
          </View>

          <View style={styles.form}>
            <Controller
              control={control}
              name="username"
              render={({ field: { onBlur, onChange, value } }) => (
                <Input
                  accessibilityHint={errors.username?.message}
                  accessibilityLabel={t("auth.signIn.username")}
                  autoCapitalize="none"
                  autoCorrect={false}
                  error={errors.username?.message}
                  leftAccessory={
                    <View style={styles.personIconContainer}>
                      <View style={styles.personHead} />
                      <View style={styles.personBody} />
                    </View>
                  }
                  onBlur={onBlur}
                  onChangeText={onChange}
                  placeholder={t("auth.signIn.username")}
                  testID="input-username"
                  textContentType="username"
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
                  accessibilityLabel={t("auth.signIn.password")}
                  autoCapitalize="none"
                  autoCorrect={false}
                  error={errors.password?.message}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  placeholder={t("auth.signIn.password")}
                  rightAccessory={
                    <Pressable
                      accessibilityLabel={
                        showPassword ? t("auth.signIn.hidePassword") : t("auth.signIn.showPassword")
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
                  textContentType="password"
                  value={value}
                  variant="dark"
                />
              )}
            />

            <Pressable
              accessibilityLabel={t("auth.signIn.forgotPassword")}
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => navigation.navigate("ForgotPassword")}
              style={styles.forgotPasswordLink}
              testID="forgot-password-link"
            >
              <AppText style={styles.forgotPasswordText} variant="body2">
                {t("auth.signIn.forgotPassword")}
              </AppText>
            </Pressable>

            {formError ? (
              <AppText accessibilityLiveRegion="polite" style={styles.formError} variant="body2">
                {formError}
              </AppText>
            ) : null}

            <Pressable
              accessibilityLabel={t("auth.signIn.submit")}
              accessibilityRole="button"
              accessibilityState={{
                busy: signInMutation.isPending,
                disabled: signInMutation.isPending
              }}
              disabled={signInMutation.isPending}
              onPress={onSubmit}
              style={[
                styles.submitButton,
                signInMutation.isPending ? styles.submitButtonDisabled : undefined
              ]}
              testID="submit-button"
            >
              {signInMutation.isPending ? (
                <ActivityIndicator color={colors.neutrals[900]} size="small" />
              ) : (
                <AppText style={styles.submitButtonText} variant="buttonLarge">
                  {t("auth.signIn.submit")}
                </AppText>
              )}
            </Pressable>
          </View>

          <View style={styles.footer}>
            <AppText style={styles.footerText} variant="body2">
              {t("auth.signIn.noAccount")}{" "}
            </AppText>
            <Pressable
              accessibilityLabel={t("auth.signIn.signUpAction")}
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => navigation.navigate("SignUp")}
              testID="sign-up-link"
            >
              <AppText style={styles.footerLink} variant="body2">
                {t("auth.signIn.signUpAction")}
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
  forgotPasswordLink: {
    alignSelf: "flex-end"
  },
  forgotPasswordText: {
    color: colors.primary[500],
    fontWeight: fontWeight.bold
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
  personBody: {
    backgroundColor: colors.neutrals[400],
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    height: 8,
    width: 16
  },
  personHead: {
    backgroundColor: colors.neutrals[400],
    borderRadius: 5,
    height: 10,
    marginBottom: 2,
    width: 10
  },
  personIconContainer: {
    alignItems: "center",
    height: 22,
    justifyContent: "flex-end",
    width: 20
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
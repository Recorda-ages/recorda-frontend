import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";

import type { RootStackParamList } from "@/app/navigation/RootNavigator";
import { AppText, Input } from "@/components/ui";
import { ApiError } from "@/services/api/errors";
import { colors, fontWeight } from "@/theme";

import { AuthFormError } from "../components/AuthFormError";
import { AuthPasswordInput } from "../components/AuthPasswordInput";
import { AuthScreenLayout } from "../components/AuthScreenLayout";
import { AuthSubmitButton } from "../components/AuthSubmitButton";
import { useSignInMutation } from "../hooks/useSignInMutation";
import { signInSchema, type SignInFormValues } from "../validation/signInSchema";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "Login">;

export function SignInScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp>();
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const signInMutation = useSignInMutation();

  const {
    control,
    handleSubmit,
    formState: { errors, isValid }
  } = useForm<SignInFormValues>({
    defaultValues: {
      password: "",
      username: ""
    },
    mode: "onChange",
    resolver: zodResolver(signInSchema)
  });

  const submitDisabled = !isValid || signInMutation.isPending;

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);

    try {
      const response = await signInMutation.mutateAsync({
        password: values.password,
        username: values.username.trim()
      });

      const destination =
        response.user.account_type === "admin"
          ? "Admin"
          : response.user.onboarding_completed
            ? "Feed"
            : "Onboarding";

      navigation.reset({
        index: 0,
        routes: [{ name: destination }]
      });
    } catch (error) {
      if (isNetworkError(error)) {
        setFormError(t("auth.signIn.networkError"));
        return;
      }

      setFormError(t("auth.signIn.genericError"));
    }
  });

  return (
    <AuthScreenLayout
      footerActionLabel={t("auth.signIn.signUpAction")}
      footerLabel={t("auth.signIn.noAccount")}
      footerTestID="sign-up-link"
      logo={t("auth.signIn.logo")}
      onFooterActionPress={() => navigation.navigate("SignUp")}
      rootTestID="login-screen"
      subtitle={t("auth.signIn.subtitle")}
      testID="sign-in-screen"
      title={t("auth.signIn.title")}
    >
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
            leftAccessory={<UsernameIcon />}
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
          <AuthPasswordInput
            error={errors.password?.message}
            hideLabel={t("auth.signIn.hidePassword")}
            label={t("auth.signIn.password")}
            onBlur={onBlur}
            onChangeText={onChange}
            onToggleVisibility={() => setShowPassword((prev) => !prev)}
            showLabel={t("auth.signIn.showPassword")}
            textContentType="password"
            value={value}
            visible={showPassword}
          />
        )}
      />

      <Pressable
        accessibilityLabel={t("auth.signIn.forgotPassword")}
        accessibilityRole="button"
        hitSlop={8}
        onPress={() => navigation.navigate("PasswordRecovery")}
        style={styles.forgotPasswordLink}
        testID="forgot-password-link"
      >
        <AppText style={styles.forgotPasswordText} variant="body2">
          {t("auth.signIn.forgotPassword")}
        </AppText>
      </Pressable>

      <AuthFormError message={formError} />

      <AuthSubmitButton
        disabled={submitDisabled}
        label={t("auth.signIn.submit")}
        loading={signInMutation.isPending}
        onPress={onSubmit}
      />
    </AuthScreenLayout>
  );
}

function UsernameIcon() {
  return (
    <View style={styles.personIconContainer}>
      <View style={styles.personHead} />
      <View style={styles.personBody} />
    </View>
  );
}

function isNetworkError(error: unknown) {
  return error instanceof ApiError && (error.code === "NETWORK_ERROR" || error.status === 0);
}

const styles = StyleSheet.create({
  forgotPasswordLink: {
    alignSelf: "flex-end"
  },
  forgotPasswordText: {
    color: colors.primary[500],
    fontWeight: fontWeight.bold
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
  }
});

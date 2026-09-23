import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";

import type { RootStackParamList } from "@/app/navigation/RootNavigator";
import { AppText, Input } from "@/components/ui";
import { colors } from "@/theme";
import { zodResolver } from "@/utils/validation";

import { AuthFormError } from "../components/AuthFormError";
import { AuthPasswordInput } from "../components/AuthPasswordInput";
import { AuthScreenLayout } from "../components/AuthScreenLayout";
import { AuthSubmitButton } from "../components/AuthSubmitButton";
import { usePasswordRecoveryMutation } from "../hooks/usePasswordRecoveryMutation";
import {
  type PasswordRecoveryFormValues,
  passwordRecoverySchema
} from "../validation/passwordRecoverySchema";

type PasswordRecoveryScreenProps = NativeStackScreenProps<RootStackParamList, "PasswordRecovery">;

const SUCCESS_REDIRECT_DELAY_MS = 1200;

export function PasswordRecoveryScreen({ navigation }: PasswordRecoveryScreenProps) {
  const { t } = useTranslation();
  const passwordRecoveryMutation = usePasswordRecoveryMutation();
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [feedback, setFeedback] = useState<"error" | "success" | null>(null);
  const {
    control,
    formState: { errors, isValid },
    handleSubmit
  } = useForm<PasswordRecoveryFormValues>({
    defaultValues: {
      confirmPassword: "",
      email: "",
      newPassword: ""
    },
    mode: "all",
    resolver: zodResolver(passwordRecoverySchema)
  });

  useEffect(() => {
    if (feedback !== "success") {
      return undefined;
    }

    const redirectTimer = setTimeout(() => {
      navigation.reset({ index: 0, routes: [{ name: "Login" }] });
    }, SUCCESS_REDIRECT_DELAY_MS);

    return () => clearTimeout(redirectTimer);
  }, [feedback, navigation]);

  const submitDisabled = !isValid || passwordRecoveryMutation.isPending || feedback === "success";

  const onSubmit = handleSubmit(async (values) => {
    setFeedback(null);

    try {
      await passwordRecoveryMutation.mutateAsync({
        email: values.email,
        newPassword: values.newPassword
      });
      setFeedback("success");
    } catch {
      setFeedback("error");
    }
  });

  return (
    <AuthScreenLayout
      footerActionLabel={t("auth.passwordRecovery.loginAction")}
      footerLabel={t("auth.passwordRecovery.rememberedPassword")}
      footerTestID="login-link"
      logo={t("auth.passwordRecovery.logo")}
      onFooterActionPress={() => navigation.navigate("Login")}
      subtitle={t("auth.passwordRecovery.description")}
      testID="password-recovery-screen"
      title={t("auth.passwordRecovery.title")}
    >
      <Controller
        control={control}
        name="email"
        render={({ field: { onBlur, onChange, value } }) => (
          <Input
            accessibilityHint={errors.email?.message}
            accessibilityLabel={t("auth.passwordRecovery.email")}
            autoCapitalize="none"
            autoCorrect={false}
            error={errors.email?.message}
            keyboardType="email-address"
            onBlur={onBlur}
            onChangeText={onChange}
            placeholder={t("auth.passwordRecovery.email")}
            testID="input-email"
            textContentType="emailAddress"
            value={value}
            variant="dark"
          />
        )}
      />

      <Controller
        control={control}
        name="newPassword"
        render={({ field: { onBlur, onChange, value } }) => (
          <AuthPasswordInput
            error={errors.newPassword?.message}
            hideLabel={t("auth.passwordRecovery.hidePassword")}
            label={t("auth.passwordRecovery.newPassword")}
            onBlur={onBlur}
            onChangeText={onChange}
            onToggleVisibility={() => setShowNewPassword((prev) => !prev)}
            showLabel={t("auth.passwordRecovery.showPassword")}
            testID="input-new-password"
            textContentType="newPassword"
            value={value}
            visible={showNewPassword}
          />
        )}
      />

      <Controller
        control={control}
        name="confirmPassword"
        render={({ field: { onBlur, onChange, value } }) => (
          <AuthPasswordInput
            error={errors.confirmPassword?.message}
            hideLabel={t("auth.passwordRecovery.hidePassword")}
            label={t("auth.passwordRecovery.confirmPassword")}
            onBlur={onBlur}
            onChangeText={onChange}
            onToggleVisibility={() => setShowConfirmPassword((prev) => !prev)}
            showLabel={t("auth.passwordRecovery.showPassword")}
            testID="input-confirm-password"
            textContentType="newPassword"
            value={value}
            visible={showConfirmPassword}
          />
        )}
      />

      {feedback === "success" ? (
        <AppText accessibilityLiveRegion="polite" style={styles.success} variant="body2">
          {t("auth.passwordRecovery.success")}
        </AppText>
      ) : null}

      <AuthFormError
        message={feedback === "error" ? t("auth.passwordRecovery.genericError") : null}
      />

      <AuthSubmitButton
        disabled={submitDisabled}
        label={t("auth.passwordRecovery.submit")}
        loading={passwordRecoveryMutation.isPending}
        onPress={onSubmit}
        testID="submit-button"
      />
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  success: {
    color: colors.primary[200],
    textAlign: "center"
  }
});

import { useState } from "react";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";

import type { RootStackParamList } from "@/app/navigation/RootNavigator";
import { Input } from "@/components/ui";
import { ApiError } from "@/services/api/errors";

import { AuthFormError } from "../components/AuthFormError";
import { AuthScreenLayout } from "../components/AuthScreenLayout";
import { AuthSubmitButton } from "../components/AuthSubmitButton";
import { PasswordVisibilityToggle } from "../components/PasswordVisibilityToggle";
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
    <AuthScreenLayout
      footerActionLabel={t("auth.signUp.loginAction")}
      footerLabel={t("auth.signUp.hasAccount")}
      footerTestID="login-link"
      logo={t("auth.signUp.logo")}
      onFooterActionPress={() => navigation.navigate("Login")}
      subtitle={t("auth.signUp.subtitle")}
      testID="sign-up-screen"
      title={t("auth.signUp.title")}
    >
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
              <PasswordVisibilityToggle
                hideLabel={t("auth.signUp.hidePassword")}
                onToggle={() => setShowPassword((prev) => !prev)}
                showLabel={t("auth.signUp.showPassword")}
                visible={showPassword}
              />
            }
            secureTextEntry={!showPassword}
            testID="input-password"
            textContentType="newPassword"
            value={value}
            variant="dark"
          />
        )}
      />

      <AuthFormError message={formError} />

      <AuthSubmitButton
        disabled={signUpMutation.isPending}
        label={t("auth.signUp.submit")}
        loading={signUpMutation.isPending}
        onPress={onSubmit}
      />
    </AuthScreenLayout>
  );
}

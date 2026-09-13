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
import { AuthPasswordInput } from "../components/AuthPasswordInput";
import { AuthScreenLayout } from "../components/AuthScreenLayout";
import { AuthSubmitButton } from "../components/AuthSubmitButton";
import { useSignUpMutation } from "../hooks/useSignUpMutation";
import { getPostAuthDestination } from "../session";
import { signUpSchema, type SignUpFormValues } from "../validation/signUpSchema";

type SignUpField = keyof SignUpFormValues;

const SIGN_UP_FIELDS: SignUpField[] = ["email", "name", "password", "username"];

function getFieldErrors(details: unknown): { field: SignUpField; message?: string }[] {
  if (typeof details !== "object" || details === null || !("fields" in details)) {
    return [];
  }

  const { fields } = details as { fields?: unknown };

  if (!Array.isArray(fields)) {
    return [];
  }

  return fields.flatMap((item: { field?: string; message?: string }) =>
    SIGN_UP_FIELDS.includes(item.field as SignUpField)
      ? [{ field: item.field as SignUpField, message: item.message }]
      : []
  );
}

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
      const response = await signUpMutation.mutateAsync({
        email: values.email.trim(),
        name: values.name.trim(),
        password: values.password,
        username: values.username.trim()
      });

      navigation.reset({
        index: 0,
        routes: [{ name: getPostAuthDestination(response.user) }]
      });
    } catch (error) {
      if (!(error instanceof ApiError)) {
        setFormError(t("auth.signUp.networkError"));
        return;
      }

      if (error.code === "NETWORK_ERROR" || error.status === 0) {
        setFormError(t("auth.signUp.networkError"));
        return;
      }

      if (error.status === 409 || error.status === 422) {
        const mappedFields = getFieldErrors(error.details);

        mappedFields.forEach(({ field, message }) => {
          setError(field, { message: message ?? t("auth.signUp.invalidField") });
        });

        if (mappedFields.length > 0) {
          return;
        }
      }

      setFormError(error.message || t("auth.signUp.networkError"));
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
          <AuthPasswordInput
            error={errors.password?.message}
            hideLabel={t("auth.signUp.hidePassword")}
            label={t("auth.signUp.password")}
            onBlur={onBlur}
            onChangeText={onChange}
            onToggleVisibility={() => setShowPassword((prev) => !prev)}
            showLabel={t("auth.signUp.showPassword")}
            textContentType="newPassword"
            value={value}
            visible={showPassword}
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

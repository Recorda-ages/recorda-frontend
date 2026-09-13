import type { TextInputProps } from "react-native";

import { Input } from "@/components/ui";

import { PasswordVisibilityToggle } from "./PasswordVisibilityToggle";

type AuthPasswordInputProps = {
  error?: string;
  hideLabel: string;
  label: string;
  onBlur: TextInputProps["onBlur"];
  onChangeText: TextInputProps["onChangeText"];
  onToggleVisibility: () => void;
  showLabel: string;
  testID?: string;
  textContentType: TextInputProps["textContentType"];
  value: string;
  visible: boolean;
};

export function AuthPasswordInput({
  error,
  hideLabel,
  label,
  onBlur,
  onChangeText,
  onToggleVisibility,
  showLabel,
  testID = "input-password",
  textContentType,
  value,
  visible
}: AuthPasswordInputProps) {
  return (
    <Input
      accessibilityHint={error}
      accessibilityLabel={label}
      autoCapitalize="none"
      autoCorrect={false}
      error={error}
      onBlur={onBlur}
      onChangeText={onChangeText}
      placeholder={label}
      rightAccessory={
        <PasswordVisibilityToggle
          hideLabel={hideLabel}
          onToggle={onToggleVisibility}
          showLabel={showLabel}
          visible={visible}
        />
      }
      secureTextEntry={!visible}
      testID={testID}
      textContentType={textContentType}
      value={value}
      variant="dark"
    />
  );
}

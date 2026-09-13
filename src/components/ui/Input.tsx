import type { ComponentProps, ReactNode } from "react";
import type { StyleProp, TextInputProps, TextStyle, ViewStyle } from "react-native";
import { StyleSheet, TextInput, View } from "react-native";

import { baseColors, colors, radius, semanticColors, spacing, typography } from "@/theme";

import { AppText } from "./Text";

export type InputVariant = "default" | "dark";

export type InputProps = TextInputProps & {
  containerStyle?: StyleProp<ViewStyle>;
  error?: string;
  inputContainerStyle?: StyleProp<ViewStyle>;
  label?: string;
  leftAccessory?: ReactNode;
  rightAccessory?: ReactNode;
  variant?: InputVariant;
};

type AppTextColor = ComponentProps<typeof AppText>["color"];

type InputVariantStyle = {
  error: TextStyle;
  frame: ViewStyle;
  frameError: ViewStyle;
  input: TextStyle;
  label?: TextStyle;
  labelColor: AppTextColor;
  placeholderColor: string;
};

type InputLabelProps = {
  color: AppTextColor;
  label?: string;
  style?: StyleProp<TextStyle>;
};

type InputAccessoryProps = {
  children?: ReactNode;
  style: StyleProp<ViewStyle>;
};

type InputErrorProps = {
  error?: string;
  style: StyleProp<TextStyle>;
};

export function Input({
  containerStyle,
  error,
  inputContainerStyle,
  label,
  leftAccessory,
  rightAccessory,
  style,
  variant = "default",
  ...props
}: InputProps) {
  const variantStyle = inputVariantStyles[variant];

  return (
    <View style={[styles.container, containerStyle]}>
      <InputLabel color={variantStyle.labelColor} label={label} style={variantStyle.label} />

      <View style={getInputFrameStyle(variantStyle, Boolean(error), inputContainerStyle)}>
        <InputAccessory style={styles.accessoryLeft}>{leftAccessory}</InputAccessory>
        <TextInput
          accessibilityHint={error}
          accessibilityLabel={props.accessibilityLabel ?? label}
          placeholderTextColor={props.placeholderTextColor ?? variantStyle.placeholderColor}
          style={[styles.input, variantStyle.input, style]}
          {...props}
        />
        <InputAccessory style={styles.accessoryRight}>{rightAccessory}</InputAccessory>
      </View>

      <InputError error={error} style={variantStyle.error} />
    </View>
  );
}

function InputLabel({ color, label, style }: InputLabelProps) {
  if (!label) {
    return null;
  }

  return (
    <AppText color={color} style={style} variant="body2">
      {label}
    </AppText>
  );
}

function InputAccessory({ children, style }: InputAccessoryProps) {
  if (!children) {
    return null;
  }

  return <View style={style}>{children}</View>;
}

function InputError({ error, style }: InputErrorProps) {
  if (!error) {
    return null;
  }

  return (
    <AppText accessibilityLiveRegion="polite" style={style} variant="caption">
      {error}
    </AppText>
  );
}

function getInputFrameStyle(
  variantStyle: InputVariantStyle,
  hasError: boolean,
  inputContainerStyle: StyleProp<ViewStyle>
) {
  return [
    styles.inputFrame,
    variantStyle.frame,
    hasError ? variantStyle.frameError : undefined,
    inputContainerStyle
  ];
}

const styles = StyleSheet.create({
  accessoryLeft: {
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing[2]
  },
  accessoryRight: {
    alignItems: "center",
    justifyContent: "center",
    marginLeft: spacing[2]
  },
  container: {
    gap: spacing[1]
  },
  darkError: {
    color: colors.error[200]
  },
  darkFrame: {
    backgroundColor: "rgba(41, 41, 41, 0.92)",
    borderColor: colors.primary[100],
    borderRadius: 16,
    borderWidth: 1.5,
    minHeight: 56,
    paddingHorizontal: spacing[4]
  },
  darkFrameError: {
    borderColor: colors.error[200]
  },
  darkInput: {
    color: baseColors.white
  },
  darkLabel: {
    color: colors.neutrals[200]
  },
  defaultError: {
    color: semanticColors.error
  },
  defaultFrame: {
    backgroundColor: semanticColors.background,
    borderColor: semanticColors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    minHeight: 48,
    paddingHorizontal: spacing[3]
  },
  defaultFrameError: {
    borderColor: semanticColors.error
  },
  defaultInput: {
    color: semanticColors.textPrimary
  },
  input: {
    flex: 1,
    paddingVertical: spacing[2],
    ...typography.body1
  },
  inputFrame: {
    alignItems: "center",
    flexDirection: "row"
  }
});

const inputVariantStyles: Record<InputVariant, InputVariantStyle> = {
  dark: {
    error: styles.darkError,
    frame: styles.darkFrame,
    frameError: styles.darkFrameError,
    input: styles.darkInput,
    label: styles.darkLabel,
    labelColor: "muted",
    placeholderColor: colors.neutrals[400]
  },
  default: {
    error: styles.defaultError,
    frame: styles.defaultFrame,
    frameError: styles.defaultFrameError,
    input: styles.defaultInput,
    labelColor: "default",
    placeholderColor: semanticColors.textDisabled
  }
};

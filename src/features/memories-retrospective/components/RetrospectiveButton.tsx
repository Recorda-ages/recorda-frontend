import { useTranslation } from "react-i18next";
import { Pressable, type StyleProp, type ViewStyle } from "react-native";
import { Icon } from "react-native-paper";

import { colors } from "@/theme";

type RetrospectiveButtonProps = Readonly<{
  onPress: () => void;
  size: number;
  style?: StyleProp<ViewStyle>;
}>;

/** Acesso à Retrospectiva no topo do Perfil. Só aparece quando há uma disponível. */
export function RetrospectiveButton({ onPress, size, style }: RetrospectiveButtonProps) {
  const { t } = useTranslation();

  return (
    <Pressable
      accessibilityLabel={t("retrospective.open")}
      accessibilityRole="button"
      hitSlop={8}
      onPress={onPress}
      style={style}
      testID="retrospective-button"
    >
      <Icon color={colors.primary[500]} size={size} source="history" />
    </Pressable>
  );
}

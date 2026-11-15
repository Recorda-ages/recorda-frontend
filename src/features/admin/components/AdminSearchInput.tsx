import { StyleSheet, TextInput, View } from "react-native";
import { Icon } from "react-native-paper";

import { colors, fontFamily, radius, spacing } from "@/theme";

type AdminSearchInputProps = {
  accessibilityLabel: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  testID?: string;
  value: string;
};

export function AdminSearchInput({
  accessibilityLabel,
  onChangeText,
  placeholder,
  testID,
  value
}: Readonly<AdminSearchInputProps>) {
  return (
    <View style={styles.container}>
      <TextInput
        accessibilityLabel={accessibilityLabel}
        autoCapitalize="none"
        autoCorrect={false}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.neutrals[300]}
        returnKeyType="search"
        style={styles.input}
        testID={testID}
        value={value}
      />
      <Icon color={colors.neutrals[300]} size={22} source="magnify" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    backgroundColor: colors.neutrals[800],
    borderRadius: radius.md,
    flexDirection: "row",
    marginBottom: spacing[3],
    marginHorizontal: spacing[4],
    minHeight: 52,
    paddingHorizontal: spacing[4]
  },
  input: {
    color: colors.neutrals[100],
    flex: 1,
    fontFamily: fontFamily.primary.regular,
    fontSize: 13,
    minWidth: 0,
    paddingVertical: spacing[3]
  }
});

import { StyleSheet, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { colors, radius, spacing } from "@/theme";

type FriendsSearchBarProps = {
  value: string;
  onChangeText: (text: string) => void;
};

export function FriendsSearchBar({ value, onChangeText }: FriendsSearchBarProps) {
  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Buscar"
        placeholderTextColor={colors.neutrals[500]}
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
      />
      <Ionicons color={colors.neutrals[500]} name="search" size={18} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    backgroundColor: colors.neutrals[800],
    borderColor: colors.neutrals[700],
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    marginVertical: spacing[4],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3]
  },
  input: {
    color: colors.neutrals[100],
    flex: 1,
    fontSize: 14
  }
});

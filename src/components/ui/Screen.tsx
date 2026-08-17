import type { PropsWithChildren } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors, spacing } from "@/theme";

type ScreenProps = PropsWithChildren<{
  contentContainerStyle?: StyleProp<ViewStyle>;
  scroll?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}>;

export function Screen({
  children,
  contentContainerStyle,
  scroll = false,
  style,
  testID
}: ScreenProps) {
  if (scroll) {
    return (
      <SafeAreaView style={[styles.safeArea, style]} testID={testID}>
        <ScrollView contentContainerStyle={[styles.content, contentContainerStyle]}>
          {children}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, style]} testID={testID}>
      <View style={[styles.content, contentContainerStyle]}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    padding: spacing.lg
  },
  safeArea: {
    backgroundColor: colors.background,
    flex: 1
  }
});

import type { ReactNode } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View
} from "react-native";
import { StatusBar } from "expo-status-bar";

import { AppText } from "@/components/ui";
import { baseColors, colors, fontWeight, spacing } from "@/theme";

type AuthScreenLayoutProps = {
  children: ReactNode;
  footerActionLabel: string;
  footerLabel: string;
  footerTestID: string;
  logo: string;
  onFooterActionPress: () => void;
  rootTestID?: string;
  subtitle: string;
  testID: string;
  title: string;
};

export function AuthScreenLayout({
  children,
  footerActionLabel,
  footerLabel,
  footerTestID,
  logo,
  onFooterActionPress,
  rootTestID,
  subtitle,
  testID,
  title
}: AuthScreenLayoutProps) {
  const screenTestID = rootTestID ?? testID;
  const contentTestID = rootTestID ? testID : undefined;

  return (
    <View style={styles.screen} testID={screenTestID}>
      <StatusBar style="light" />
      <View style={styles.screenContent} testID={contentTestID}>
        <Image
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          resizeMode="contain"
          source={require("@/assets/images/glow.png")}
          style={styles.radialGlowTop}
        />
        <Image
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          resizeMode="contain"
          source={require("@/assets/images/glow.png")}
          style={styles.radialGlowBottom}
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.keyboardAvoiding}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            contentInsetAdjustmentBehavior="automatic"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.header}>
              <AppText style={styles.logo} variant="title">
                {logo}
              </AppText>
              <AppText style={styles.title} variant="headline1">
                {title}
              </AppText>
              <AppText style={styles.subtitle} variant="body1">
                {subtitle}
              </AppText>
            </View>

            <View style={styles.form}>{children}</View>

            <View style={styles.footer}>
              <AppText style={styles.footerText} variant="body2">
                {footerLabel}{" "}
              </AppText>
              <Pressable
                accessibilityLabel={footerActionLabel}
                accessibilityRole="button"
                hitSlop={8}
                onPress={onFooterActionPress}
                testID={footerTestID}
              >
                <AppText style={styles.footerLink} variant="body2">
                  {footerActionLabel}
                </AppText>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    marginTop: spacing[4],
    paddingBottom: spacing[6]
  },
  footerLink: {
    color: colors.primary[500],
    fontWeight: fontWeight.bold
  },
  footerText: {
    color: colors.neutrals[100]
  },
  form: {
    gap: spacing[4],
    width: "100%"
  },
  header: {
    gap: spacing[2],
    paddingTop: spacing[4]
  },
  keyboardAvoiding: {
    flex: 1
  },
  logo: {
    color: colors.primary[500],
    fontFamily: "Inter_700Bold",
    fontSize: 38,
    fontStyle: "italic",
    letterSpacing: 0
  },
  radialGlowBottom: {
    bottom: -150,
    height: 480,
    left: -150,
    opacity: 0.4,
    pointerEvents: "none",
    position: "absolute",
    width: 480
  },
  radialGlowTop: {
    height: 520,
    opacity: 0.5,
    pointerEvents: "none",
    position: "absolute",
    right: -150,
    top: -150,
    width: 520
  },
  screen: {
    backgroundColor: baseColors.black,
    flex: 1
  },
  screenContent: {
    flex: 1
  },
  scrollContent: {
    flexGrow: 1,
    gap: spacing[8],
    justifyContent: "center",
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[8]
  },
  subtitle: {
    color: colors.neutrals[200],
    fontSize: 16,
    lineHeight: 22
  },
  title: {
    color: baseColors.white,
    fontSize: 34,
    fontWeight: fontWeight.bold,
    lineHeight: 40
  }
});

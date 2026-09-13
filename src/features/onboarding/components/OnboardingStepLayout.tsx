import type { ReactNode } from "react";
import { Image } from "expo-image";
import { StatusBar } from "expo-status-bar";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type ImageStyle,
  type ScrollViewProps,
  type StyleProp,
  useWindowDimensions
} from "react-native";
import { Icon } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppText } from "@/components/ui";
import { colors, fontFamily, spacing } from "@/theme";

type OnboardingStepLayoutProps = {
  activeStep: 1 | 2 | 3;
  backAccessibilityLabel: string;
  backButtonTestID?: string;
  children: ReactNode;
  continueDisabled: boolean;
  continueLabel: string;
  continueTestID?: string;
  headerTitle: string;
  keyboardShouldPersistTaps?: ScrollViewProps["keyboardShouldPersistTaps"];
  onBack: () => void;
  onContinue: () => void;
  stepLabel: string;
  subtitle: string;
  testID: string;
  title: string;
};

const GLOW_SIZE = 894;

export function OnboardingStepLayout({
  activeStep,
  backAccessibilityLabel,
  backButtonTestID,
  children,
  continueDisabled,
  continueLabel,
  continueTestID,
  headerTitle,
  keyboardShouldPersistTaps,
  onBack,
  onContinue,
  stepLabel,
  subtitle,
  testID,
  title
}: OnboardingStepLayoutProps) {
  const scale = useWindowDimensions().width / 393;

  return (
    <SafeAreaView style={styles.screen} testID={testID}>
      <StatusBar style="light" />
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        {(["topStart", "bottomEnd"] as const).map((anchor) => (
          <Image
            contentFit="contain"
            key={anchor}
            source={require("../assets/gradient-glow.svg")}
            style={getGlowStyle(anchor, scale)}
          />
        ))}
      </View>

      <View style={styles.topBar}>
        <Pressable
          accessibilityLabel={backAccessibilityLabel}
          accessibilityRole="button"
          hitSlop={12}
          onPress={onBack}
          style={styles.backButton}
          testID={backButtonTestID}
        >
          <Icon color={colors.neutrals[100]} size={32} source="chevron-left" />
        </Pressable>
        <AppText style={styles.topBarTitle} variant="headline4">
          {headerTitle}
        </AppText>
        <View style={styles.topBarSpacer} />
      </View>

      <View style={styles.content}>
        <View style={styles.progress}>
          {[1, 2, 3].map((step) => (
            <View
              key={step}
              style={step <= activeStep ? styles.progressActive : styles.progressInactive}
            />
          ))}
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps={keyboardShouldPersistTaps}
          showsVerticalScrollIndicator={false}
          style={styles.scroll}
        >
          <AppText color="primary" style={styles.step} variant="body2">
            {stepLabel}
          </AppText>

          <View style={styles.description}>
            <AppText style={styles.title} variant="headline2">
              {title}
            </AppText>
            <AppText color="muted" style={styles.subtitle}>
              {subtitle}
            </AppText>
          </View>

          {children}
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            accessibilityLabel={continueLabel}
            accessibilityRole="button"
            accessibilityState={{ disabled: continueDisabled }}
            disabled={continueDisabled}
            onPress={onContinue}
            style={({ pressed }) => [
              styles.continueButton,
              continueDisabled ? styles.continueButtonDisabled : styles.continueButtonEnabled,
              pressed ? styles.continueButtonPressed : undefined
            ]}
            testID={continueTestID}
          >
            <View style={styles.continueContent}>
              <AppText
                style={
                  continueDisabled ? styles.continueLabelDisabled : styles.continueLabelEnabled
                }
                variant="buttonLarge"
              >
                {continueLabel}
              </AppText>
              <Icon
                color={continueDisabled ? colors.neutrals[400] : colors.primary[500]}
                size={24}
                source="chevron-right"
              />
            </View>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

function getGlowStyle(anchor: "topStart" | "bottomEnd", scale: number): StyleProp<ImageStyle> {
  const dimensions = {
    height: GLOW_SIZE * scale,
    width: GLOW_SIZE * scale
  };

  return [
    styles.glow,
    dimensions,
    anchor === "topStart"
      ? { left: -446 * scale, top: -468 * scale }
      : { bottom: -271 * scale, right: -535 * scale }
  ];
}

const styles = StyleSheet.create({
  backButton: {
    alignItems: "flex-start",
    justifyContent: "center",
    width: 48
  },
  content: {
    flex: 1,
    paddingBottom: spacing[6],
    paddingHorizontal: spacing[4]
  },
  continueButton: {
    alignItems: "center",
    backgroundColor: "rgba(0, 226, 169, 0.05)",
    borderRadius: 100,
    borderWidth: 1.5,
    justifyContent: "center",
    minHeight: 58,
    width: "100%"
  },
  continueButtonDisabled: {
    borderColor: colors.neutrals[400]
  },
  continueButtonEnabled: {
    borderColor: colors.primary[500]
  },
  continueButtonPressed: {
    opacity: 0.82
  },
  continueContent: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing[2]
  },
  continueLabelDisabled: {
    color: colors.neutrals[400],
    lineHeight: 26
  },
  continueLabelEnabled: {
    color: colors.primary[500],
    lineHeight: 26
  },
  description: {
    gap: spacing[2]
  },
  footer: {
    justifyContent: "flex-end",
    paddingTop: spacing[4]
  },
  glow: {
    position: "absolute"
  },
  progress: {
    flexDirection: "row",
    gap: 6,
    marginBottom: spacing[4]
  },
  progressActive: {
    backgroundColor: colors.primary[500],
    borderRadius: 2,
    flex: 1,
    height: 4
  },
  progressInactive: {
    backgroundColor: colors.primary[800],
    borderRadius: 2,
    flex: 1,
    height: 4
  },
  screen: {
    backgroundColor: colors.neutrals[900],
    flex: 1,
    overflow: "hidden"
  },
  scroll: {
    flex: 1
  },
  scrollContent: {
    paddingBottom: spacing[4]
  },
  step: {
    letterSpacing: 0.15,
    lineHeight: 18,
    marginBottom: spacing[4]
  },
  subtitle: {
    letterSpacing: 0.15,
    lineHeight: 21
  },
  title: {
    color: colors.neutrals[100],
    fontFamily: fontFamily.primary.semiBold,
    lineHeight: 37
  },
  topBar: {
    alignItems: "center",
    flexDirection: "row",
    height: 64,
    justifyContent: "space-between",
    paddingHorizontal: spacing[4]
  },
  topBarSpacer: {
    width: 48
  },
  topBarTitle: {
    color: colors.neutrals[100],
    fontFamily: fontFamily.primary.semiBold
  }
});

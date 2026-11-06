import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { Pressable, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Icon } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

import type { RootStackParamList } from "@/app/navigation/RootNavigator";
import { AppText } from "@/components/ui";
import { type AppLanguage, SUPPORTED_LANGUAGES } from "@/i18n";
import { colors, fontFamily, spacing } from "@/theme";

import { useChangeLanguage } from "../hooks/useChangeLanguage";
import { getCurrentLanguage } from "../languagePreference";

export function LanguageSettingsScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const changeLanguage = useChangeLanguage();
  const selected = getCurrentLanguage();

  return (
    <View style={styles.screen} testID="language-settings-screen">
      <StatusBar style="light" />
      <SafeAreaView edges={["top"]} style={styles.content}>
        <View style={styles.header}>
          <Pressable
            accessibilityLabel={t("language.back")}
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => navigation.goBack()}
            testID="language-back"
          >
            <Icon color={colors.neutrals[100]} size={28} source="chevron-left" />
          </Pressable>
          <AppText style={styles.title}>{t("language.title")}</AppText>
          <View style={styles.headerSpacer} />
        </View>

        <View accessibilityRole="radiogroup" style={styles.options}>
          {SUPPORTED_LANGUAGES.map((language) => (
            <LanguageOption
              key={language}
              label={t(`language.names.${language}`)}
              language={language}
              onPress={(next) => void changeLanguage(next)}
              selected={language === selected}
            />
          ))}
        </View>
      </SafeAreaView>
    </View>
  );
}

type LanguageOptionProps = {
  label: string;
  language: AppLanguage;
  onPress: (language: AppLanguage) => void;
  selected: boolean;
};

function LanguageOption({ label, language, onPress, selected }: Readonly<LanguageOptionProps>) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      onPress={() => onPress(language)}
      style={({ pressed }) => [styles.option, pressed ? styles.pressed : null]}
      testID={`language-option-${language}`}
    >
      <AppText style={styles.optionLabel}>{label}</AppText>
      <View style={[styles.radio, selected ? styles.radioSelected : null]}>
        {selected ? <View style={styles.radioDot} /> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4]
  },
  headerSpacer: {
    width: 28
  },
  option: {
    alignItems: "center",
    borderBottomColor: colors.neutrals[700],
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 56
  },
  optionLabel: {
    color: colors.neutrals[100],
    fontFamily: fontFamily.primary.semiBold,
    fontSize: 15
  },
  options: {
    paddingHorizontal: spacing[4]
  },
  pressed: {
    opacity: 0.72
  },
  radio: {
    alignItems: "center",
    borderColor: colors.neutrals[300],
    borderRadius: 12,
    borderWidth: 2,
    height: 24,
    justifyContent: "center",
    width: 24
  },
  radioDot: {
    backgroundColor: colors.primary[500],
    borderRadius: 6,
    height: 12,
    width: 12
  },
  radioSelected: {
    borderColor: colors.primary[500]
  },
  screen: {
    backgroundColor: colors.neutrals[900],
    flex: 1
  },
  title: {
    color: colors.neutrals[100],
    fontFamily: fontFamily.primary.bold,
    fontSize: 20,
    textAlign: "center"
  }
});

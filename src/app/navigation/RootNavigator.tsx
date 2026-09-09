import { Pressable, StyleSheet, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import {
  createNativeStackNavigator,
  type NativeStackScreenProps
} from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";

import { AppText } from "@/components/ui";
import { PasswordRecoveryScreen } from "@/features/auth/screens/PasswordRecoveryScreen";
import { SignUpScreen } from "@/features/auth/screens/SignUpScreen";
import { HomeScreen } from "@/features/home/screens/HomeScreen";
import { OnboardingMusicPreview } from "@/features/onboarding/screens/OnboardingMusicPreview";
import { OnboardingMusicRoute } from "@/features/onboarding/screens/OnboardingMusicRoute";
import type { MusicSelection } from "@/features/onboarding";
import { CameraScreen } from "@/features/recorda-creation/screens/CameraScreen";
import { PreviewScreen } from "@/features/recorda-creation/screens/PreviewScreen";
import { RecordaDetailsScreen } from "@/features/recorda-creation/screens/RecordaDetailsScreen";
import { baseColors, navigationTheme, spacing } from "@/theme";

export type RootStackParamList = {
  Feed: undefined;
  Home: undefined;
  Login: undefined;
  Onboarding: undefined;
  PasswordRecovery: undefined;
  Profile: undefined;
  SignUp: undefined;
  Camera: undefined;
  Preview: { uri: string; type: "photo" | "video" };
  OnboardingMusic: { artists: MusicSelection[]; genres: MusicSelection[] };
  OnboardingMusicPreview: undefined;
  RecordaDetails: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

type LoginPlaceholderScreenProps = NativeStackScreenProps<RootStackParamList, "Login">;

function LoginPlaceholderScreen({ navigation }: LoginPlaceholderScreenProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.placeholder} testID="login-screen">
      <AppText variant="headline3">Login</AppText>
      <Pressable
        accessibilityLabel={t("auth.login.forgotPassword")}
        accessibilityRole="button"
        hitSlop={8}
        onPress={() => navigation.navigate("PasswordRecovery")}
        style={styles.forgotPasswordLink}
        testID="forgot-password-link"
      >
        <AppText color="primary" variant="body2">
          {t("auth.login.forgotPassword")}
        </AppText>
      </Pressable>
    </View>
  );
}

function OnboardingPlaceholderScreen() {
  return (
    <View style={styles.placeholder} testID="onboarding-screen">
      <AppText variant="headline3">Onboarding</AppText>
    </View>
  );
}

function ProfilePlaceholderScreen() {
  return (
    <View style={styles.placeholder} testID="profile-screen">
      <AppText variant="headline3">Perfil</AppText>
    </View>
  );
}

export function RootNavigator() {
  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator initialRouteName="SignUp" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        <Stack.Screen name="Login" component={LoginPlaceholderScreen} />
        <Stack.Screen name="PasswordRecovery" component={PasswordRecoveryScreen} />
        <Stack.Screen name="Onboarding" component={OnboardingPlaceholderScreen} />
        <Stack.Screen name="Profile" component={ProfilePlaceholderScreen} />
        <Stack.Screen name="Feed" component={HomeScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Camera" component={CameraScreen} />
        <Stack.Screen name="Preview" component={PreviewScreen} />
        <Stack.Screen name="OnboardingMusic" component={OnboardingMusicRoute} />
        {__DEV__ ? (
          <Stack.Screen name="OnboardingMusicPreview" component={OnboardingMusicPreview} />
        ) : null}
        <Stack.Screen name="RecordaDetails" component={RecordaDetailsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  forgotPasswordLink: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2]
  },
  placeholder: {
    alignItems: "center",
    backgroundColor: baseColors.black,
    flex: 1,
    gap: spacing[4],
    justifyContent: "center"
  }
});

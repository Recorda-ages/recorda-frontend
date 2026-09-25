import { StyleSheet, View } from "react-native";
import { NavigationContainer, useNavigation } from "@react-navigation/native";
import {
  createNativeStackNavigator,
  type NativeStackNavigationProp
} from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";

import { AppText, Button } from "@/components/ui";
import { PasswordRecoveryScreen } from "@/features/auth/screens/PasswordRecoveryScreen";
import { SignInScreen } from "@/features/auth/screens/SignInScreen";
import { SignUpScreen } from "@/features/auth/screens/SignUpScreen";
import { clearSession } from "@/features/auth/session";
import { FeedScreen } from "@/features/feed";
import { OnboardingArtistsScreen } from "@/features/onboarding/screens/OnboardingArtistsScreen";
import { OnboardingGenresRoute } from "@/features/onboarding/screens/OnboardingGenresRoute";
import { OnboardingMusicRoute } from "@/features/onboarding/screens/OnboardingMusicRoute";
import { useOnboarding } from "@/features/onboarding/state/OnboardingContext";
import { useRecordaDraft } from "@/features/recorda-creation/context/RecordaDraftContext";
import { CameraScreen } from "@/features/recorda-creation/screens/CameraScreen";
import { PreviewScreen } from "@/features/recorda-creation/screens/PreviewScreen";
import { RecordaDetailsScreen } from "@/features/recorda-creation/screens/RecordaDetailsScreen";
import { RecordaMusicScreen } from "@/features/recorda-creation/screens/RecordaMusicScreen";
import { RecordaViewScreen } from "@/features/recorda-view";
import { SplashScreen } from "@/features/splash";
import { baseColors, colors, navigationTheme, spacing } from "@/theme";

export type RootStackParamList = {
  Splash: undefined;
  Admin: undefined;
  Camera: undefined;
  Feed: undefined;
  Login: undefined;
  OnboardingArtists: undefined;
  OnboardingGenres: undefined;
  OnboardingMusic: undefined;
  PasswordRecovery: undefined;
  Preview: { uri: string; type: "photo" | "video" };
  Profile: undefined;
  RecordaDetails: undefined;
  RecordaMusic: undefined;
  RecordaView: { recordaId: string };
  SignUp: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

type SessionPlaceholderScreenProps = {
  testID: string;
  title: string;
};

function SessionPlaceholderScreen({ testID, title }: SessionPlaceholderScreenProps) {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const onboarding = useOnboarding();
  const recordaDraft = useRecordaDraft();

  const signOut = async () => {
    await clearSession();
    onboarding.reset();
    recordaDraft.reset();
    navigation.reset({ index: 0, routes: [{ name: "Login" }] });
  };

  return (
    <View style={styles.placeholder} testID={testID}>
      <AppText style={styles.placeholderTitle} variant="headline3">
        {title}
      </AppText>
      <Button label={t("auth.signOut")} onPress={() => void signOut()} testID="sign-out-button" />
    </View>
  );
}

function AdminPlaceholderScreen() {
  const { t } = useTranslation();

  return <SessionPlaceholderScreen testID="admin-screen" title={t("admin.title")} />;
}

function ProfilePlaceholderScreen() {
  const { t } = useTranslation();

  return <SessionPlaceholderScreen testID="profile-screen" title={t("profile.title")} />;
}

export function RootNavigator() {
  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        <Stack.Screen name="Login" component={SignInScreen} />
        <Stack.Screen name="PasswordRecovery" component={PasswordRecoveryScreen} />
        <Stack.Screen name="OnboardingArtists" component={OnboardingArtistsScreen} />
        <Stack.Screen name="OnboardingGenres" component={OnboardingGenresRoute} />
        <Stack.Screen name="OnboardingMusic" component={OnboardingMusicRoute} />
        <Stack.Screen name="Feed" component={FeedScreen} />
        <Stack.Screen name="Profile" component={ProfilePlaceholderScreen} />
        <Stack.Screen name="Admin" component={AdminPlaceholderScreen} />
        <Stack.Screen name="Camera" component={CameraScreen} />
        <Stack.Screen name="Preview" component={PreviewScreen} />
        <Stack.Screen name="RecordaMusic" component={RecordaMusicScreen} />
        <Stack.Screen name="RecordaDetails" component={RecordaDetailsScreen} />
        <Stack.Screen name="RecordaView" component={RecordaViewScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    alignItems: "center",
    backgroundColor: baseColors.black,
    flex: 1,
    gap: spacing[6],
    justifyContent: "center",
    paddingHorizontal: spacing[6]
  },
  placeholderTitle: {
    color: colors.neutrals[100]
  }
});

import { StyleSheet, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { AppText } from "@/components/ui";
import { PasswordRecoveryScreen } from "@/features/auth/screens/PasswordRecoveryScreen";
import { SignInScreen } from "@/features/auth/screens/SignInScreen";
import { SignUpScreen } from "@/features/auth/screens/SignUpScreen";
import { HomeScreen } from "@/features/home/screens/HomeScreen";
import type { MusicSelection } from "@/features/onboarding";
import { OnboardingArtistsScreen } from "@/features/onboarding/screens/OnboardingArtistsScreen";
import { OnboardingGenresRoute } from "@/features/onboarding/screens/OnboardingGenresRoute";
import { OnboardingMusicPreview } from "@/features/onboarding/screens/OnboardingMusicPreview";
import { OnboardingMusicRoute } from "@/features/onboarding/screens/OnboardingMusicRoute";
import { CameraScreen } from "@/features/recorda-creation/screens/CameraScreen";
import { PreviewScreen } from "@/features/recorda-creation/screens/PreviewScreen";
import { RecordaDetailsScreen } from "@/features/recorda-creation/screens/RecordaDetailsScreen";
import { SplashScreen } from "@/features/splash";
import { baseColors, navigationTheme, spacing } from "@/theme";

export type RootStackParamList = {
  Splash: undefined;
  Admin: undefined;
  Camera: undefined;
  Feed: undefined;
  Home: undefined;
  Login: undefined;
  Onboarding: undefined;
  OnboardingArtists: undefined;
  OnboardingGenres: undefined;
  OnboardingMusic: { artists: MusicSelection[]; genres: MusicSelection[] };
  OnboardingMusicPreview: undefined;
  PasswordRecovery: undefined;
  Preview: { uri: string; type: "photo" | "video" };
  Profile: undefined;
  RecordaDetails: undefined;
  SignUp: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function AdminPlaceholderScreen() {
  return (
    <View style={styles.placeholder} testID="admin-screen">
      <AppText variant="headline3">Area administrativa</AppText>
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
      <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        <Stack.Screen name="Login" component={SignInScreen} />
        <Stack.Screen name="PasswordRecovery" component={PasswordRecoveryScreen} />
        <Stack.Screen name="Onboarding" component={OnboardingArtistsScreen} />
        <Stack.Screen name="OnboardingArtists" component={OnboardingArtistsScreen} />
        <Stack.Screen name="OnboardingGenres" component={OnboardingGenresRoute} />
        <Stack.Screen name="Profile" component={ProfilePlaceholderScreen} />
        <Stack.Screen name="Admin" component={AdminPlaceholderScreen} />
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
  placeholder: {
    alignItems: "center",
    backgroundColor: baseColors.black,
    flex: 1,
    gap: spacing[4],
    justifyContent: "center"
  }
});

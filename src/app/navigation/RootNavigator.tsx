import { StyleSheet, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { AppText } from "@/components/ui";
import { SignUpScreen } from "@/features/auth/screens/SignUpScreen";
import { SignInScreen } from "@/features/auth/screens/SignInScreen";
import { HomeScreen } from "@/features/home/screens/HomeScreen";
import { OnboardingMusicPreview } from "@/features/onboarding/screens/OnboardingMusicPreview";
import { OnboardingMusicRoute } from "@/features/onboarding/screens/OnboardingMusicRoute";
import type { MusicSelection } from "@/features/onboarding";
import { CameraScreen } from "@/features/recorda-creation/screens/CameraScreen";
import { PreviewScreen } from "@/features/recorda-creation/screens/PreviewScreen";
import { RecordaDetailsScreen } from "@/features/recorda-creation/screens/RecordaDetailsScreen";
import { baseColors, navigationTheme } from "@/theme";

export type RootStackParamList = {
  Feed: undefined;
  Home: undefined;
  SignIn: undefined;
  Admin: undefined;
  Onboarding: undefined;
  Profile: undefined;
  SignUp: undefined;
  Camera: undefined;
  Preview: { uri: string; type: "photo" | "video" };
  OnboardingMusic: { artists: MusicSelection[]; genres: MusicSelection[] };
  OnboardingMusicPreview: undefined;
  RecordaDetails: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function AdminPlaceholderScreen() {
  return (
    <View style={styles.placeholder} testID="admin-screen">
      <AppText variant="headline3">Área administrativa</AppText>
    </View>
  );
}

function ForgotPasswordPlaceholderScreen() {
  return (
    <View style={styles.placeholder} testID="forgot-password-screen">
      <AppText variant="headline3">Recuperação de senha</AppText>
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
        <Stack.Screen name="SignIn" component={SignInScreen} />
        <Stack.Screen name="Admin" component={AdminPlaceholderScreen} />
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
  placeholder: {
    alignItems: "center",
    backgroundColor: baseColors.black,
    flex: 1,
    justifyContent: "center"
  }
});

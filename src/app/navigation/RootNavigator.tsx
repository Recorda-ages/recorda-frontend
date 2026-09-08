import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { CameraScreen } from "@/features/recorda-creation/screens/CameraScreen";
import { PreviewScreen } from "@/features/recorda-creation/screens/PreviewScreen";
import { HomeScreen } from "@/features/home/screens/HomeScreen";
import { OnboardingMusicPreview } from "@/features/onboarding/screens/OnboardingMusicPreview";
import { OnboardingMusicRoute } from "@/features/onboarding/screens/OnboardingMusicRoute";
import type { MusicSelection } from "@/features/onboarding";
import { navigationTheme } from "@/theme";

export type RootStackParamList = {
  Home: undefined;
  Camera: undefined;
  Preview: { uri: string; type: "photo" | "video" };
  OnboardingMusic: { artists: MusicSelection[]; genres: MusicSelection[] };
  OnboardingMusicPreview: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Camera" component={CameraScreen} />
        <Stack.Screen name="Preview" component={PreviewScreen} />
        <Stack.Screen name="OnboardingMusic" component={OnboardingMusicRoute} />
        {__DEV__ ? (
          <Stack.Screen name="OnboardingMusicPreview" component={OnboardingMusicPreview} />
        ) : null}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

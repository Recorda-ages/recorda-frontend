import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { HomeScreen } from "@/features/home/screens/HomeScreen";
import { OnboardingMusicPreview } from "@/features/onboarding/screens/OnboardingMusicPreview";
import { navigationTheme } from "@/theme";

export type RootStackParamList = {
  Home: undefined;
  OnboardingMusicPreview: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={HomeScreen} />
        {__DEV__ ? (
          <Stack.Screen name="OnboardingMusicPreview" component={OnboardingMusicPreview} />
        ) : null}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

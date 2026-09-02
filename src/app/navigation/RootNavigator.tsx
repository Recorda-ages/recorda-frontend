import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { HomeScreen } from "@/features/home/screens/HomeScreen";
import { OnboardingArtistsScreen } from "@/features/onboarding/screens/OnboardingArtistsScreen";
import { OnboardingProvider } from "@/features/onboarding/providers/OnboardingContext";
import { navigationTheme } from "@/theme";

export type RootStackParamList = {
  Home: undefined;
  OnboardingArtists: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <OnboardingProvider>
      <NavigationContainer theme={navigationTheme}>
        <Stack.Navigator
          screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "transparent" } }}
          initialRouteName="OnboardingArtists"
        >
          <Stack.Screen name="OnboardingArtists" component={OnboardingArtistsScreen} />
          <Stack.Screen name="Home" component={HomeScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </OnboardingProvider>
  );
}

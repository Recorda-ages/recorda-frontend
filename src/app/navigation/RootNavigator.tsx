import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { View } from "react-native";

import { HomeScreen } from "@/features/home/screens/HomeScreen";
import { SplashScreen } from "@/features/splash";
import { navigationTheme } from "@/theme";

export type RootStackParamList = {
  Splash: undefined;
  Home: undefined;
  Login: undefined;
  Feed: undefined;
  Admin: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const FallbackLoginScreen = () => <View testID="login-screen" />;

export function RootNavigator() {
  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Login" component={FallbackLoginScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

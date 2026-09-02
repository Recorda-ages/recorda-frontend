import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { PasswordRecoveryScreen } from "@/features/auth/screens/PasswordRecoveryScreen";
import { HomeScreen } from "@/features/home/screens/HomeScreen";
import { navigationTheme } from "@/theme";

export type RootStackParamList = {
  Home: undefined;
  PasswordRecovery: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="PasswordRecovery" component={PasswordRecoveryScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

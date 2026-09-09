import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { PasswordRecoveryScreen } from "@/features/auth/screens/PasswordRecoveryScreen";
import { navigationTheme } from "@/theme";

export type RootStackParamList = {
  PasswordRecovery: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator initialRouteName="PasswordRecovery" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="PasswordRecovery" component={PasswordRecoveryScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

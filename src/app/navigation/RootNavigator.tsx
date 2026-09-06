import { StyleSheet, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { AppText } from "@/components/ui";
import { SignUpScreen } from "@/features/auth/screens/SignUpScreen";
import { HomeScreen } from "@/features/home/screens/HomeScreen";
import { baseColors, navigationTheme } from "@/theme";

export type RootStackParamList = {
  Home: undefined;
  Login: undefined;
  Onboarding: undefined;
  SignUp: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function LoginPlaceholderScreen() {
  return (
    <View style={styles.placeholder} testID="login-screen">
      <AppText variant="headline3">Login</AppText>
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

export function RootNavigator() {
  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator initialRouteName="SignUp" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Login" component={LoginPlaceholderScreen} />
        <Stack.Screen name="Onboarding" component={OnboardingPlaceholderScreen} />
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

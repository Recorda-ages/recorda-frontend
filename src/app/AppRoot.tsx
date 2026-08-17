import { StatusBar } from "expo-status-bar";

import { RootNavigator } from "@/app/navigation/RootNavigator";
import { AppProviders } from "@/app/providers/AppProviders";

export function AppRoot() {
  return (
    <AppProviders>
      <StatusBar style="dark" />
      <RootNavigator />
    </AppProviders>
  );
}

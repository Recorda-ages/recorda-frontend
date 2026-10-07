import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";

import { appFonts } from "@/app/fonts";
import { preloadStartupImages } from "@/app/preloadImages";
import { RootNavigator } from "@/app/navigation/RootNavigator";
import { AppProviders } from "@/app/providers/AppProviders";

void SplashScreen.preventAutoHideAsync();

export function AppRoot() {
  const [fontsLoaded, fontError] = useFonts(appFonts);
  const [imagesReady, setImagesReady] = useState(false);

  useEffect(() => {
    void preloadStartupImages().then(() => setImagesReady(true));
  }, []);

  const isReady = (fontsLoaded || fontError) && imagesReady;

  useEffect(() => {
    if (isReady) {
      void SplashScreen.hideAsync();
    }
  }, [isReady]);

  if (fontError) {
    throw fontError;
  }

  if (!fontsLoaded || !imagesReady) {
    return null;
  }

  return (
    <AppProviders>
      <StatusBar style="dark" />
      <RootNavigator />
    </AppProviders>
  );
}

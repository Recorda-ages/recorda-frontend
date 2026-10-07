import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";

import { appFonts } from "@/app/fonts";
import { preloadStartupImages } from "@/app/preloadImages";
// QA TEMPORÁRIO #228 — REMOVER ANTES DO COMMIT: as duas linhas abaixo trocam
// o app pelo harness do ReportDialog. Reverter com `git checkout src/app/AppRoot.tsx`.
// import { RootNavigator } from "@/app/navigation/RootNavigator";
import { ReportDialogQAHarness } from "../../QA-228-report-dialog";
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
      {/* QA TEMPORÁRIO #228 — REMOVER ANTES DO COMMIT */}
      <ReportDialogQAHarness />
    </AppProviders>
  );
}

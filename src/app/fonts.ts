import { BaiJamjuree_500Medium } from "@expo-google-fonts/bai-jamjuree/500Medium";
import { BaiJamjuree_600SemiBold } from "@expo-google-fonts/bai-jamjuree/600SemiBold";
import { BaiJamjuree_700Bold } from "@expo-google-fonts/bai-jamjuree/700Bold";
import { Inter_400Regular } from "@expo-google-fonts/inter/400Regular";
import { Inter_600SemiBold } from "@expo-google-fonts/inter/600SemiBold";
import { Inter_700Bold } from "@expo-google-fonts/inter/700Bold";

import { fontFamily } from "@/theme";

export const appFonts = {
  [fontFamily.display.medium]: BaiJamjuree_500Medium,
  [fontFamily.display.semiBold]: BaiJamjuree_600SemiBold,
  [fontFamily.primary.regular]: Inter_400Regular,
  [fontFamily.primary.semiBold]: Inter_600SemiBold,
  [fontFamily.primary.bold]: Inter_700Bold,
  [fontFamily.display.bold]: BaiJamjuree_700Bold
} as const;

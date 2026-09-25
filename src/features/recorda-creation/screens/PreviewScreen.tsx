import { Ionicons } from "@expo/vector-icons";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { useVideoPlayer, VideoView } from "expo-video";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import type { RootStackParamList } from "@/app/navigation/RootNavigator";
import { AppText } from "@/components/ui";
import { useRecordaDraft } from "@/features/recorda-creation/context/RecordaDraftContext";
import { baseColors, colors, radius, spacing } from "@/theme";

export function PreviewScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, "Preview">>();
  const { type, uri } = route.params;
  const { setMedia } = useRecordaDraft();
  const [isConfirming, setIsConfirming] = useState(false);
  const isConfirmingRef = useRef(false);
  const isMountedRef = useRef(true);

  const player = useVideoPlayer(type === "video" ? uri : null, (playerInstance) => {
    playerInstance.loop = true;

    if (type === "video") {
      playerInstance.play();
    }
  });

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  function handleDiscard() {
    navigation.goBack();
  }

  async function handleConfirm() {
    if (isConfirmingRef.current) {
      return;
    }

    isConfirmingRef.current = true;
    setIsConfirming(true);
    let finalUri = uri;

    try {
      if (type === "photo") {
        const context = ImageManipulator.manipulate(uri);
        const manipulatedImage = await context.renderAsync();
        const result = await manipulatedImage.saveAsync({
          compress: 0.6,
          format: SaveFormat.JPEG
        });

        finalUri = result.uri;
        context.release();
        manipulatedImage.release();
      }

      setMedia({ type, uri: finalUri });
      navigation.navigate("RecordaMusic");
    } finally {
      isConfirmingRef.current = false;

      if (isMountedRef.current) {
        setIsConfirming(false);
      }
    }
  }

  return (
    <SafeAreaView style={styles.screen} testID="preview-screen">
      <Image
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        resizeMode="contain"
        source={require("@/assets/images/glow.png")}
        style={styles.radialGlowTop}
      />
      <Image
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        resizeMode="contain"
        source={require("@/assets/images/glow.png")}
        style={styles.radialGlowBottom}
      />

      <View style={styles.content}>
        <View style={styles.stage}>
          {type === "video" ? (
            <VideoView player={player} style={StyleSheet.absoluteFill} />
          ) : (
            <Image source={{ uri }} style={StyleSheet.absoluteFill} />
          )}

          <TouchableOpacity
            onPress={handleDiscard}
            style={styles.discardButton}
            testID="preview-discard-button"
          >
            <Ionicons color="white" name="close" size={28} />
          </TouchableOpacity>
        </View>

        <Pressable
          accessibilityLabel="Avançar"
          accessibilityRole="button"
          accessibilityState={{ busy: isConfirming, disabled: isConfirming }}
          disabled={isConfirming}
          onPress={handleConfirm}
          style={({ pressed }) => [
            styles.confirmButton,
            pressed && !isConfirming ? styles.confirmButtonPressed : undefined
          ]}
          testID="preview-confirm-button"
        >
          {isConfirming ? (
            <ActivityIndicator color={colors.neutrals[900]} />
          ) : (
            <>
              <AppText style={styles.confirmLabel} variant="buttonLarge">
                Avançar
              </AppText>
              <Ionicons color={colors.neutrals[900]} name="chevron-forward" size={20} />
            </>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  confirmButton: {
    alignItems: "center",
    backgroundColor: colors.primary[500],
    borderRadius: radius.full,
    flexDirection: "row",
    gap: spacing[2],
    justifyContent: "center",
    marginBottom: spacing[6],
    marginHorizontal: spacing[4],
    marginTop: spacing[4],
    minHeight: 58
  },
  confirmButtonPressed: {
    opacity: 0.82
  },
  confirmLabel: {
    color: colors.neutrals[900]
  },
  content: {
    flex: 1
  },
  discardButton: {
    left: spacing[4],
    position: "absolute",
    top: spacing[4]
  },
  screen: {
    backgroundColor: baseColors.black,
    flex: 1
  },
  stage: {
    backgroundColor: baseColors.black,
    borderRadius: radius.xl,
    flex: 1,
    marginHorizontal: spacing[4],
    marginTop: spacing[2],
    overflow: "hidden",
    position: "relative"
  },
  radialGlowBottom: {
    bottom: -190,
    height: 520,
    opacity: 0.42,
    pointerEvents: "none",
    position: "absolute",
    right: -210,
    transform: [{ rotate: "180deg" }],
    width: 520
  },
  radialGlowTop: {
    height: 520,
    left: -210,
    opacity: 0.48,
    pointerEvents: "none",
    position: "absolute",
    top: -190,
    width: 520
  }
});

import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useIsFocused, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { CameraMode, PermissionResponse } from "expo-camera";
import { CameraView, useCameraPermissions, useMicrophonePermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Image,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import type { RootStackParamList } from "@/app/navigation/RootNavigator";
import { AppText, Button, Screen } from "@/components/ui";
import { baseColors, radius, spacing } from "@/theme";

let MediaLibrary: typeof import("expo-media-library") | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  MediaLibrary = require("expo-media-library");
} catch {
  // Native module ExpoMediaLibraryNext is not available in Expo Go on SDK 57
}

function useFallbackMediaPermissions(): [PermissionResponse, () => Promise<PermissionResponse>] {
  const fallback: PermissionResponse = {
    canAskAgain: false,
    expires: "never",
    granted: false,
    status: "denied" as PermissionResponse["status"]
  };
  return [fallback, async () => fallback];
}

function useMediaLibraryPermissions() {
  const hook = MediaLibrary?.usePermissions ?? useFallbackMediaPermissions;
  return hook();
}

const HOLD_THRESHOLD_MS = 300;
const MAX_VIDEO_DURATION_SECONDS = 60;
const MAX_VIDEO_DURATION_MS = MAX_VIDEO_DURATION_SECONDS * 1000;

export function CameraScreen() {
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [microphonePermission, requestMicrophonePermission] = useMicrophonePermissions();
  const [mediaLibraryPermission, requestMediaLibraryPermission] = useMediaLibraryPermissions();
  const [facing, setFacing] = useState<"back" | "front">("back");
  const [cameraMode, setCameraMode] = useState<CameraMode>("picture");
  const [isRecording, setIsRecording] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [lastGalleryUri, setLastGalleryUri] = useState<null | string>(null);
  const isFocused = useIsFocused();
  const cameraRef = useRef<CameraView>(null);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recordingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cameraModeRef = useRef<CameraMode>("picture");
  const cameraReadyResolver = useRef<(() => void) | null>(null);
  const hasRequestedRecordingStopRef = useRef(false);
  const isCameraReadyRef = useRef(false);
  const isCapturingPhotoRef = useRef(false);
  const isFocusedRef = useRef(isFocused);
  const isMountedRef = useRef(true);
  const isRecordingRef = useRef(false);
  const isStartingRecordingRef = useRef(false);
  const shouldStopRecordingWhenReadyRef = useRef(false);
  const skipPhotoOnPressOutRef = useRef(false);
  const [captureButtonScale] = useState(() => new Animated.Value(1));
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  useEffect(() => {
    async function loadLastGalleryAsset() {
      try {
        let permission = mediaLibraryPermission;

        if (!permission?.granted) {
          permission = await requestMediaLibraryPermission();
        }

        if (!permission?.granted || !MediaLibrary) {
          return;
        }

        const { assets } = await MediaLibrary.getAssetsAsync({
          first: 1,
          sortBy: "creationTime"
        });

        if (assets[0] && isMountedRef.current) {
          const assetInfo = await MediaLibrary.getAssetInfoAsync(assets[0]);
          setLastGalleryUri(assetInfo.localUri ?? assets[0].uri);
        }
      } catch (error) {
        console.log("erro ao carregar galeria:", error);
      }
    }

    void loadLastGalleryAsset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;

      if (holdTimer.current) {
        clearTimeout(holdTimer.current);
        holdTimer.current = null;
      }

      if (recordingTimeout.current) {
        clearTimeout(recordingTimeout.current);
        recordingTimeout.current = null;
      }

      cameraReadyResolver.current?.();
      cameraReadyResolver.current = null;
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      isFocusedRef.current = true;

      return () => {
        isFocusedRef.current = false;

        if (holdTimer.current) {
          clearTimeout(holdTimer.current);
          holdTimer.current = null;
        }

        if (recordingTimeout.current) {
          clearTimeout(recordingTimeout.current);
          recordingTimeout.current = null;
        }

        cameraReadyResolver.current?.();
        cameraReadyResolver.current = null;

        if (!hasRequestedRecordingStopRef.current) {
          hasRequestedRecordingStopRef.current = true;
          shouldStopRecordingWhenReadyRef.current = true;

          if (isRecordingRef.current) {
            void cameraRef.current?.stopRecording();
          }
        }

        cameraModeRef.current = "picture";
        isCameraReadyRef.current = false;
        isCapturingPhotoRef.current = false;
        isRecordingRef.current = false;
        isStartingRecordingRef.current = false;
        skipPhotoOnPressOutRef.current = false;

        if (isMountedRef.current) {
          setCameraMode("picture");
          setIsCameraReady(false);
          setIsRecording(false);
        }
      };
    }, [])
  );

  useEffect(() => {
    if (isFocused) {
      isFocusedRef.current = true;
    }

    if (!isFocused) {
      isCameraReadyRef.current = false;
    }
  }, [isFocused]);

  if (!cameraPermission || !microphonePermission) {
    return null;
  }

  if (!cameraPermission.granted || !microphonePermission.granted) {
    return (
      <Screen>
        <AppText>Precisamos da camera e do microfone pra criar sua Recorda.</AppText>
        <Button
          label="Permitir acesso"
          onPress={async () => {
            await requestCameraPermission();
            await requestMicrophonePermission();
          }}
        />
      </Screen>
    );
  }

  function clearHoldTimer() {
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
  }

  function clearRecordingTimeout() {
    if (recordingTimeout.current) {
      clearTimeout(recordingTimeout.current);
      recordingTimeout.current = null;
    }
  }

  function resolveCameraReadyWaiter() {
    cameraReadyResolver.current?.();
    cameraReadyResolver.current = null;
  }

  function setCameraReady(nextIsCameraReady: boolean) {
    isCameraReadyRef.current = nextIsCameraReady;

    if (isMountedRef.current) {
      setIsCameraReady(nextIsCameraReady);
    }
  }

  function setRecordingState(nextIsRecording: boolean) {
    if (isMountedRef.current) {
      setIsRecording(nextIsRecording);
    }
  }

  function markCameraNotReady() {
    setCameraReady(false);
  }

  function handleCameraReady() {
    if (!isMountedRef.current) {
      return;
    }

    setCameraReady(true);
    resolveCameraReadyWaiter();
  }

  function resetCameraModeToPicture() {
    if (cameraModeRef.current === "picture") {
      return;
    }

    cameraModeRef.current = "picture";
    markCameraNotReady();

    if (isMountedRef.current) {
      setCameraMode("picture");
    }
  }

  function prepareCameraMode(nextMode: CameraMode) {
    if (!isMountedRef.current || !isFocusedRef.current) {
      return Promise.resolve();
    }

    if (cameraModeRef.current === nextMode && isCameraReadyRef.current) {
      return Promise.resolve();
    }

    resolveCameraReadyWaiter();
    cameraModeRef.current = nextMode;
    markCameraNotReady();

    if (isMountedRef.current) {
      setCameraMode(nextMode);
    }

    return new Promise<void>((resolve) => {
      cameraReadyResolver.current = resolve;
    });
  }

  function requestStopRecording() {
    if (hasRequestedRecordingStopRef.current) {
      return;
    }

    hasRequestedRecordingStopRef.current = true;
    shouldStopRecordingWhenReadyRef.current = true;

    if (isStartingRecordingRef.current) {
      resolveCameraReadyWaiter();
    }

    if (isRecordingRef.current) {
      void cameraRef.current?.stopRecording();
    }
  }

  async function handleTakePhoto() {
    if (
      !isFocusedRef.current ||
      !isCameraReadyRef.current ||
      isCapturingPhotoRef.current ||
      isRecordingRef.current ||
      isStartingRecordingRef.current
    ) {
      return;
    }

    isCapturingPhotoRef.current = true;

    try {
      await prepareCameraMode("picture");

      if (!isFocusedRef.current || !cameraRef.current) {
        return;
      }

      const photo = await cameraRef.current.takePictureAsync();

      if (photo && isFocusedRef.current) {
        navigation.navigate("Preview", { type: "photo", uri: photo.uri });
      }
    } catch (error) {
      console.log("erro ao capturar foto:", error);
    } finally {
      isCapturingPhotoRef.current = false;
    }
  }

  async function startRecording() {
    if (
      !isFocusedRef.current ||
      !isCameraReadyRef.current ||
      isCapturingPhotoRef.current ||
      isRecordingRef.current ||
      isStartingRecordingRef.current
    ) {
      return;
    }

    skipPhotoOnPressOutRef.current = true;
    isStartingRecordingRef.current = true;
    hasRequestedRecordingStopRef.current = false;
    shouldStopRecordingWhenReadyRef.current = false;

    try {
      await prepareCameraMode("video");

      if (!isFocusedRef.current || !cameraRef.current || shouldStopRecordingWhenReadyRef.current) {
        return;
      }

      isStartingRecordingRef.current = false;
      isRecordingRef.current = true;
      setRecordingState(true);
      recordingTimeout.current = setTimeout(requestStopRecording, MAX_VIDEO_DURATION_MS);

      const video = await cameraRef.current.recordAsync({
        maxDuration: MAX_VIDEO_DURATION_SECONDS
      });

      if (video && isFocusedRef.current) {
        navigation.navigate("Preview", { type: "video", uri: video.uri });
      }
    } catch (error) {
      console.log("erro ao gravar video:", error);
    } finally {
      clearRecordingTimeout();
      isRecordingRef.current = false;
      isStartingRecordingRef.current = false;
      hasRequestedRecordingStopRef.current = false;
      shouldStopRecordingWhenReadyRef.current = false;
      setRecordingState(false);
      resetCameraModeToPicture();
    }
  }

  function animateCaptureButtonPressIn() {
    Animated.spring(captureButtonScale, {
      speed: 50,
      toValue: 0.86,
      useNativeDriver: true
    }).start();
  }

  function animateCaptureButtonPressOut() {
    Animated.spring(captureButtonScale, {
      bounciness: 10,
      speed: 20,
      toValue: 1,
      useNativeDriver: true
    }).start();
  }

  function handlePressIn() {
    if (
      !isFocusedRef.current ||
      !isCameraReadyRef.current ||
      isCapturingPhotoRef.current ||
      isRecordingRef.current ||
      isStartingRecordingRef.current
    ) {
      return;
    }

    skipPhotoOnPressOutRef.current = false;
    clearHoldTimer();
    holdTimer.current = setTimeout(() => {
      holdTimer.current = null;
      void startRecording();
    }, HOLD_THRESHOLD_MS);
  }

  function handlePressOut() {
    clearHoldTimer();

    if (isRecordingRef.current || isStartingRecordingRef.current) {
      requestStopRecording();
      return;
    }

    if (skipPhotoOnPressOutRef.current) {
      skipPhotoOnPressOutRef.current = false;
      return;
    }

    void handleTakePhoto();
  }

  function handleFlipCamera() {
    if (isCapturingPhotoRef.current || isRecordingRef.current || isStartingRecordingRef.current) {
      return;
    }

    markCameraNotReady();
    setFacing((current) => (current === "back" ? "front" : "back"));
  }

  async function handleOpenGallery() {
    if (isCapturingPhotoRef.current || isRecordingRef.current || isStartingRecordingRef.current) {
      return;
    }

    try {
      const currentPermission = await ImagePicker.getMediaLibraryPermissionsAsync();
      const galleryPermission = currentPermission.granted
        ? currentPermission
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!galleryPermission.granted) {
        Alert.alert("Permissao necessaria", "Permita acesso a galeria para escolher uma midia.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsMultipleSelection: false,
        mediaTypes: ["images", "videos"],
        quality: 1,
        selectionLimit: 1,
        videoMaxDuration: MAX_VIDEO_DURATION_SECONDS
      });

      if (result.canceled) {
        return;
      }

      const asset = result.assets[0];

      if (!asset) {
        return;
      }

      const isVideoTooLong =
        asset.type === "video" &&
        asset.duration &&
        asset.duration > MAX_VIDEO_DURATION_SECONDS * 1000;

      if (isVideoTooLong) {
        Alert.alert("Video muito longo", "Escolha um video de ate 60 segundos.");
        return;
      }

      navigation.navigate("Preview", {
        type: asset.type === "video" ? "video" : "photo",
        uri: asset.uri
      });
    } catch (error) {
      console.log("erro ao abrir galeria:", error);
    }
  }

  return (
    <SafeAreaView style={styles.screen} testID="camera-screen">
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
          {isFocused ? (
            <CameraView
              ref={cameraRef}
              active={isFocused}
              facing={facing}
              key={`${facing}-${cameraMode}`}
              mode={cameraMode}
              onCameraReady={handleCameraReady}
              onMountError={markCameraNotReady}
              style={StyleSheet.absoluteFill}
            />
          ) : null}

          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            testID="camera-back-button"
          >
            <Ionicons color="white" name="chevron-back" size={28} />
          </TouchableOpacity>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity onPress={handleOpenGallery} testID="camera-gallery-button">
            {lastGalleryUri ? (
              <Image source={{ uri: lastGalleryUri }} style={styles.galleryThumb} />
            ) : (
              <View style={styles.galleryThumb} />
            )}
          </TouchableOpacity>

          <Pressable
            accessibilityLabel="Tirar foto"
            accessibilityRole="button"
            onPressIn={() => {
              animateCaptureButtonPressIn();
              handlePressIn();
            }}
            onPressOut={() => {
              animateCaptureButtonPressOut();
              handlePressOut();
            }}
            style={!isCameraReady && styles.captureButtonDisabled}
            testID="camera-capture-button"
          >
            <Animated.View
              style={[styles.captureButton, { transform: [{ scale: captureButtonScale }] }]}
            >
              <View
                style={[
                  styles.captureButtonInner,
                  isRecording && styles.captureButtonInnerRecording
                ]}
              />
            </Animated.View>
          </Pressable>

          <TouchableOpacity
            disabled={isRecording}
            onPress={handleFlipCamera}
            style={[styles.flipButton, isRecording && styles.flipButtonDisabled]}
            testID="camera-flip-button"
          >
            <Ionicons color="white" name="camera-reverse-outline" size={28} />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  backButton: {
    left: spacing[4],
    position: "absolute",
    top: spacing[4]
  },
  captureButton: {
    alignItems: "center",
    borderColor: "white",
    borderRadius: 38,
    borderWidth: 4,
    height: 76,
    justifyContent: "center",
    width: 76
  },
  captureButtonDisabled: {
    opacity: 0.56
  },
  captureButtonInner: {
    backgroundColor: "white",
    borderRadius: 30,
    height: 60,
    width: 60
  },
  captureButtonInnerRecording: {
    backgroundColor: "#ff3b30",
    borderRadius: 12,
    height: 32,
    width: 32
  },
  content: {
    flex: 1
  },
  controls: {
    alignItems: "center",
    flexDirection: "row",
    height: 58,
    justifyContent: "space-between",
    marginBottom: spacing[6],
    marginHorizontal: spacing[4],
    marginTop: spacing[4]
  },
  flipButton: {
    alignItems: "center",
    height: 44,
    justifyContent: "center",
    width: 44
  },
  flipButtonDisabled: {
    opacity: 0.56
  },
  galleryThumb: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 8,
    height: 44,
    width: 44
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

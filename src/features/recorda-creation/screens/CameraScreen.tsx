import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useIsFocused, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { CameraMode } from "expo-camera";
import { CameraView, useCameraPermissions, useMicrophonePermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Image, Pressable, StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import type { RootStackParamList } from "@/app/navigation/RootNavigator";
import { AppText, Button, Screen } from "@/components/ui";

const HOLD_THRESHOLD_MS = 300;
const MAX_VIDEO_DURATION_SECONDS = 60;
const MAX_VIDEO_DURATION_MS = MAX_VIDEO_DURATION_SECONDS * 1000;

export function CameraScreen() {
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [microphonePermission, requestMicrophonePermission] = useMicrophonePermissions();
  const [facing, setFacing] = useState<"back" | "front">("back");
  const [cameraMode, setCameraMode] = useState<CameraMode>("picture");
  const [isRecording, setIsRecording] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
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
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

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
    <View style={styles.container}>
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

      <SafeAreaView style={styles.overlay}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          testID="camera-back-button"
        >
          <Ionicons color="white" name="chevron-back" size={28} />
        </TouchableOpacity>

        <View style={styles.bottomBar}>
          <TouchableOpacity onPress={handleOpenGallery} testID="camera-gallery-button">
            <View style={styles.galleryThumb}>
              <Ionicons name="images-outline" size={24} color="white" />
            </View>
          </TouchableOpacity>

          <Pressable
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            style={[
              styles.captureButton,
              isRecording && styles.captureButtonRecording,
              !isCameraReady && styles.captureButtonDisabled
            ]}
            testID="camera-capture-button"
          />

          <TouchableOpacity
            disabled={isRecording}
            onPress={handleFlipCamera}
            style={[styles.flipButton, isRecording && styles.flipButtonDisabled]}
            testID="camera-flip-button"
          >
            <Ionicons color="white" name="camera-reverse-outline" size={28} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  backButton: {
    left: 16,
    position: "absolute",
    top: 16
  },
  bottomBar: {
    alignItems: "center",
    bottom: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    position: "absolute",
    width: "100%"
  },
  captureButton: {
    backgroundColor: "white",
    borderRadius: 36,
    height: 72,
    width: 72
  },
  captureButtonDisabled: {
    opacity: 0.56
  },
  captureButtonRecording: {
    backgroundColor: "#ff3b30"
  },
  container: {
    backgroundColor: "black",
    flex: 1
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
    width: 44,
    alignItems: "center",
    justifyContent: "center"
  },
  overlay: {
    flex: 1
  }
});

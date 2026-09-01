import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { CameraView, useCameraPermissions, useMicrophonePermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import * as MediaLibrary from "expo-media-library";
import { useEffect, useRef, useState } from "react";
import { Alert, Image, Pressable, StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import type { RootStackParamList } from "@/app/navigation/RootNavigator";
import { AppText, Button, Screen } from "@/components/ui";

const HOLD_THRESHOLD_MS = 300;
const MAX_VIDEO_DURATION_SECONDS = 60;

export function CameraScreen() {
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [microphonePermission, requestMicrophonePermission] = useMicrophonePermissions();
  const [mediaLibraryPermission, requestMediaLibraryPermission] = MediaLibrary.usePermissions();
  const [facing, setFacing] = useState<"back" | "front">("back");
  const [isRecording, setIsRecording] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [lastGalleryUri, setLastGalleryUri] = useState<null | string>(null);
  const cameraRef = useRef<CameraView>(null);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isRecordingRef = useRef(false);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  useEffect(() => {
    async function loadLastGalleryAsset() {
      let permission = mediaLibraryPermission;

      if (!permission?.granted) {
        permission = await requestMediaLibraryPermission();
      }

      if (!permission?.granted) {
        return;
      }

      const { assets } = await MediaLibrary.getAssetsAsync({
        first: 1,
        sortBy: "creationTime"
      });

      if (assets[0]) {
        const assetInfo = await MediaLibrary.getAssetInfoAsync(assets[0]);
        setLastGalleryUri(assetInfo.localUri ?? assets[0].uri);
      }
    }

    void loadLastGalleryAsset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!cameraPermission || !microphonePermission) {
    return null;
  }

  if (!cameraPermission.granted || !microphonePermission.granted) {
    return (
      <Screen>
        <AppText>Precisamos da câmera e do microfone pra criar sua Recorda.</AppText>
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

  async function handleTakePhoto() {
    if (!isCameraReady) {
      return;
    }

    const photo = await cameraRef.current?.takePictureAsync();

    if (photo) {
      navigation.navigate("Preview", { type: "photo", uri: photo.uri });
    }
  }

  async function startRecording() {
    if (!isCameraReady) {
      return;
    }

    isRecordingRef.current = true;
    setIsRecording(true);

    try {
      const video = await cameraRef.current?.recordAsync({
        maxDuration: MAX_VIDEO_DURATION_SECONDS
      });

      if (video) {
        navigation.navigate("Preview", { type: "video", uri: video.uri });
      }
    } catch (error) {
      console.log("erro ao gravar vídeo:", error);
    } finally {
      isRecordingRef.current = false;
      setIsRecording(false);
    }
  }

  function handlePressIn() {
    holdTimer.current = setTimeout(() => {
      void startRecording();
    }, HOLD_THRESHOLD_MS);
  }

  function handlePressOut() {
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }

    if (isRecordingRef.current) {
      cameraRef.current?.stopRecording();
    } else {
      void handleTakePhoto();
    }
  }

  function handleFlipCamera() {
    setFacing((current) => (current === "back" ? "front" : "back"));
  }

  async function handleOpenGallery() {
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: false,
      mediaTypes: ["images", "videos"],
      quality: 1,
      selectionLimit: 1
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
      Alert.alert("Vídeo muito longo", "Escolha um vídeo de até 60 segundos.");
      return;
    }

    navigation.navigate("Preview", {
      type: asset.type === "video" ? "video" : "photo",
      uri: asset.uri
    });
  }

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        facing={facing}
        mode="video"
        onCameraReady={() => setIsCameraReady(true)}
        style={StyleSheet.absoluteFill}
      />

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
            {lastGalleryUri ? (
              <Image source={{ uri: lastGalleryUri }} style={styles.galleryThumb} />
            ) : (
              <View style={styles.galleryThumb} />
            )}
          </TouchableOpacity>

          <Pressable
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            style={[styles.captureButton, isRecording && styles.captureButtonRecording]}
            testID="camera-capture-button"
          />

          <TouchableOpacity
            onPress={handleFlipCamera}
            style={styles.flipButton}
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
  galleryThumb: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 8,
    height: 44,
    width: 44
  },
  overlay: {
    flex: 1
  }
});

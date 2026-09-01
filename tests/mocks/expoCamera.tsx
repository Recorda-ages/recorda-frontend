import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { View } from "react-native";

type MockCameraProps = {
  onCameraReady?: () => void;
  style?: StyleProp<ViewStyle>;
};

export const CameraView = forwardRef<unknown, MockCameraProps>(function CameraView(
  { onCameraReady, style },
  ref
) {
  const resolveRecordingRef = useRef<((value: { uri: string }) => void) | null>(null);

  useImperativeHandle(ref, () => ({
    recordAsync: () =>
      new Promise<{ uri: string }>((resolve) => {
        resolveRecordingRef.current = resolve;
      }),
    stopRecording: () => {
      resolveRecordingRef.current?.({ uri: "file://mock-video.mp4" });
      resolveRecordingRef.current = null;
    },
    takePictureAsync: () => Promise.resolve({ uri: "file://mock-photo.jpg" })
  }));

  useEffect(() => {
    onCameraReady?.();
  }, [onCameraReady]);

  return <View style={style} testID="mock-camera-view" />;
});

export function useCameraPermissions() {
  const permission = { canAskAgain: true, granted: true, status: "granted" };
  const requestPermission = () => Promise.resolve(permission);

  return [permission, requestPermission] as const;
}

export function useMicrophonePermissions() {
  const permission = { canAskAgain: true, granted: true, status: "granted" };
  const requestPermission = () => Promise.resolve(permission);

  return [permission, requestPermission] as const;
}

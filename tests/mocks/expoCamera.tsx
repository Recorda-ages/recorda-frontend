import { forwardRef, useEffect, useImperativeHandle } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { View } from "react-native";

type CameraMode = "picture" | "video";
type CameraFacing = "back" | "front";

type MockCameraProps = {
  active?: boolean;
  facing?: CameraFacing;
  mode?: CameraMode;
  onCameraReady?: () => void;
  onMountError?: () => void;
  style?: StyleProp<ViewStyle>;
};

type MockCapture = {
  uri: string;
};

let resolveRecording: ((value: MockCapture) => void) | null = null;
let rejectRecording: ((reason?: unknown) => void) | null = null;

export const mockCameraViewState: { latestProps: MockCameraProps | null } = {
  latestProps: null
};

export const mockTakePictureAsync = jest.fn<Promise<MockCapture>, []>();
export const mockRecordAsync = jest.fn<Promise<MockCapture>, [{ maxDuration?: number }?]>();
export const mockStopRecording = jest.fn<void, []>();

export function resetCameraMock() {
  mockCameraViewState.latestProps = null;
  resolveRecording = null;
  rejectRecording = null;

  mockTakePictureAsync.mockReset();
  mockTakePictureAsync.mockResolvedValue({ uri: "file://mock-photo.jpg" });

  mockRecordAsync.mockReset();
  mockRecordAsync.mockImplementation(
    () =>
      new Promise<MockCapture>((resolve, reject) => {
        resolveRecording = resolve;
        rejectRecording = reject;
      })
  );

  mockStopRecording.mockReset();
  mockStopRecording.mockImplementation(() => {
    resolveRecording?.({ uri: "file://mock-video.mp4" });
    resolveRecording = null;
    rejectRecording = null;
  });
}

export function resolvePendingRecording(uri = "file://mock-video.mp4") {
  resolveRecording?.({ uri });
  resolveRecording = null;
  rejectRecording = null;
}

export function rejectPendingRecording(error: unknown = new Error("recording failed")) {
  rejectRecording?.(error);
  resolveRecording = null;
  rejectRecording = null;
}

resetCameraMock();

export const CameraView = forwardRef<unknown, MockCameraProps>(function CameraView(props, ref) {
  const { onCameraReady, style } = props;

  useImperativeHandle(ref, () => ({
    recordAsync: mockRecordAsync,
    stopRecording: mockStopRecording,
    takePictureAsync: mockTakePictureAsync
  }));

  useEffect(() => {
    mockCameraViewState.latestProps = props;
    onCameraReady?.();
  }, [onCameraReady, props]);

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

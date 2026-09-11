import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import * as ExpoCamera from "expo-camera";
import * as ExpoImagePicker from "expo-image-picker";
import { Alert } from "react-native";

import { CameraScreen } from "@/features/recorda-creation/screens/CameraScreen";

import type * as ExpoCameraMock from "../../../mocks/expoCamera";
import type * as ExpoImagePickerMock from "../../../mocks/expoImagePicker";

const expoCameraMock = ExpoCamera as unknown as typeof ExpoCameraMock;
const expoImagePickerMock = ExpoImagePicker as unknown as typeof ExpoImagePickerMock;

const mockGoBack = jest.fn();
const mockNavigate = jest.fn();
let mockIsFocused = true;

jest.mock("@react-navigation/native", () => {
  const actual = jest.requireActual("@react-navigation/native");
  const React = jest.requireActual("react");

  return {
    ...actual,
    useFocusEffect: (effect: () => undefined | (() => void)) => {
      React.useEffect(effect, [effect]);
    },
    useIsFocused: () => mockIsFocused,
    useNavigation: () => ({
      goBack: mockGoBack,
      navigate: mockNavigate
    })
  };
});

async function renderCamera() {
  const result = render(<CameraScreen />);

  await act(async () => undefined);

  return result;
}

async function startLongPressRecording() {
  const captureButton = screen.getByTestId("camera-capture-button");

  fireEvent(captureButton, "pressIn");

  await act(async () => {
    jest.advanceTimersByTime(300);
  });

  await waitFor(() => {
    expect(expoCameraMock.mockRecordAsync).toHaveBeenCalledWith({
      maxDuration: 60
    });
  });

  return captureButton;
}

describe("CameraScreen", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
    mockGoBack.mockClear();
    mockNavigate.mockClear();
    mockIsFocused = true;
    expoCameraMock.resetCameraMock();
    expoImagePickerMock.resetImagePickerMock();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it("shows the camera viewfinder in picture mode once permissions are granted", async () => {
    await renderCamera();

    expect(screen.getByTestId("mock-camera-view")).toBeTruthy();
    expect(screen.getByTestId("camera-capture-button")).toBeTruthy();
    expect(expoCameraMock.mockCameraViewState.latestProps?.active).toBe(true);
    expect(expoCameraMock.mockCameraViewState.latestProps?.mode).toBe("picture");
  });

  it("renders nothing while permissions are still loading", () => {
    jest.spyOn(ExpoCamera, "useCameraPermissions").mockReturnValue([null, jest.fn(), jest.fn()]);

    render(<CameraScreen />);

    expect(screen.queryByTestId("mock-camera-view")).toBeNull();
  });

  it("shows a permission request when camera access is not granted", () => {
    const deniedPermission = {
      canAskAgain: true,
      expires: "never" as const,
      granted: false,
      status: "denied" as ExpoCamera.PermissionStatus
    };
    const requestCameraPermission = jest.fn().mockResolvedValue(deniedPermission);

    jest
      .spyOn(ExpoCamera, "useCameraPermissions")
      .mockReturnValue([deniedPermission, requestCameraPermission, jest.fn()]);

    render(<CameraScreen />);

    expect(
      screen.getByText("Precisamos da camera e do microfone pra criar sua Recorda.")
    ).toBeTruthy();
  });

  it("requests camera and microphone access when the permission button is pressed", async () => {
    const deniedPermission = {
      canAskAgain: true,
      expires: "never" as const,
      granted: false,
      status: "denied" as ExpoCamera.PermissionStatus
    };
    const requestCameraPermission = jest.fn().mockResolvedValue(deniedPermission);
    const requestMicrophonePermission = jest.fn().mockResolvedValue(deniedPermission);

    jest
      .spyOn(ExpoCamera, "useCameraPermissions")
      .mockReturnValue([deniedPermission, requestCameraPermission, jest.fn()]);
    jest
      .spyOn(ExpoCamera, "useMicrophonePermissions")
      .mockReturnValue([deniedPermission, requestMicrophonePermission, jest.fn()]);

    render(<CameraScreen />);

    fireEvent.press(screen.getByText("Permitir acesso"));

    await waitFor(() => {
      expect(requestCameraPermission).toHaveBeenCalledTimes(1);
      expect(requestMicrophonePermission).toHaveBeenCalledTimes(1);
    });
  });

  it("does not mount the native camera while the screen is not focused", async () => {
    mockIsFocused = false;

    await renderCamera();

    expect(screen.queryByTestId("mock-camera-view")).toBeNull();
  });

  it("navigates back when the back button is pressed", async () => {
    await renderCamera();

    fireEvent.press(screen.getByTestId("camera-back-button"));

    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });

  it("takes one photo and navigates to Preview on a quick tap", async () => {
    await renderCamera();

    const captureButton = screen.getByTestId("camera-capture-button");

    fireEvent(captureButton, "pressIn");
    fireEvent(captureButton, "pressOut");

    await waitFor(() => {
      expect(expoCameraMock.mockTakePictureAsync).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith("Preview", {
        type: "photo",
        uri: "file://mock-photo.jpg"
      });
    });
    expect(expoCameraMock.mockRecordAsync).not.toHaveBeenCalled();
    expect(expoCameraMock.mockCameraViewState.latestProps?.mode).toBe("picture");
  });

  it("records a video on long press, stops on release, and does not take a photo", async () => {
    jest.useFakeTimers();
    await renderCamera();

    const captureButton = await startLongPressRecording();

    expect(expoCameraMock.mockCameraViewState.latestProps?.mode).toBe("video");

    fireEvent(captureButton, "pressOut");

    await waitFor(() => {
      expect(expoCameraMock.mockStopRecording).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith("Preview", {
        type: "video",
        uri: "file://mock-video.mp4"
      });
    });
    expect(expoCameraMock.mockTakePictureAsync).not.toHaveBeenCalled();

    await waitFor(() => {
      expect(expoCameraMock.mockCameraViewState.latestProps?.mode).toBe("picture");
    });
  });

  it("stops recording at 60 seconds without issuing duplicate stops", async () => {
    jest.useFakeTimers();
    await renderCamera();

    const captureButton = await startLongPressRecording();

    await act(async () => {
      jest.advanceTimersByTime(60000);
    });

    await waitFor(() => {
      expect(expoCameraMock.mockStopRecording).toHaveBeenCalledTimes(1);
    });

    fireEvent(captureButton, "pressOut");

    expect(expoCameraMock.mockStopRecording).toHaveBeenCalledTimes(1);
    expect(expoCameraMock.mockTakePictureAsync).not.toHaveBeenCalled();
  });

  it("recovers after a photo capture error and allows a later photo", async () => {
    jest.spyOn(console, "log").mockImplementation(() => undefined);
    expoCameraMock.mockTakePictureAsync.mockRejectedValueOnce(new Error("photo failed"));
    await renderCamera();

    const captureButton = screen.getByTestId("camera-capture-button");

    fireEvent(captureButton, "pressIn");
    fireEvent(captureButton, "pressOut");

    await waitFor(() => {
      expect(expoCameraMock.mockTakePictureAsync).toHaveBeenCalledTimes(1);
    });
    expect(mockNavigate).not.toHaveBeenCalled();

    fireEvent(captureButton, "pressIn");
    fireEvent(captureButton, "pressOut");

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("Preview", {
        type: "photo",
        uri: "file://mock-photo.jpg"
      });
    });
  });

  it("recovers after a recording error and allows a later recording", async () => {
    jest.useFakeTimers();
    jest.spyOn(console, "log").mockImplementation(() => undefined);
    expoCameraMock.mockRecordAsync.mockRejectedValueOnce(new Error("recording failed"));
    await renderCamera();

    await startLongPressRecording();

    await waitFor(() => {
      expect(expoCameraMock.mockCameraViewState.latestProps?.mode).toBe("picture");
    });
    expect(mockNavigate).not.toHaveBeenCalled();

    const captureButton = await startLongPressRecording();
    fireEvent(captureButton, "pressOut");

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("Preview", {
        type: "video",
        uri: "file://mock-video.mp4"
      });
    });
  });

  it("flips the camera and keeps the camera ready for later captures", async () => {
    await renderCamera();

    fireEvent.press(screen.getByTestId("camera-flip-button"));

    await waitFor(() => {
      expect(expoCameraMock.mockCameraViewState.latestProps?.facing).toBe("front");
    });

    fireEvent(screen.getByTestId("camera-capture-button"), "pressIn");
    fireEvent(screen.getByTestId("camera-capture-button"), "pressOut");

    await waitFor(() => {
      expect(expoCameraMock.mockTakePictureAsync).toHaveBeenCalledTimes(1);
    });
  });

  it("does not open the gallery picker when gallery permission is denied", async () => {
    const alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => undefined);
    const deniedPermission = {
      canAskAgain: false,
      granted: false,
      status: "denied" as const
    };

    expoImagePickerMock.mockGetMediaLibraryPermissionsAsync.mockResolvedValue(deniedPermission);
    expoImagePickerMock.mockRequestMediaLibraryPermissionsAsync.mockResolvedValue(deniedPermission);
    await renderCamera();

    fireEvent.press(screen.getByTestId("camera-gallery-button"));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        "Permissao necessaria",
        "Permita acesso a galeria para escolher uma midia."
      );
    });
    expect(expoImagePickerMock.mockLaunchImageLibraryAsync).not.toHaveBeenCalled();
  });

  it("opens the picker for a single media item and does nothing when canceled", async () => {
    await renderCamera();

    fireEvent.press(screen.getByTestId("camera-gallery-button"));

    await waitFor(() => {
      expect(expoImagePickerMock.mockLaunchImageLibraryAsync).toHaveBeenCalledWith({
        allowsMultipleSelection: false,
        mediaTypes: ["images", "videos"],
        quality: 1,
        selectionLimit: 1,
        videoMaxDuration: 60
      });
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("navigates to Preview when a photo is picked from the gallery", async () => {
    expoImagePickerMock.mockLaunchImageLibraryAsync.mockResolvedValue({
      assets: [
        {
          duration: null,
          height: 100,
          type: "image",
          uri: "file://gallery-photo.jpg",
          width: 100
        }
      ],
      canceled: false
    });
    await renderCamera();

    fireEvent.press(screen.getByTestId("camera-gallery-button"));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("Preview", {
        type: "photo",
        uri: "file://gallery-photo.jpg"
      });
    });
  });

  it("does not navigate when the gallery picker fails", async () => {
    jest.spyOn(console, "log").mockImplementation(() => undefined);
    expoImagePickerMock.mockLaunchImageLibraryAsync.mockRejectedValueOnce(
      new Error("picker failed")
    );
    await renderCamera();

    fireEvent.press(screen.getByTestId("camera-gallery-button"));

    await waitFor(() => {
      expect(console.log).toHaveBeenCalledWith("erro ao abrir galeria:", expect.any(Error));
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("rejects a video picked from the gallery that is longer than 60 seconds", async () => {
    const alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => undefined);

    expoImagePickerMock.mockLaunchImageLibraryAsync.mockResolvedValue({
      assets: [
        {
          duration: 90000,
          height: 100,
          type: "video",
          uri: "file://gallery-video.mp4",
          width: 100
        }
      ],
      canceled: false
    });
    await renderCamera();

    fireEvent.press(screen.getByTestId("camera-gallery-button"));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        "Video muito longo",
        "Escolha um video de ate 60 segundos."
      );
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});

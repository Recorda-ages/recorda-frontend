import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import * as ExpoCamera from "expo-camera";
import * as ExpoImagePicker from "expo-image-picker";
import * as ExpoMediaLibrary from "expo-media-library";
import { Alert } from "react-native";

import { CameraScreen } from "@/features/recorda-creation/screens/CameraScreen";

const mockGoBack = jest.fn();
const mockNavigate = jest.fn();

jest.mock("@react-navigation/native", () => {
  const actual = jest.requireActual("@react-navigation/native");

  return {
    ...actual,
    useNavigation: () => ({
      goBack: mockGoBack,
      navigate: mockNavigate
    })
  };
});

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe("CameraScreen", () => {
  beforeEach(() => {
    mockGoBack.mockClear();
    mockNavigate.mockClear();
    jest.restoreAllMocks();
  });

  it("shows the camera viewfinder once permissions are granted", () => {
    render(<CameraScreen />);

    expect(screen.getByTestId("mock-camera-view")).toBeTruthy();
    expect(screen.getByTestId("camera-capture-button")).toBeTruthy();
  });

  it("renders nothing while permissions are still loading", () => {
    jest
      .spyOn(ExpoCamera, "useCameraPermissions")
      .mockReturnValue([null, jest.fn(), jest.fn()]);

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
      screen.getByText("Precisamos da câmera e do microfone pra criar sua Recorda.")
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

  it("navigates back when the back button is pressed", () => {
    render(<CameraScreen />);

    fireEvent.press(screen.getByTestId("camera-back-button"));

    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });

  it("takes a photo and navigates to Preview on a quick tap", async () => {
    render(<CameraScreen />);

    const captureButton = screen.getByTestId("camera-capture-button");

    fireEvent(captureButton, "pressIn");
    fireEvent(captureButton, "pressOut");

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("Preview", {
        type: "photo",
        uri: "file://mock-photo.jpg"
      });
    });
  });

  it("records a video and navigates to Preview when the button is held", async () => {
    render(<CameraScreen />);

    const captureButton = screen.getByTestId("camera-capture-button");

    await act(async () => {
      fireEvent(captureButton, "pressIn");
      await wait(350);
    });

    fireEvent(captureButton, "pressOut");

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("Preview", {
        type: "video",
        uri: "file://mock-video.mp4"
      });
    });
  });

  it("flips the camera without crashing", () => {
    render(<CameraScreen />);

    fireEvent.press(screen.getByTestId("camera-flip-button"));

    expect(screen.getByTestId("mock-camera-view")).toBeTruthy();
  });

  it("does nothing when the gallery picker is canceled", async () => {
    jest.spyOn(ExpoImagePicker, "launchImageLibraryAsync").mockResolvedValue({
      assets: null,
      canceled: true
    });

    render(<CameraScreen />);

    fireEvent.press(screen.getByTestId("camera-gallery-button"));

    await waitFor(() => {
      expect(ExpoImagePicker.launchImageLibraryAsync).toHaveBeenCalledTimes(1);
    });

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("navigates to Preview when a photo is picked from the gallery", async () => {
    jest.spyOn(ExpoImagePicker, "launchImageLibraryAsync").mockResolvedValue({
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

    render(<CameraScreen />);

    fireEvent.press(screen.getByTestId("camera-gallery-button"));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("Preview", {
        type: "photo",
        uri: "file://gallery-photo.jpg"
      });
    });
  });

  it("rejects a video picked from the gallery that is longer than 60 seconds", async () => {
    const alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => undefined);

    jest.spyOn(ExpoImagePicker, "launchImageLibraryAsync").mockResolvedValue({
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

    render(<CameraScreen />);

    fireEvent.press(screen.getByTestId("camera-gallery-button"));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        "Vídeo muito longo",
        "Escolha um vídeo de até 60 segundos."
      );
    });

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("loads and displays the last gallery asset when access is granted", async () => {
    const grantedPermission = {
      canAskAgain: true,
      expires: "never" as const,
      granted: true,
      status: "granted" as ExpoMediaLibrary.PermissionStatus
    };

    jest
      .spyOn(ExpoMediaLibrary, "usePermissions")
      .mockReturnValue([
        grantedPermission,
        jest.fn().mockResolvedValue(grantedPermission)
      ] as never);
    jest
      .spyOn(ExpoMediaLibrary, "getAssetsAsync")
      .mockResolvedValue({ assets: [{ id: "asset-1" }] } as never);
    jest
      .spyOn(ExpoMediaLibrary, "getAssetInfoAsync")
      .mockResolvedValue({ localUri: "file://gallery-thumbnail.jpg" } as never);

    render(<CameraScreen />);

    await waitFor(() => {
      expect(ExpoMediaLibrary.getAssetInfoAsync).toHaveBeenCalledTimes(1);
    });
  });
});
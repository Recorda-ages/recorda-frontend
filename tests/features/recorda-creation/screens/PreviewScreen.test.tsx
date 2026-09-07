import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import * as ExpoImageManipulator from "expo-image-manipulator";
import * as ExpoVideo from "expo-video";

import { PreviewScreen } from "@/features/recorda-creation/screens/PreviewScreen";

import type * as ExpoImageManipulatorMock from "../../../mocks/expoImageManipulator";
import type * as ExpoVideoMock from "../../../mocks/expoVideo";

const imageManipulatorMock = ExpoImageManipulator as unknown as typeof ExpoImageManipulatorMock;
const videoMock = ExpoVideo as unknown as typeof ExpoVideoMock;

const mockGoBack = jest.fn();
const mockNavigate = jest.fn();
const mockSetMedia = jest.fn();

let mockRouteParams: { type: "photo" | "video"; uri: string } = {
  type: "photo",
  uri: "file://original-photo.jpg"
};

jest.mock("@react-navigation/native", () => {
  const actual = jest.requireActual("@react-navigation/native");

  return {
    ...actual,
    useNavigation: () => ({
      goBack: mockGoBack,
      navigate: mockNavigate
    }),
    useRoute: () => ({
      params: mockRouteParams
    })
  };
});

jest.mock("@/features/recorda-creation/context/RecordaDraftContext", () => ({
  useRecordaDraft: () => ({
    clearMedia: jest.fn(),
    media: null,
    setMedia: mockSetMedia
  })
}));

describe("PreviewScreen", () => {
  beforeEach(() => {
    mockGoBack.mockClear();
    mockNavigate.mockClear();
    mockSetMedia.mockClear();
    mockRouteParams = { type: "photo", uri: "file://original-photo.jpg" };
    imageManipulatorMock.resetImageManipulatorMock();
    videoMock.resetVideoMock();
  });

  it("discards the media and goes back when X is pressed", () => {
    render(<PreviewScreen />);

    fireEvent.press(screen.getByTestId("preview-discard-button"));

    expect(mockGoBack).toHaveBeenCalledTimes(1);
    expect(mockSetMedia).not.toHaveBeenCalled();
  });

  it("does not initialize the video player with the photo URI", () => {
    render(<PreviewScreen />);

    expect(videoMock.mockUseVideoPlayer).toHaveBeenCalledWith(null, expect.any(Function));
  });

  it("compresses a photo and stores it in the draft on confirm", async () => {
    render(<PreviewScreen />);

    await act(async () => {
      fireEvent.press(screen.getByText("Avançar"));
    });

    await waitFor(() => {
      expect(imageManipulatorMock.mockManipulate).toHaveBeenCalledWith("file://original-photo.jpg");
      expect(imageManipulatorMock.mockSaveAsync).toHaveBeenCalledWith({
        compress: 0.6,
        format: "jpeg"
      });
      expect(mockSetMedia).toHaveBeenCalledWith({
        type: "photo",
        uri: "file://compressed.jpg"
      });
    });
    expect(imageManipulatorMock.mockContextRelease).toHaveBeenCalledTimes(1);
    expect(imageManipulatorMock.mockImageRelease).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith("Home");
  });

  it("does not confirm twice while a photo is still being compressed", async () => {
    let resolveSave: ((value: { uri: string }) => void) | undefined;

    imageManipulatorMock.mockSaveAsync.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveSave = resolve;
        })
    );

    render(<PreviewScreen />);

    const confirmButton = screen.getByRole("button", { name: "Avançar" });

    fireEvent.press(confirmButton);
    fireEvent.press(confirmButton);

    await waitFor(() => {
      expect(imageManipulatorMock.mockSaveAsync).toHaveBeenCalledTimes(1);
    });
    expect(imageManipulatorMock.mockManipulate).toHaveBeenCalledTimes(1);
    expect(mockSetMedia).not.toHaveBeenCalled();

    await act(async () => {
      resolveSave?.({ uri: "file://compressed.jpg" });
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(mockSetMedia).toHaveBeenCalledTimes(1);
    });
  });

  it("stores a video in the draft without compressing it", async () => {
    mockRouteParams = { type: "video", uri: "file://original-video.mp4" };

    render(<PreviewScreen />);

    expect(videoMock.mockUseVideoPlayer).toHaveBeenCalledWith(
      "file://original-video.mp4",
      expect.any(Function)
    );

    await act(async () => {
      fireEvent.press(screen.getByText("Avançar"));
    });

    await waitFor(() => {
      expect(mockSetMedia).toHaveBeenCalledWith({
        type: "video",
        uri: "file://original-video.mp4"
      });
    });
    expect(imageManipulatorMock.mockManipulate).not.toHaveBeenCalled();
  });
});

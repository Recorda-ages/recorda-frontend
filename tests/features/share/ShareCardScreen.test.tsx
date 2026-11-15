import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { File, Paths } from "expo-file-system";

import { mockDeleteFile } from "../../mocks/expoFileSystem";
import * as ExpoVideo from "expo-video";
import { Alert, Image as RNImage } from "react-native";

import { AppProviders } from "@/app/providers/AppProviders";
import { ShareCardScreen } from "@/features/share/screens/ShareCardScreen";
import * as CardExport from "@/features/share/services/cardExport";
import { secureStorage } from "@/services/storage";

import type * as ExpoVideoMock from "../../mocks/expoVideo";

const mockGoBack = jest.fn();
const mockNavigate = jest.fn();
const videoMock = ExpoVideo as unknown as typeof ExpoVideoMock;
let mockRouteParams: {
  artistName: string;
  coverUrl: string;
  mediaUri: string;
  mediaType: "photo" | "video";
  songTitle: string;
} = {
  artistName: "Imagine Dragons",
  coverUrl: "https://example.com/cover.jpg",
  mediaUri: "https://example.com/photo.jpg",
  mediaType: "photo",
  songTitle: "Believer"
};

jest.mock("@react-navigation/native", () => {
  const actual = jest.requireActual("@react-navigation/native");

  return {
    ...actual,
    useNavigation: () => ({ goBack: mockGoBack, navigate: mockNavigate }),
    useRoute: () => ({
      params: mockRouteParams
    })
  };
});

jest.mock("@/features/share/services/cardExport", () => ({
  shareCardToInstagramStories: jest.fn(),
  saveCardToGallery: jest.fn()
}));

const mockCrop = jest.fn();
const mockSaveCropped = jest.fn();

jest.mock("expo-image-manipulator", () => ({
  ImageManipulator: {
    manipulate: jest.fn(() => ({
      crop: mockCrop,
      release: jest.fn(),
      renderAsync: jest.fn(async () => ({ saveAsync: mockSaveCropped }))
    }))
  },
  SaveFormat: { JPEG: "jpeg", PNG: "png" }
}));

jest.mock("react-native-view-shot", () => {
  const React = jest.requireActual("react");

  const ViewShot = React.forwardRef(
    (
      { children, style }: { children: React.ReactNode; style?: object },
      ref: React.Ref<unknown>
    ) => {
      React.useImperativeHandle(ref, () => ({
        capture: jest.fn().mockResolvedValue("file://captured.png")
      }));

      return React.createElement("View", { style }, children);
    }
  );

  ViewShot.displayName = "ViewShot";
  return { __esModule: true, default: ViewShot };
});

jest.mock("expo-linear-gradient", () => {
  const React = jest.requireActual("react");
  const { View } = jest.requireActual("react-native");

  return {
    LinearGradient: ({ children, style }: { children?: React.ReactNode; style?: object }) =>
      React.createElement(View, { style }, children)
  };
});

jest.mock("expo-image", () => {
  const React = jest.requireActual("react");
  const { View } = jest.requireActual("react-native");

  return {
    Image: ({ style }: { style?: object }) => React.createElement(View, { style })
  };
});

const mockShareStories = CardExport.shareCardToInstagramStories as jest.Mock;

function renderScreen({ coverLoaded = true } = {}) {
  const view = render(
    <AppProviders>
      <ShareCardScreen />
    </AppProviders>
  );
  // The export waits for the album cover; jest never loads network images by itself.
  if (coverLoaded) {
    fireEvent(screen.getByTestId("export-cover", { includeHiddenElements: true }), "load");
  }
  return view;
}

let mockGetSize: jest.SpyInstance;

describe("ShareCardScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRouteParams = {
      artistName: "Imagine Dragons",
      coverUrl: "https://example.com/cover.jpg",
      mediaUri: "https://example.com/photo.jpg",
      mediaType: "photo",
      songTitle: "Believer"
    };
    mockShareStories.mockResolvedValue("shared");
    videoMock.mockGenerateVideoThumbnails.mockResolvedValue([
      { width: 640, height: 480, requestedTime: 0 }
    ]);
    mockSaveCropped.mockResolvedValue({ uri: "file://cropped.png" });
    mockGetSize = jest.spyOn(RNImage, "getSize").mockImplementation((_, success) => {
      (success as (w: number, h: number) => void)(800, 600);
    });
  });

  it("renders the screen with song info", () => {
    renderScreen();

    expect(screen.getByTestId("share-card-screen")).toBeTruthy();
    // The off-screen export canvas repeats them, but it's hidden from accessibility.
    expect(screen.getByText("Believer")).toBeTruthy();
    expect(screen.getByText("Imagine Dragons")).toBeTruthy();
  });

  it("renders the export buttons", () => {
    renderScreen();

    expect(screen.getByRole("button", { name: "Instagram Stories" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Baixar imagem" })).toBeTruthy();
  });

  it("calls goBack when back button is pressed", () => {
    renderScreen();

    fireEvent.press(screen.getByRole("button", { name: "Voltar" }));

    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });

  it("renders all 4 preset selectors", () => {
    renderScreen();

    expect(screen.getAllByRole("radio")).toHaveLength(4);
    expect(screen.getByTestId("share-card-presets").props.horizontal).toBe(true);
  });

  it("uses the video's first frame for the preview", async () => {
    mockRouteParams.mediaType = "video";
    mockRouteParams.mediaUri = "file://recorda-video.mp4";

    renderScreen();

    await waitFor(() => {
      expect(videoMock.mockReplaceVideoAsync).toHaveBeenCalledWith("file://recorda-video.mp4");
      expect(videoMock.mockGenerateVideoThumbnails).toHaveBeenCalledWith(0);
      expect(videoMock.mockReleaseVideoPlayer).toHaveBeenCalledTimes(1);
    });
    const loadOrder = videoMock.mockReplaceVideoAsync.mock.invocationCallOrder[0];
    const thumbnailOrder = videoMock.mockGenerateVideoThumbnails.mock.invocationCallOrder[0];
    expect(loadOrder).toBeLessThan(thumbnailOrder);
  });

  it("downloads protected videos with the token before reading the first frame", async () => {
    mockRouteParams.mediaType = "video";
    mockRouteParams.mediaUri = "http://localhost:8000/api/v1/recordas/media/clip.mp4";
    jest.spyOn(secureStorage, "getItem").mockResolvedValue("token-123");
    const download = jest
      .spyOn(File, "downloadFileAsync")
      .mockResolvedValue(new File("file:///cache/clip.mp4"));

    renderScreen();

    await waitFor(() => {
      expect(download).toHaveBeenCalledWith(mockRouteParams.mediaUri, Paths.cache, {
        headers: { Authorization: "Bearer token-123" },
        idempotent: true
      });
      expect(videoMock.mockReplaceVideoAsync).toHaveBeenCalledWith("file:///cache/clip.mp4");
      // The frame is in memory; the downloaded copy is deleted.
      expect(mockDeleteFile).toHaveBeenCalledWith("file:///cache/clip.mp4");
    });
  });

  it("deletes the files it created after exporting, never the source media", async () => {
    mockRouteParams.mediaUri = "file://camera-capture.jpg";
    renderScreen();

    await act(async () => {
      fireEvent.press(screen.getByRole("button", { name: "Baixar imagem" }));
    });

    await waitFor(() => {
      expect(mockDeleteFile).toHaveBeenCalledWith("file://cropped.png");
      expect(mockDeleteFile).toHaveBeenCalledWith("file://captured.png");
    });
    expect(mockDeleteFile).not.toHaveBeenCalledWith("file://camera-capture.jpg");
  });

  it("never downloads media from another host with the token", async () => {
    mockRouteParams.mediaType = "video";
    mockRouteParams.mediaUri = "https://cdn.example.com/clip.mp4";
    jest.spyOn(secureStorage, "getItem").mockResolvedValue("token-123");
    const download = jest.spyOn(File, "downloadFileAsync");

    renderScreen();

    await waitFor(() => {
      expect(videoMock.mockReplaceVideoAsync).toHaveBeenCalledWith(
        "https://cdn.example.com/clip.mp4"
      );
    });
    expect(download).not.toHaveBeenCalled();
  });

  it("marks the teal preset as selected by default", () => {
    renderScreen();

    const radios = screen.getAllByRole("radio");
    const checked = radios.filter((r) => r.props.accessibilityState?.checked === true);
    expect(checked).toHaveLength(1);
  });

  it("changes the selected preset when another swatch is pressed", () => {
    renderScreen();

    const radios = screen.getAllByRole("radio");
    fireEvent.press(radios[0]);

    expect(radios[0].props.accessibilityState.checked).toBe(true);
  });

  it("sends the captured card to Instagram Stories", async () => {
    renderScreen();

    await act(async () => {
      fireEvent.press(screen.getByRole("button", { name: "Instagram Stories" }));
    });

    await waitFor(() => {
      expect(mockShareStories).toHaveBeenCalledWith("file://captured.png");
    });
  });

  it("waits for the album cover to load before capturing the card", async () => {
    renderScreen({ coverLoaded: false });

    await act(async () => {
      fireEvent.press(screen.getByRole("button", { name: "Instagram Stories" }));
    });
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 300));
    });
    expect(mockShareStories).not.toHaveBeenCalled();

    fireEvent(screen.getByTestId("export-cover", { includeHiddenElements: true }), "load");
    await waitFor(() => {
      expect(mockShareStories).toHaveBeenCalledWith("file://captured.png");
    });
  });

  it("shows an alert when sharing fails", async () => {
    mockShareStories.mockRejectedValue(new Error("share failed"));
    const alertSpy = jest.spyOn(Alert, "alert");

    renderScreen();

    await act(async () => {
      fireEvent.press(screen.getByRole("button", { name: "Instagram Stories" }));
    });

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalled();
    });
  });

  it("disables the share button while sharing is in progress", async () => {
    mockSaveCropped.mockImplementation(() => new Promise(() => {}));

    renderScreen();

    const shareButton = screen.getByRole("button", { name: "Instagram Stories" });
    expect(shareButton).not.toBeDisabled();

    fireEvent.press(shareButton);

    await waitFor(() => expect(shareButton).toBeDisabled());
  });

  it("uses portrait crop branch when the image is taller than wide", async () => {
    mockGetSize.mockImplementation((_, success) => {
      (success as (w: number, h: number) => void)(300, 600);
    });

    renderScreen();

    await act(async () => {
      fireEvent.press(screen.getByRole("button", { name: "Instagram Stories" }));
    });

    await waitFor(
      () => {
        expect(mockShareStories).toHaveBeenCalledWith("file://captured.png");
      },
      { timeout: 3000 }
    );
    // 300×600 is taller than the 262:380 frame: full width, centered vertically.
    const [crop] = mockCrop.mock.calls.at(-1);
    expect(crop).toEqual({ height: 435, originX: 0, originY: 83, width: 300 });
  });
});

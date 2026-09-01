import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import { PreviewScreen } from "@/features/recorda-creation/screens/PreviewScreen";

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
  });

  it("discards the media and goes back when X is pressed", () => {
    render(<PreviewScreen />);

    fireEvent.press(screen.getByTestId("preview-discard-button"));

    expect(mockGoBack).toHaveBeenCalledTimes(1);
    expect(mockSetMedia).not.toHaveBeenCalled();
  });

  it("compresses a photo and stores it in the draft on confirm", async () => {
    render(<PreviewScreen />);

    fireEvent.press(screen.getByText("Avançar"));

    await waitFor(() => {
      expect(mockSetMedia).toHaveBeenCalledWith({
        type: "photo",
        uri: "file://compressed.jpg"
      });
    });

    expect(mockNavigate).toHaveBeenCalledWith("Home");
  });

  it("stores a video in the draft without compressing it", async () => {
    mockRouteParams = { type: "video", uri: "file://original-video.mp4" };

    render(<PreviewScreen />);

    fireEvent.press(screen.getByText("Avançar"));

    await waitFor(() => {
      expect(mockSetMedia).toHaveBeenCalledWith({
        type: "video",
        uri: "file://original-video.mp4"
      });
    });
  });
});

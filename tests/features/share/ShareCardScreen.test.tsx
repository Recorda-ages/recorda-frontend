import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import * as Sharing from "expo-sharing";
import { Alert, Image as RNImage } from "react-native";

import { AppProviders } from "@/app/providers/AppProviders";
import { ShareCardScreen } from "@/features/share/screens/ShareCardScreen";

const mockGoBack = jest.fn();
const mockNavigate = jest.fn();

jest.mock("@react-navigation/native", () => {
  const actual = jest.requireActual("@react-navigation/native");

  return {
    ...actual,
    useNavigation: () => ({ goBack: mockGoBack, navigate: mockNavigate }),
    useRoute: () => ({
      params: {
        artistName: "Imagine Dragons",
        coverUrl: "https://example.com/cover.jpg",
        mediaUri: "https://example.com/photo.jpg",
        songTitle: "Believer"
      }
    })
  };
});

jest.mock("expo-sharing", () => ({
  shareAsync: jest.fn()
}));

jest.mock("expo-image-manipulator", () => ({
  SaveFormat: { JPEG: "jpeg", PNG: "png" },
  manipulateAsync: jest.fn().mockResolvedValue({ uri: "file://cropped.png" })
}));

jest.mock("react-native-view-shot", () => {
  const React = jest.requireActual("react");

  const ViewShot = React.forwardRef(
    ({ children, style }: { children: React.ReactNode; style?: object }, ref: React.Ref<unknown>) => {
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

const mockShareAsync = Sharing.shareAsync as jest.Mock;

function renderScreen() {
  return render(
    <AppProviders>
      <ShareCardScreen />
    </AppProviders>
  );
}

describe("ShareCardScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockShareAsync.mockResolvedValue(undefined);
    jest.spyOn(RNImage, "getSize").mockImplementation((_, success) => {
      success(800, 600);
    });
  });

  it("renders the screen with song info", () => {
    renderScreen();

    expect(screen.getByTestId("share-card-screen")).toBeTruthy();
    expect(screen.getByText("Believer")).toBeTruthy();
    expect(screen.getByText("Imagine Dragons")).toBeTruthy();
  });

  it("renders the share button", () => {
    renderScreen();

    expect(screen.getByRole("button", { name: "Compartilhar" })).toBeTruthy();
  });

  it("calls goBack when back button is pressed", () => {
    renderScreen();

    fireEvent.press(screen.getByRole("button", { name: "Voltar" }));

    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });

  it("renders all 4 preset selectors", () => {
    renderScreen();

    expect(screen.getAllByRole("radio")).toHaveLength(4);
  });

  it("marks the teal preset as selected by default", () => {
    renderScreen();

    const radios = screen.getAllByRole("radio");
    const checked = radios.filter(
      (r) => r.props.accessibilityState?.checked === true
    );
    expect(checked).toHaveLength(1);
  });

  it("changes the selected preset when another swatch is pressed", () => {
    renderScreen();

    const radios = screen.getAllByRole("radio");
    fireEvent.press(radios[0]);

    expect(radios[0].props.accessibilityState.checked).toBe(true);
  });

  it("calls Sharing.shareAsync after pressing share", async () => {
    renderScreen();

    await act(async () => {
      fireEvent.press(screen.getByRole("button", { name: "Compartilhar" }));
    });

    await waitFor(() => {
      expect(mockShareAsync).toHaveBeenCalledWith(
        "file://captured.png",
        expect.objectContaining({ mimeType: "image/png" })
      );
    });
  });

  it("shows an alert when sharing fails", async () => {
    mockShareAsync.mockRejectedValue(new Error("share failed"));
    const alertSpy = jest.spyOn(Alert, "alert");

    renderScreen();

    await act(async () => {
      fireEvent.press(screen.getByRole("button", { name: "Compartilhar" }));
    });

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalled();
    });
  });

  it("shows a loading indicator while sharing is in progress", async () => {
    const { ActivityIndicator } = jest.requireActual("react-native");
    mockShareAsync.mockImplementation(() => new Promise<void>(() => {}));

    const { UNSAFE_getByType } = renderScreen();

    fireEvent.press(screen.getByRole("button", { name: "Compartilhar" }));

    await waitFor(() => {
      expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
    }, { timeout: 2000 });
  });
});

import { fireEvent, render, screen, within } from "@testing-library/react-native";
import { I18nextProvider } from "react-i18next";

import { FeedScreen } from "@/features/feed";
import { mockFeedPosts } from "@/features/feed/mocks/feedPosts";
import { i18n } from "@/i18n";

const mockNavigate = jest.fn();

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ navigate: mockNavigate })
}));

function renderScreen() {
  return render(
    <I18nextProvider i18n={i18n}>
      <FeedScreen />
    </I18nextProvider>
  );
}

describe("FeedScreen", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it("renders the header, tabs and the mocked posts of the following tab", () => {
    renderScreen();

    expect(screen.getByTestId("feed-screen")).toBeTruthy();
    expect(screen.getByText("recorda.")).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Seguindo" })).toBeSelected();

    const firstPost = within(screen.getByTestId("feed-post-post-1"));
    expect(firstPost.getAllByText("lucas_almeida")).toHaveLength(2);
    expect(firstPost.getByText("The Edge")).toBeTruthy();
    expect(firstPost.getByText("01 de janeiro")).toBeTruthy();
    expect(firstPost.getByText(/Estava d\+!/)).toBeTruthy();
    expect(screen.getByTestId("feed-post-post-2")).toBeTruthy();
    expect(screen.queryByTestId("feed-post-post-3")).toBeNull();
  });

  it("switches the listed posts when the For You tab is selected", () => {
    renderScreen();

    fireEvent.press(screen.getByRole("tab", { name: "Para Você" }));

    expect(screen.getByRole("tab", { name: "Para Você" })).toBeSelected();
    expect(screen.getByTestId("feed-post-post-3")).toBeTruthy();
    expect(screen.queryByTestId("feed-post-post-2")).toBeNull();
  });

  it("toggles the like locally and updates the like count", () => {
    renderScreen();

    const firstPost = within(screen.getByTestId("feed-post-post-1"));
    const likes = mockFeedPosts[0].likesCount;

    expect(firstPost.getByText(`e ${likes} outros`, { exact: false })).toBeTruthy();

    fireEvent.press(firstPost.getByRole("button", { name: "Curtir" }));

    expect(firstPost.getByText(`e ${likes + 1} outros`, { exact: false })).toBeTruthy();
  });

  it("opens the camera and the profile from the tab bar", () => {
    renderScreen();

    fireEvent.press(screen.getByTestId("tab-bar-camera"));
    fireEvent.press(screen.getByTestId("tab-bar-profile"));
    fireEvent.press(screen.getByTestId("tab-bar-feed"));

    expect(mockNavigate).toHaveBeenNthCalledWith(1, "Camera");
    expect(mockNavigate).toHaveBeenNthCalledWith(2, "Profile");
    expect(mockNavigate).toHaveBeenCalledTimes(2);
  });
});

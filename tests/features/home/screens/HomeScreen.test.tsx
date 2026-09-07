import { fireEvent, render, screen } from "@testing-library/react-native";

import { HomeScreen } from "@/features/home/screens/HomeScreen";

const mockNavigate = jest.fn();

jest.mock("@react-navigation/native", () => {
  const actual = jest.requireActual("@react-navigation/native");

  return {
    ...actual,
    useNavigation: () => ({
      navigate: mockNavigate
    })
  };
});

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => (key === "home.primaryAction" ? "Comecar" : key)
  })
}));

describe("HomeScreen", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it("opens the camera flow from the primary action", () => {
    render(<HomeScreen />);

    fireEvent.press(screen.getByRole("button", { name: "Comecar" }));

    expect(mockNavigate).toHaveBeenCalledWith("Camera");
  });
});

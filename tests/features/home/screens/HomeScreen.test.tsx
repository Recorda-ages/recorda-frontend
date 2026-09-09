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
    t: (key: string) => {
      const translations: Record<string, string> = {
        "home.primaryAction": "Comecar",
        "home.recordaDetailsShortcut": "Tela de detalhes da Recorda",
        "home.secondaryAction": "Ver estrutura"
      };

      return translations[key] ?? key;
    }
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

  it("keeps the secondary action inert while the structure flow is not implemented", () => {
    render(<HomeScreen />);

    fireEvent.press(screen.getByRole("button", { name: "Ver estrutura" }));

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("opens the recorda details shortcut in development", () => {
    render(<HomeScreen />);

    fireEvent.press(screen.getByRole("button", { name: "Tela de detalhes da Recorda" }));

    expect(mockNavigate).toHaveBeenCalledWith("RecordaDetails");
  });
});

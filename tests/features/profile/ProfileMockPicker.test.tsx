import { fireEvent, render, screen } from "@testing-library/react-native";

import { env } from "@/app/config";
import { MOCK_PROFILES } from "@/features/profile/mocks/profileMocks";
import { ProfileMockPicker } from "@/features/profile/mocks/ProfileMockPicker.mock";

const mockNavigate = jest.fn();

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ navigate: mockNavigate })
}));

const globals = globalThis as unknown as { __DEV__: boolean };
const realDev = globals.__DEV__;
const realFlag = env.profileMock;

function setMock(dev: boolean, flag: boolean) {
  globals.__DEV__ = dev;
  env.profileMock = flag;
}

beforeEach(() => {
  mockNavigate.mockReset();
});

afterEach(() => {
  globals.__DEV__ = realDev;
  env.profileMock = realFlag;
});

describe("ProfileMockPicker", () => {
  it("shows the dev button when the mock is on in development", () => {
    setMock(true, true);
    render(<ProfileMockPicker />);

    expect(screen.getByRole("button", { name: "Abrir perfis de teste" })).toBeTruthy();
  });

  it("renders nothing when the mock is off", () => {
    setMock(true, false);
    render(<ProfileMockPicker />);

    expect(screen.toJSON()).toBeNull();
  });

  it("renders nothing in production, even with the flag on", () => {
    setMock(false, true);
    render(<ProfileMockPicker />);

    expect(screen.toJSON()).toBeNull();
  });

  it("lists exactly the existing mock profiles, with readable labels", () => {
    setMock(true, true);
    render(<ProfileMockPicker />);

    fireEvent.press(screen.getByTestId("profile-mock-picker-button"));

    expect(screen.getAllByTestId(/^profile-mock-option-/)).toHaveLength(MOCK_PROFILES.length);
    for (const label of [
      "Público — Não seguindo",
      "Privado — Não seguindo",
      "Privado — Solicitado",
      "Privado — Seguindo",
      "Público — Seguindo"
    ]) {
      expect(screen.getByText(label)).toBeTruthy();
    }
  });

  it.each(MOCK_PROFILES.map((profile) => profile.user_id))(
    "opens %s on the existing UserProfile route and closes the list",
    (userId) => {
      setMock(true, true);
      render(<ProfileMockPicker />);

      fireEvent.press(screen.getByTestId("profile-mock-picker-button"));
      fireEvent.press(screen.getByTestId(`profile-mock-option-${userId}`));

      expect(mockNavigate).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith("UserProfile", { userId });
      expect(screen.queryByTestId("profile-mock-picker")).toBeNull();
    }
  );

  it("closes without navigating", () => {
    setMock(true, true);
    render(<ProfileMockPicker />);

    fireEvent.press(screen.getByTestId("profile-mock-picker-button"));
    fireEvent.press(screen.getByRole("button", { name: "Fechar" }));

    expect(screen.queryByTestId("profile-mock-picker")).toBeNull();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});

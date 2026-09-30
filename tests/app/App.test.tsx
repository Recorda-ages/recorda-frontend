import { render, screen } from "@testing-library/react-native";

import App from "../../App";
import { secureStorage } from "@/services/storage/secureStorage";

jest.mock("@/services/storage/secureStorage", () => ({
  secureStorage: {
    getItem: jest.fn().mockResolvedValue(null),
    removeItem: jest.fn(),
    setItem: jest.fn()
  }
}));

const mockGetItem = secureStorage.getItem as jest.Mock;

describe("App", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetItem.mockResolvedValue(null);
  });

  it("renders the splash screen as the initial route once startup assets are ready", async () => {
    render(<App />);

    expect(await screen.findByTestId("splash-screen-container")).toBeTruthy();
  });
});

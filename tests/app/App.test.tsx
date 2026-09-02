import React from "react";
import { render, screen, waitFor } from "@testing-library/react-native";

import App from "../../App";

jest.mock("@/services/storage/secureStorage", () => ({
  secureStorage: {
    getItem: jest.fn().mockResolvedValue(null),
    removeItem: jest.fn(),
    setItem: jest.fn()
  }
}));

describe("App", () => {
  it("renders the splash screen initially", async () => {
    render(<App />);

    expect(screen.getByTestId("splash-screen-container")).toBeTruthy();
    expect(screen.getByText("recorda.")).toBeTruthy();

    await waitFor(() => {
      expect(screen.getByTestId("splash-screen-container")).toBeTruthy();
    });
  });
});

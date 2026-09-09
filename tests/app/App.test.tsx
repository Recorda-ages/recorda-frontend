import { render, screen } from "@testing-library/react-native";

import App from "../../App";

describe("App", () => {
  it("renders the initial screen", () => {
    render(<App />);

    expect(screen.getByTestId("password-recovery-screen")).toBeTruthy();
    expect(screen.getByText("recorda.")).toBeTruthy();
    expect(screen.getByText("Volte a recordar")).toBeTruthy();
  });
});

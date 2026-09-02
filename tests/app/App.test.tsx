import { render, screen } from "@testing-library/react-native";

import App from "../../App";

describe("App", () => {
  it("renders the initial screen", () => {
    render(<App />);

    expect(screen.getByTestId("login-screen")).toBeTruthy();
    expect(screen.getByText("Recorda")).toBeTruthy();
    expect(screen.getByText("Esqueci minha senha")).toBeTruthy();
  });
});

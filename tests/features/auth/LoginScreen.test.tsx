import { fireEvent, render, screen } from "@testing-library/react-native";

import App from "../../../App";

describe("LoginScreen", () => {
  it("opens password recovery from the forgot password action", () => {
    render(<App />);

    fireEvent.press(screen.getByRole("button", { name: "Esqueci minha senha" }));

    expect(screen.getByTestId("password-recovery-screen")).toBeTruthy();
  });
});

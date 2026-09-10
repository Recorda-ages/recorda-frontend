import { fireEvent, render, screen } from "@testing-library/react-native";

import App from "../../App";

describe("App", () => {
  it("renders the initial sign-up screen", () => {
    render(<App />);

    expect(screen.getByTestId("sign-up-screen")).toBeTruthy();
    expect(screen.getByText("recorda.")).toBeTruthy();
    expect(screen.getByText("Guarde o momento")).toBeTruthy();
  });

  it("opens password recovery from the login forgot password link", async () => {
    render(<App />);

    fireEvent.press(screen.getByTestId("login-link"));
    expect(await screen.findByTestId("login-screen")).toBeTruthy();

    fireEvent.press(screen.getByTestId("forgot-password-link"));
    expect(await screen.findByTestId("password-recovery-screen")).toBeTruthy();
  });
});

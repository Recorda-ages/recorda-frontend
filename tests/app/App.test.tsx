import { render, screen } from "@testing-library/react-native";

import App from "../../App";

describe("App", () => {
  it("renders the initial sign-up screen", () => {
    render(<App />);

    expect(screen.getByTestId("sign-up-screen")).toBeTruthy();
    expect(screen.getByText("recorda.")).toBeTruthy();
    expect(screen.getByText("Guarde o momento")).toBeTruthy();
  });
});

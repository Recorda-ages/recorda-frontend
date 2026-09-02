import { render, screen } from "@testing-library/react-native";

import App from "../../App";

describe("App", () => {
  it("renders the initial screen", () => {
    render(<App />);

    expect(screen.getByTestId("home-screen")).toBeTruthy();
    expect(screen.getByText("Recorda")).toBeTruthy();
    expect(screen.getByText("Memorias que tem trilha sonora.")).toBeTruthy();
  });
});

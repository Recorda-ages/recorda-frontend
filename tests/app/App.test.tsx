import { render, screen } from "@testing-library/react-native";

import App from "../../App";

describe("App", () => {
  it("renders the initial screen", () => {
    render(<App />);

    expect(screen.getByText("Quem faz parte da sua história?")).toBeTruthy();
    expect(screen.getByText("Artistas")).toBeTruthy();
  });
});

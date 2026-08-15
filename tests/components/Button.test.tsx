import { fireEvent, render, screen } from "@testing-library/react-native";

import { Button } from "@/components/ui";

describe("Button", () => {
  it("calls onPress when pressed", () => {
    const onPress = jest.fn();

    render(<Button label="Salvar" onPress={onPress} />);

    fireEvent.press(screen.getByRole("button", { name: "Salvar" }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

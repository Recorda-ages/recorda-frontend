import { fireEvent, render, screen } from "@testing-library/react-native";

import { FriendsTabBar } from "@/features/friends/components/FriendsTabBar";
import { FriendsSearchBar } from "@/features/friends/components/FriendsSearchBar";

describe("FriendsTabBar", () => {
  it("renders both Seguidores and Seguindo tabs", () => {
    render(<FriendsTabBar activeTab="seguidores" onChange={jest.fn()} />);
    expect(screen.getByText("Seguidores")).toBeTruthy();
    expect(screen.getByText("Seguindo")).toBeTruthy();
  });

  it("calls onChange with 'seguindo' when Seguindo is pressed", () => {
    const onChange = jest.fn();
    render(<FriendsTabBar activeTab="seguidores" onChange={onChange} />);
    fireEvent.press(screen.getByText("Seguindo"));
    expect(onChange).toHaveBeenCalledWith("seguindo");
  });

  it("calls onChange with 'seguidores' when Seguidores is pressed", () => {
    const onChange = jest.fn();
    render(<FriendsTabBar activeTab="seguindo" onChange={onChange} />);
    fireEvent.press(screen.getByText("Seguidores"));
    expect(onChange).toHaveBeenCalledWith("seguidores");
  });
});

describe("FriendsSearchBar", () => {
  it("renders a text input with placeholder 'Buscar'", () => {
    render(<FriendsSearchBar value="" onChangeText={jest.fn()} />);
    expect(screen.getByPlaceholderText("Buscar")).toBeTruthy();
  });

  it("displays the current value", () => {
    render(<FriendsSearchBar value="jane" onChangeText={jest.fn()} />);
    expect(screen.getByDisplayValue("jane")).toBeTruthy();
  });

  it("calls onChangeText when the user types", () => {
    const onChangeText = jest.fn();
    render(<FriendsSearchBar value="" onChangeText={onChangeText} />);
    fireEvent.changeText(screen.getByPlaceholderText("Buscar"), "ann");
    expect(onChangeText).toHaveBeenCalledWith("ann");
  });
});

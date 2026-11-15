import { fireEvent, render, screen } from "@testing-library/react-native";
import { I18nextProvider } from "react-i18next";

import { FriendsTabBar } from "@/features/friends/components/FriendsTabBar";
import { FriendsSearchBar } from "@/features/friends/components/FriendsSearchBar";
import { i18n } from "@/i18n";

function renderComponent(component: React.ReactElement) {
  return render(<I18nextProvider i18n={i18n}>{component}</I18nextProvider>);
}

describe("FriendsTabBar", () => {
  it("renders both Seguidores and Seguindo tabs", () => {
    renderComponent(<FriendsTabBar activeTab="seguidores" onChange={jest.fn()} />);
    expect(screen.getByText("Seguidores")).toBeTruthy();
    expect(screen.getByText("Seguindo")).toBeTruthy();
  });

  it("calls onChange with 'seguindo' when Seguindo is pressed", () => {
    const onChange = jest.fn();
    renderComponent(<FriendsTabBar activeTab="seguidores" onChange={onChange} />);
    fireEvent.press(screen.getByText("Seguindo"));
    expect(onChange).toHaveBeenCalledWith("seguindo");
  });

  it("calls onChange with 'seguidores' when Seguidores is pressed", () => {
    const onChange = jest.fn();
    renderComponent(<FriendsTabBar activeTab="seguindo" onChange={onChange} />);
    fireEvent.press(screen.getByText("Seguidores"));
    expect(onChange).toHaveBeenCalledWith("seguidores");
  });
});

describe("FriendsSearchBar", () => {
  it("renders a text input with placeholder 'Buscar'", () => {
    renderComponent(<FriendsSearchBar value="" onChangeText={jest.fn()} />);
    expect(screen.getByPlaceholderText("Buscar por usuário")).toBeTruthy();
  });

  it("displays the current value", () => {
    renderComponent(<FriendsSearchBar value="jane" onChangeText={jest.fn()} />);
    expect(screen.getByDisplayValue("jane")).toBeTruthy();
  });

  it("calls onChangeText when the user types", () => {
    const onChangeText = jest.fn();
    renderComponent(<FriendsSearchBar value="" onChangeText={onChangeText} />);
    fireEvent.changeText(screen.getByPlaceholderText("Buscar por usuário"), "ann");
    expect(onChangeText).toHaveBeenCalledWith("ann");
  });
});

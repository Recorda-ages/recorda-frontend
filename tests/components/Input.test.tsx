import { render, screen } from "@testing-library/react-native";
import { Text } from "react-native";

import { Input } from "@/components/ui/Input";

describe("Input", () => {
  it("renders with placeholder and label", () => {
    render(<Input label="Nome" placeholder="Digite seu nome" />);

    expect(screen.getByText("Nome")).toBeTruthy();
    expect(screen.getByPlaceholderText("Digite seu nome")).toBeTruthy();
  });

  it("renders error message when error prop is provided", () => {
    render(<Input error="Campo obrigatorio" placeholder="Email" />);

    expect(screen.getByText("Campo obrigatorio")).toBeTruthy();
  });

  it("renders right accessory when provided", () => {
    render(
      <Input placeholder="Senha" rightAccessory={<Text testID="test-accessory">Icon</Text>} />
    );

    expect(screen.getByTestId("test-accessory")).toBeTruthy();
  });

  it("renders in dark variant without crashing", () => {
    render(
      <Input label="Usuario" placeholder="username" variant="dark" error="Usuario invalido" />
    );

    expect(screen.getByText("Usuario")).toBeTruthy();
    expect(screen.getByPlaceholderText("username")).toBeTruthy();
    expect(screen.getByText("Usuario invalido")).toBeTruthy();
  });
});

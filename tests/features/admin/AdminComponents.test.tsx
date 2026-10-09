import { fireEvent, render, screen } from "@testing-library/react-native";
import { I18nextProvider } from "react-i18next";
import { StyleSheet } from "react-native";

import { AdminListRow } from "@/features/admin/components/AdminListRow";
import { FilterChips } from "@/features/admin/components/FilterChips";
import { StatusBadge } from "@/features/admin/components/StatusBadge";
import { i18n } from "@/i18n";

function renderWithI18n(node: React.ReactElement) {
  return render(<I18nextProvider i18n={i18n}>{node}</I18nextProvider>);
}

describe("StatusBadge", () => {
  it.each([
    ["OPEN", "Pendente"],
    ["RESOLVED", "Resolvida"],
    ["DISMISSED", "Descartada"],
    ["ACTIVE", "Ativo"],
    ["SUSPENDED", "Suspenso"]
  ] as const)("localizes %s", (status, label) => {
    renderWithI18n(<StatusBadge status={status} />);

    expect(screen.getByText(label)).toBeTruthy();
    expect(screen.getByLabelText(`Status: ${label}`)).toBeTruthy();
  });
});

describe("FilterChips", () => {
  const options = [
    { label: "Todos", value: "ALL" },
    { label: "Pendentes", value: "OPEN" }
  ] as const;

  it("exposes selection and sends the selected value", () => {
    const onChange = jest.fn();
    render(<FilterChips onChange={onChange} options={options} value="ALL" />);

    expect(screen.getByRole("radio", { name: "Todos" }).props.accessibilityState).toMatchObject({
      checked: true
    });

    fireEvent.press(screen.getByRole("radio", { name: "Pendentes" }));
    expect(onChange).toHaveBeenCalledWith("OPEN");
  });

  it("does not change while disabled", () => {
    const onChange = jest.fn();
    render(<FilterChips disabled onChange={onChange} options={options} value="ALL" />);

    fireEvent.press(screen.getByRole("radio", { name: "Pendentes" }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("distributes options in two columns when requested", () => {
    render(<FilterChips columns={2} onChange={jest.fn()} options={options} value="ALL" />);

    expect(
      StyleSheet.flatten(screen.getByRole("radio", { name: "Todos" }).props.style)
    ).toMatchObject({ flexBasis: "45%", flexGrow: 1 });
  });

  it("distributes options in three columns when requested", () => {
    render(<FilterChips columns={3} onChange={jest.fn()} options={options} value="ALL" />);

    expect(
      StyleSheet.flatten(screen.getByRole("radio", { name: "Todos" }).props.style)
    ).toMatchObject({ flexBasis: "28%", flexGrow: 1 });
  });
});

describe("AdminListRow", () => {
  it("renders its public content and handles activation", () => {
    const onPress = jest.fn();
    render(
      <AdminListRow
        accessibilityLabel="Abrir denúncia de @marina"
        metadata="3 denúncias"
        onPress={onPress}
        status="OPEN"
        subtitle="@marina"
        title="Recorda denunciada"
      />
    );

    expect(screen.getByText("Recorda denunciada")).toBeTruthy();
    expect(screen.getByText("@marina")).toBeTruthy();
    expect(screen.getByText("3 denúncias")).toBeTruthy();
    expect(screen.getByText("Pendente")).toBeTruthy();

    fireEvent.press(screen.getByRole("button", { name: "Abrir denúncia de @marina" }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

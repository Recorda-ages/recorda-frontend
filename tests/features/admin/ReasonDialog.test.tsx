import { fireEvent, render, screen } from "@testing-library/react-native";
import { useState } from "react";
import { I18nextProvider } from "react-i18next";
import { PaperProvider } from "react-native-paper";

import { ReasonDialog } from "@/features/admin/components/ReasonDialog";
import { i18n } from "@/i18n";
import { paperTheme } from "@/theme";

const TITLE = "Suspender usuário";
const CONFIRM = "Suspender";
const REASON = "Violação recorrente das regras";

type HarnessProps = {
  error?: string;
  loading?: boolean;
  onCancel?: () => void;
  onConfirm?: (reason: string) => void;
};

function Harness({ error, loading, onCancel = jest.fn(), onConfirm = jest.fn() }: HarnessProps) {
  const [reason, setReason] = useState("");

  return (
    <ReasonDialog
      confirmLabel={CONFIRM}
      error={error}
      loading={loading}
      onCancel={onCancel}
      onChangeReason={setReason}
      onConfirm={() => onConfirm(reason)}
      reason={reason}
      title={TITLE}
      visible
    />
  );
}

function renderDialog(props: HarnessProps = {}) {
  return render(
    <I18nextProvider i18n={i18n}>
      <PaperProvider theme={paperTheme}>
        <Harness {...props} />
      </PaperProvider>
    </I18nextProvider>
  );
}

function reasonInput() {
  return screen.getByLabelText("Motivo");
}

describe("ReasonDialog", () => {
  it("disables confirmation while the normalized reason is empty", () => {
    renderDialog();

    const confirm = screen.getByRole("button", { name: CONFIRM });
    expect(confirm.props.accessibilityState).toMatchObject({ disabled: true });

    fireEvent.changeText(reasonInput(), "   \n  ");
    expect(confirm.props.accessibilityState).toMatchObject({ disabled: true });

    fireEvent.changeText(reasonInput(), REASON);
    expect(confirm.props.accessibilityState).toMatchObject({ disabled: false });
  });

  it("exposes the 500 character native limit and keeps the counter in sync", () => {
    renderDialog();

    expect(reasonInput().props.maxLength).toBe(500);
    expect(screen.getByText("0/500")).toBeTruthy();

    fireEvent.changeText(reasonInput(), "abc");
    expect(screen.getByText("3/500")).toBeTruthy();
  });

  it("submits the current reason", () => {
    const onConfirm = jest.fn();
    renderDialog({ onConfirm });

    fireEvent.changeText(reasonInput(), REASON);
    fireEvent.press(screen.getByRole("button", { name: CONFIRM }));

    expect(onConfirm).toHaveBeenCalledWith(REASON);
  });

  it("keeps the typed reason visible when an operation error is shown", () => {
    const view = renderDialog();
    fireEvent.changeText(reasonInput(), REASON);

    view.rerender(
      <I18nextProvider i18n={i18n}>
        <PaperProvider theme={paperTheme}>
          <Harness error="Não foi possível concluir a ação." />
        </PaperProvider>
      </I18nextProvider>
    );

    expect(reasonInput().props.value).toBe(REASON);
    expect(screen.getByText("Não foi possível concluir a ação.")).toBeTruthy();
  });

  it("locks both actions and the field while loading", () => {
    const onCancel = jest.fn();
    renderDialog({ loading: true, onCancel });

    const cancel = screen.getByRole("button", { name: "Cancelar" });
    const confirm = screen.getByRole("button", { name: CONFIRM });

    expect(reasonInput().props.editable).toBe(false);
    expect(cancel.props.accessibilityState).toMatchObject({ disabled: true });
    expect(confirm.props.accessibilityState).toMatchObject({ busy: true, disabled: true });

    fireEvent.press(cancel);
    expect(onCancel).not.toHaveBeenCalled();
  });
});

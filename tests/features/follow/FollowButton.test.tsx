import { fireEvent, render, screen } from "@testing-library/react-native";
import { I18nextProvider } from "react-i18next";
import { Alert, type AlertButton } from "react-native";

import { FollowButton } from "@/features/follow";
import { useFollowMutation } from "@/features/follow/hooks/useFollowMutation";
import type { FollowStatus } from "@/features/follow/types";
import { i18n } from "@/i18n";

jest.mock("@/features/follow/hooks/useFollowMutation", () => ({
  useFollowMutation: jest.fn()
}));

const mockedUseFollowMutation = jest.mocked(useFollowMutation);
const mockMutate = jest.fn();
const alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => undefined);

function renderButton(status: FollowStatus, isPending = false) {
  return render(
    <I18nextProvider i18n={i18n}>
      <FollowButton status={status} userId="user-1" username="jane_doe" />
    </I18nextProvider>
  );
}

function alertButtons(): AlertButton[] {
  return (alertSpy.mock.calls[0]?.[2] ?? []) as AlertButton[];
}

beforeEach(() => {
  mockMutate.mockReset();
  alertSpy.mockClear();
  mockedUseFollowMutation.mockReset();
  mockedUseFollowMutation.mockReturnValue({
    isPending: false,
    mutate: mockMutate
  } as unknown as ReturnType<typeof useFollowMutation>);
});

describe("FollowButton", () => {
  // US20: "Refletir corretamente os três estados."
  it.each([
    ["nenhuma", "Seguir", "Seguir jane_doe"],
    ["solicitado", "Solicitado", "Cancelar solicitação para seguir jane_doe"],
    ["seguindo", "Seguindo", "Deixar de seguir jane_doe"]
  ])("renders the %s state", (status, label, accessibilityLabel) => {
    renderButton(status as FollowStatus);

    expect(screen.getByText(label)).toBeTruthy();
    expect(screen.getByLabelText(accessibilityLabel)).toBeTruthy();
  });

  it("follows the user when there is no relationship yet", () => {
    renderButton("nenhuma");

    fireEvent.press(screen.getByTestId("follow-button-user-1"));

    expect(mockMutate).toHaveBeenCalledWith({ action: "follow", userId: "user-1" });
    expect(alertSpy).not.toHaveBeenCalled();
  });

  // US20: "Solicitado pode ser cancelado" — cancelar não pede confirmação.
  it("cancels a pending request without asking for confirmation", () => {
    renderButton("solicitado");

    fireEvent.press(screen.getByTestId("follow-button-user-1"));

    expect(mockMutate).toHaveBeenCalledWith({ action: "unfollow", userId: "user-1" });
    expect(alertSpy).not.toHaveBeenCalled();
  });

  // US20: "Seguindo permite deixar de seguir com confirmação."
  it("asks for confirmation before unfollowing and unfollows when confirmed", () => {
    renderButton("seguindo");

    fireEvent.press(screen.getByTestId("follow-button-user-1"));

    expect(mockMutate).not.toHaveBeenCalled();
    expect(alertSpy).toHaveBeenCalledWith(
      "Deixar de seguir",
      "Tem certeza que deseja deixar de seguir jane_doe?",
      expect.any(Array)
    );

    const confirm = alertButtons().find((button) => button.style === "destructive");
    confirm?.onPress?.();

    expect(mockMutate).toHaveBeenCalledWith({ action: "unfollow", userId: "user-1" });
  });

  it("does nothing when the unfollow confirmation is dismissed", () => {
    renderButton("seguindo");

    fireEvent.press(screen.getByTestId("follow-button-user-1"));
    const cancel = alertButtons().find((button) => button.style === "cancel");
    cancel?.onPress?.();

    expect(cancel).toBeTruthy();
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it("is disabled while the mutation is in flight", () => {
    mockedUseFollowMutation.mockReturnValue({
      isPending: true,
      mutate: mockMutate
    } as unknown as ReturnType<typeof useFollowMutation>);
    renderButton("nenhuma");

    const button = screen.getByTestId("follow-button-user-1");
    expect(button).toBeDisabled();

    fireEvent.press(button);
    expect(mockMutate).not.toHaveBeenCalled();
  });
});

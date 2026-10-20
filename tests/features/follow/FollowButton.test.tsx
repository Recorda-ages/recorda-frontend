import { act, fireEvent, render, screen, within } from "@testing-library/react-native";
import { I18nextProvider } from "react-i18next";

import { FollowButton } from "@/features/follow";
import { useFollowMutation } from "@/features/follow/hooks/useFollowMutation";
import type { FollowStatus } from "@/features/follow/types";
import { i18n } from "@/i18n";

jest.mock("@/features/follow/hooks/useFollowMutation", () => ({
  useFollowMutation: jest.fn()
}));

const mockedUseFollowMutation = jest.mocked(useFollowMutation);
const mockMutate = jest.fn();

function mockMutation(isPending: boolean) {
  mockedUseFollowMutation.mockReturnValue({
    isPending,
    mutate: mockMutate
  } as unknown as ReturnType<typeof useFollowMutation>);
}

function renderButton(status: FollowStatus, isPending = false, size?: "compact" | "block") {
  return render(
    <I18nextProvider i18n={i18n}>
      <FollowButton size={size} status={status} userId="user-1" username="jane_doe" />
    </I18nextProvider>
  );
}

function dialog() {
  return within(screen.getByTestId("unfollow-dialog"));
}

/** Runs the `onSettled` the button passed along with its last unfollow. */
function settleLastUnfollow() {
  const options = mockMutate.mock.lastCall?.[1] as { onSettled?: () => void } | undefined;
  act(() => options?.onSettled?.());
}

beforeEach(() => {
  mockMutate.mockReset();
  mockedUseFollowMutation.mockReset();
  mockMutation(false);
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
    expect(screen.queryByTestId("unfollow-dialog")).toBeNull();
  });

  // US20: "Solicitado pode ser cancelado" — cancelar não pede confirmação.
  it("cancels a pending request without asking for confirmation", () => {
    renderButton("solicitado");

    fireEvent.press(screen.getByTestId("follow-button-user-1"));

    expect(mockMutate).toHaveBeenCalledWith({ action: "unfollow", userId: "user-1" });
    expect(screen.queryByTestId("unfollow-dialog")).toBeNull();
  });

  describe("unfollow confirmation", () => {
    // US20: "Seguindo permite deixar de seguir com confirmação."
    it("opens the dialog without unfollowing yet", () => {
      renderButton("seguindo");

      fireEvent.press(screen.getByTestId("follow-button-user-1"));

      expect(mockMutate).not.toHaveBeenCalled();
      expect(dialog().getByRole("header", { name: "Deixar de seguir?" })).toBeTruthy();
      expect(dialog().getByText("Tem certeza que deseja deixar de seguir jane_doe?")).toBeTruthy();
      expect(dialog().getByRole("button", { name: "Cancelar" })).toBeTruthy();
      expect(dialog().getByRole("button", { name: "Deixar de seguir" })).toBeTruthy();
    });

    it("shows a long username in full, wrapping instead of truncating", () => {
      const username = "um.username.bem.comprido.para.testar.quebra";
      render(
        <I18nextProvider i18n={i18n}>
          <FollowButton status="seguindo" userId="user-1" username={username} />
        </I18nextProvider>
      );

      fireEvent.press(screen.getByTestId("follow-button-user-1"));

      const message = dialog().getByText(`Tem certeza que deseja deixar de seguir ${username}?`);
      expect(message.props.numberOfLines).toBeUndefined();
    });

    it("closes on Cancelar without unfollowing", () => {
      renderButton("seguindo");

      fireEvent.press(screen.getByTestId("follow-button-user-1"));
      fireEvent.press(dialog().getByRole("button", { name: "Cancelar" }));

      expect(screen.queryByTestId("unfollow-dialog")).toBeNull();
      expect(mockMutate).not.toHaveBeenCalled();
    });

    it("unfollows only after confirming and closes once the request settles", () => {
      renderButton("seguindo");

      fireEvent.press(screen.getByTestId("follow-button-user-1"));
      fireEvent.press(dialog().getByRole("button", { name: "Deixar de seguir" }));

      expect(mockMutate).toHaveBeenCalledTimes(1);
      expect(mockMutate).toHaveBeenCalledWith(
        { action: "unfollow", userId: "user-1" },
        expect.objectContaining({ onSettled: expect.any(Function) })
      );
      // Still open while the request is in flight.
      expect(screen.getByTestId("unfollow-dialog")).toBeTruthy();

      settleLastUnfollow();

      expect(screen.queryByTestId("unfollow-dialog")).toBeNull();
    });

    it("can't confirm twice while the unfollow is in flight", () => {
      const { rerender } = renderButton("seguindo");
      fireEvent.press(screen.getByTestId("follow-button-user-1"));
      fireEvent.press(dialog().getByRole("button", { name: "Deixar de seguir" }));

      mockMutation(true);
      rerender(
        <I18nextProvider i18n={i18n}>
          <FollowButton status="seguindo" userId="user-1" username="jane_doe" />
        </I18nextProvider>
      );
      const confirm = dialog().getByRole("button", { name: "Deixar de seguir" });
      expect(confirm).toBeDisabled();
      fireEvent.press(confirm);

      expect(mockMutate).toHaveBeenCalledTimes(1);
    });
  });

  it("is disabled while the mutation is in flight", () => {
    mockMutation(true);
    renderButton("nenhuma");

    const button = screen.getByTestId("follow-button-user-1");
    expect(button).toBeDisabled();

    fireEvent.press(button);
    expect(mockMutate).not.toHaveBeenCalled();
  });

  describe("sizes", () => {
    it("keeps the compact look by default, with the plus icon", () => {
      renderButton("nenhuma");

      const button = screen.getByTestId("follow-button-user-1");
      expect(button).toHaveStyle({ minWidth: 96 });
      expect(button).not.toHaveStyle({ alignSelf: "stretch" });
      expect(
        screen.getByTestId("follow-button-plus-user-1", { includeHiddenElements: true })
      ).toBeTruthy();
    });

    it("fills the width without the plus icon in the block size", () => {
      renderButton("nenhuma", false, "block");

      expect(screen.getByTestId("follow-button-user-1")).toHaveStyle({ alignSelf: "stretch" });
      expect(
        screen.queryByTestId("follow-button-plus-user-1", { includeHiddenElements: true })
      ).toBeNull();
    });

    it.each([
      ["nenhuma", "Seguir", "Seguir jane_doe"],
      ["solicitado", "Solicitado", "Cancelar solicitação para seguir jane_doe"],
      ["seguindo", "Seguindo", "Deixar de seguir jane_doe"]
    ])("renders the %s state in the block size", (status, label, accessibilityLabel) => {
      renderButton(status as FollowStatus, false, "block");

      expect(screen.getByText(label)).toBeTruthy();
      expect(screen.getByLabelText(accessibilityLabel)).toBeTruthy();
    });

    it.each(["compact", "block"] as const)(
      "follows, cancels a request and confirms the unfollow in the %s size",
      (size) => {
        const { rerender } = renderButton("nenhuma", false, size);
        fireEvent.press(screen.getByTestId("follow-button-user-1"));
        expect(mockMutate).toHaveBeenLastCalledWith({ action: "follow", userId: "user-1" });

        rerender(
          <I18nextProvider i18n={i18n}>
            <FollowButton size={size} status="solicitado" userId="user-1" username="jane_doe" />
          </I18nextProvider>
        );
        fireEvent.press(screen.getByTestId("follow-button-user-1"));
        expect(mockMutate).toHaveBeenLastCalledWith({ action: "unfollow", userId: "user-1" });
        expect(screen.queryByTestId("unfollow-dialog")).toBeNull();

        rerender(
          <I18nextProvider i18n={i18n}>
            <FollowButton size={size} status="seguindo" userId="user-1" username="jane_doe" />
          </I18nextProvider>
        );
        fireEvent.press(screen.getByTestId("follow-button-user-1"));
        expect(mockMutate).toHaveBeenCalledTimes(2);
        fireEvent.press(dialog().getByRole("button", { name: "Deixar de seguir" }));
        expect(mockMutate).toHaveBeenLastCalledWith(
          { action: "unfollow", userId: "user-1" },
          expect.objectContaining({ onSettled: expect.any(Function) })
        );
      }
    );
  });
});

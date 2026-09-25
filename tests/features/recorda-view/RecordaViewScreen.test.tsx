import { fireEvent, render, screen } from "@testing-library/react-native";
import { I18nextProvider } from "react-i18next";

import { RecordaViewScreen } from "@/features/recorda-view";
import { i18n } from "@/i18n";

const mockGoBack = jest.fn();
const mockNavigate = jest.fn();

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ goBack: mockGoBack, navigate: mockNavigate })
}));

function renderScreen(currentUserId?: string) {
  return render(
    <I18nextProvider i18n={i18n}>
      <RecordaViewScreen currentUserId={currentUserId} />
    </I18nextProvider>
  );
}

describe("RecordaViewScreen", () => {
  beforeEach(() => {
    mockGoBack.mockClear();
    mockNavigate.mockClear();
  });

  it("renders the Recorda and its mocked comments", () => {
    renderScreen();

    expect(screen.getByTestId("recorda-view-screen")).toBeTruthy();
    expect(screen.getByText("Take me to the beach")).toBeTruthy();
    expect(screen.getByTestId("recorda-comment-comment-1")).toBeTruthy();
    expect(screen.getByTestId("recorda-comment-comment-2")).toBeTruthy();
  });

  it("allows the Recorda author to delete every comment", () => {
    renderScreen("john-doe");

    expect(screen.getByTestId("delete-comment-comment-1")).toBeTruthy();
    expect(screen.getByTestId("delete-comment-comment-2")).toBeTruthy();
  });

  it("only allows a comment author to delete their own comment", () => {
    renderScreen("jane-smith");

    expect(screen.queryByTestId("delete-comment-comment-1")).toBeNull();
    expect(screen.getByTestId("delete-comment-comment-2")).toBeTruthy();
  });

  it("does not show deletion actions to a third party", () => {
    renderScreen("third-party");

    expect(screen.queryByTestId("delete-comment-comment-1")).toBeNull();
    expect(screen.queryByTestId("delete-comment-comment-2")).toBeNull();
  });

  it("opens the confirmation dialog and preserves a comment when cancelled", () => {
    renderScreen();

    fireEvent.press(screen.getByTestId("delete-comment-comment-1"));

    expect(screen.getByText("Excluir Comentário?")).toBeTruthy();
    fireEvent.press(screen.getByRole("button", { name: "Cancelar" }));

    expect(screen.queryByText("Excluir Comentário?")).toBeNull();
    expect(screen.getByTestId("recorda-comment-comment-1")).toBeTruthy();
  });

  it("removes only the selected comment after confirmation", () => {
    renderScreen();

    fireEvent.press(screen.getByTestId("delete-comment-comment-1"));
    fireEvent.press(screen.getByRole("button", { name: "Excluir" }));

    expect(screen.queryByTestId("recorda-comment-comment-1")).toBeNull();
    expect(screen.getByTestId("recorda-comment-comment-2")).toBeTruthy();
  });

  it("returns to the previous screen from the header", () => {
    renderScreen();

    fireEvent.press(screen.getByRole("button", { name: "Voltar" }));

    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });
});

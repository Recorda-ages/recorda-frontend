import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { I18nextProvider } from "react-i18next";

import { useFollowMutation } from "@/features/follow/hooks/useFollowMutation";
import { UserSearchScreen } from "@/features/user-search";
import { useUserSearch } from "@/features/user-search/hooks/useUserSearch";
import type { UserSearchResultItem } from "@/features/user-search/types";
import { i18n } from "@/i18n";

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ goBack: mockGoBack, navigate: mockNavigate })
}));

jest.mock("@/features/user-search/hooks/useUserSearch", () => ({
  useUserSearch: jest.fn()
}));

jest.mock("@/features/follow/hooks/useFollowMutation", () => ({
  useFollowMutation: jest.fn()
}));

const mockedUseUserSearch = jest.mocked(useUserSearch);
const mockRefetch = jest.fn();

const RESULTS: UserSearchResultItem[] = [
  { avatar_url: null, follow_status: "seguindo", user_id: "user-1", username: "jane_doe" },
  { avatar_url: null, follow_status: "nenhuma", user_id: "user-2", username: "anne_wilson" }
];

function searchResult(overrides: Record<string, unknown> = {}) {
  return {
    data: undefined,
    isError: false,
    isFetching: false,
    isSuccess: false,
    refetch: mockRefetch,
    ...overrides
  } as unknown as ReturnType<typeof useUserSearch>;
}

function renderScreen() {
  return render(
    <I18nextProvider i18n={i18n}>
      <UserSearchScreen />
    </I18nextProvider>
  );
}

/** Digita e deixa o debounce de 350ms vencer. */
function typeAndSettle(text: string) {
  fireEvent.changeText(screen.getByTestId("user-search-input"), text);
  act(() => {
    jest.advanceTimersByTime(350);
  });
}

beforeEach(() => {
  jest.useFakeTimers();
  mockNavigate.mockClear();
  mockGoBack.mockClear();
  mockRefetch.mockReset();
  mockedUseUserSearch.mockReset();
  mockedUseUserSearch.mockReturnValue(searchResult({ isSuccess: true, data: [] }));
  jest.mocked(useFollowMutation).mockReturnValue({
    isPending: false,
    mutate: jest.fn()
  } as unknown as ReturnType<typeof useFollowMutation>);
});

afterEach(() => {
  jest.useRealTimers();
});

describe("UserSearchScreen", () => {
  // #175: "Sem texto de busca, mostrar sugestões da US27."
  // O que existe hoje é o slot: sem termo, nada é buscado e a dica aparece.
  // A lista de sugestões entra aqui pela #198.
  it("does not search and shows the hint while the field is empty", () => {
    renderScreen();

    expect(screen.getByTestId("user-search-screen")).toBeTruthy();
    expect(screen.getByTestId("user-search-hint")).toBeTruthy();
    expect(mockedUseUserSearch).toHaveBeenCalledWith("");
    expect(screen.queryByTestId(/user-search-result-/)).toBeNull();
  });

  // #175: "Pesquisar conforme o usuário digita."
  it("waits for the debounce before searching for the typed term", () => {
    renderScreen();

    fireEvent.changeText(screen.getByTestId("user-search-input"), "jan");
    expect(mockedUseUserSearch).not.toHaveBeenCalledWith("jan");

    act(() => {
      jest.advanceTimersByTime(350);
    });

    expect(mockedUseUserSearch).toHaveBeenLastCalledWith("jan");
  });

  it("discards terms that are replaced before the debounce elapses", () => {
    renderScreen();

    fireEvent.changeText(screen.getByTestId("user-search-input"), "j");
    act(() => {
      jest.advanceTimersByTime(200);
    });
    fireEvent.changeText(screen.getByTestId("user-search-input"), "ja");
    act(() => {
      jest.advanceTimersByTime(350);
    });

    expect(mockedUseUserSearch).not.toHaveBeenCalledWith("j");
    expect(mockedUseUserSearch).toHaveBeenLastCalledWith("ja");
  });

  it("searches with the trimmed term", () => {
    renderScreen();

    typeAndSettle("  jane  ");

    expect(mockedUseUserSearch).toHaveBeenLastCalledWith("jane");
  });

  // #175: "Mostrar avatar, username e estado da relação."
  it("renders each result with its username and relationship state", () => {
    mockedUseUserSearch.mockReturnValue(searchResult({ isSuccess: true, data: RESULTS }));
    renderScreen();

    typeAndSettle("ja");

    expect(screen.getByTestId("user-search-result-user-1")).toBeTruthy();
    expect(screen.getByText("jane_doe")).toBeTruthy();
    expect(screen.getByText("Seguindo")).toBeTruthy();
    expect(screen.getByText("anne_wilson")).toBeTruthy();
    expect(screen.getByText("Seguir")).toBeTruthy();
  });

  it("shows a spinner while the search is in flight", () => {
    mockedUseUserSearch.mockReturnValue(searchResult({ isFetching: true }));
    renderScreen();

    typeAndSettle("jane");

    expect(screen.getByLabelText("Buscando usuários")).toBeTruthy();
  });

  it("shows the empty state when the search returns no one", () => {
    mockedUseUserSearch.mockReturnValue(searchResult({ isSuccess: true, data: [] }));
    renderScreen();

    typeAndSettle("zzz");

    expect(screen.getByTestId("user-search-empty")).toBeTruthy();
    expect(screen.queryByTestId("user-search-hint")).toBeNull();
  });

  it("shows an error state and retries when the search fails", () => {
    mockedUseUserSearch.mockReturnValue(searchResult({ isError: true }));
    renderScreen();

    typeAndSettle("jane");

    expect(screen.getByText("Não foi possível buscar usuários.")).toBeTruthy();
    fireEvent.press(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });

  // #175: "Preparar navegação para o perfil de terceiros."
  it("opens the profile of the tapped user", () => {
    mockedUseUserSearch.mockReturnValue(searchResult({ isSuccess: true, data: RESULTS }));
    renderScreen();

    typeAndSettle("ja");
    fireEvent.press(screen.getByTestId("user-search-result-user-2"));

    expect(mockNavigate).toHaveBeenCalledWith("UserProfile", { userId: "user-2" });
  });

  it("goes back from the header", () => {
    renderScreen();

    fireEvent.press(screen.getByTestId("user-search-back-button"));

    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });
});

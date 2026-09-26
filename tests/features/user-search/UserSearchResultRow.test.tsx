import { fireEvent, render, screen } from "@testing-library/react-native";
import { I18nextProvider } from "react-i18next";

import { useFollowMutation } from "@/features/follow/hooks/useFollowMutation";
import { UserSearchResultRow } from "@/features/user-search/components/UserSearchResultRow";
import type { UserSearchResultItem } from "@/features/user-search/types";
import { i18n } from "@/i18n";

jest.mock("@/features/follow/hooks/useFollowMutation", () => ({
  useFollowMutation: jest.fn()
}));

const mockedUseFollowMutation = jest.mocked(useFollowMutation);
const mockMutate = jest.fn();
const mockOnPress = jest.fn();

const BASE_ITEM: UserSearchResultItem = {
  avatar_url: "/api/v1/users/jane.jpg",
  follow_status: "nenhuma",
  user_id: "user-1",
  username: "jane_doe"
};

function renderRow(item: Partial<UserSearchResultItem> = {}) {
  return render(
    <I18nextProvider i18n={i18n}>
      <UserSearchResultRow item={{ ...BASE_ITEM, ...item }} onPress={mockOnPress} />
    </I18nextProvider>
  );
}

beforeEach(() => {
  mockMutate.mockReset();
  mockOnPress.mockReset();
  mockedUseFollowMutation.mockReset();
  mockedUseFollowMutation.mockReturnValue({
    isPending: false,
    mutate: mockMutate
  } as unknown as ReturnType<typeof useFollowMutation>);
});

describe("UserSearchResultRow", () => {
  // #175: "Mostrar avatar, username e estado da relação."
  it("renders the username and resolves the avatar against the API base url", () => {
    renderRow();

    expect(screen.getByText("jane_doe")).toBeTruthy();
    expect(screen.getByTestId("user-avatar-user-1")).toHaveProp("source", [
      { uri: "http://localhost:8000/api/v1/users/jane.jpg" }
    ]);
  });

  it("falls back to a placeholder avatar when the user has no picture", () => {
    renderRow({ avatar_url: null });

    expect(screen.getByTestId("user-avatar-fallback-user-1")).toBeTruthy();
    expect(screen.queryByTestId("user-avatar-user-1")).toBeNull();
  });

  it.each([
    ["nenhuma", "Seguir"],
    ["solicitado", "Solicitado"],
    ["seguindo", "Seguindo"]
  ])("shows the %s relationship state", (status, label) => {
    renderRow({ follow_status: status as UserSearchResultItem["follow_status"] });

    expect(screen.getByText(label)).toBeTruthy();
  });

  // #175: "Preparar navegação para o perfil de terceiros."
  it("hands the tapped user id to the caller", () => {
    renderRow({ user_id: "user-42", username: "jake_gilbert" });

    fireEvent.press(screen.getByTestId("user-search-result-user-42"));

    expect(mockOnPress).toHaveBeenCalledWith("user-42");
  });

  // #175: "Incorporar o componente de Follow da US20."
  it("embeds the follow button without triggering the row navigation", () => {
    renderRow();

    fireEvent.press(screen.getByTestId("follow-button-user-1"));

    expect(mockMutate).toHaveBeenCalledWith({ action: "follow", userId: "user-1" });
    expect(mockOnPress).not.toHaveBeenCalled();
  });
});

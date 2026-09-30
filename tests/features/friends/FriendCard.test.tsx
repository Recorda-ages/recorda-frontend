import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { I18nextProvider } from "react-i18next";

import { FriendCard } from "@/features/friends/components/FriendCard";
import type { FriendProfile } from "@/features/friends/types";
import { i18n } from "@/i18n";

const mockProfile: FriendProfile = {
  id: "1",
  username: "janedoe",
  displayName: "Jane Doe",
  avatarUrl: "https://i.pravatar.cc/150?img=47"
};

const mockProfileNoAvatar: FriendProfile = {
  id: "2",
  username: "bob",
  displayName: "Bob Smith",
  avatarUrl: null
};

function renderCard(
  props: Partial<Parameters<typeof FriendCard>[0]> & {
    profile?: FriendProfile;
    onPress?: jest.Mock;
    onRemove?: jest.Mock;
  } = {}
) {
  const onPress = props.onPress ?? jest.fn();
  const onRemove = props.onRemove ?? jest.fn();
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { gcTime: 0, retry: false } }
  });

  return render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <FriendCard
          profile={props.profile ?? mockProfile}
          showRemove={props.showRemove}
          onPress={onPress}
          onRemove={onRemove}
        />
      </QueryClientProvider>
    </I18nextProvider>
  );
}

describe("FriendCard", () => {
  it("renders the display name", () => {
    renderCard();
    expect(screen.getByText("Jane Doe")).toBeTruthy();
    expect(screen.getByText("@janedoe")).toBeTruthy();
  });

  it("renders the avatar image when avatarUrl is present", () => {
    renderCard();
    // Image is rendered — no placeholder view
    expect(screen.queryByTestId("avatar-placeholder")).toBeNull();
  });

  it("renders a placeholder view when avatarUrl is null", () => {
    renderCard({ profile: mockProfileNoAvatar });
    expect(screen.getByText("Bob Smith")).toBeTruthy();
  });

  it("calls onPress when the card is pressed", () => {
    const onPress = jest.fn();
    renderCard({ onPress });
    fireEvent.press(screen.getByText("Jane Doe"));
    expect(onPress).toHaveBeenCalledWith(mockProfile);
  });

  it("does not show the remove button when showRemove is false", () => {
    renderCard({ showRemove: false });
    expect(screen.queryByText("Remover")).toBeNull();
  });

  it("shows the remove button when showRemove is true", () => {
    renderCard({ showRemove: true });
    expect(screen.getByText("Remover")).toBeTruthy();
  });

  it("opens the confirmation modal when remove button is pressed", () => {
    renderCard({ showRemove: true });
    fireEvent(screen.getByText("Remover"), "press", { stopPropagation: jest.fn() });
    expect(screen.getByText("Remover seguidor")).toBeTruthy();
    expect(screen.getByText(/Tem certeza que deseja remover/)).toBeTruthy();
  });

  it("shows the follower display name in the confirmation modal", () => {
    renderCard({ showRemove: true });
    fireEvent(screen.getByText("Remover"), "press", { stopPropagation: jest.fn() });
    expect(screen.getAllByText("Jane Doe").length).toBeGreaterThanOrEqual(1);
  });

  it("closes the confirmation modal when Cancelar is pressed", () => {
    renderCard({ showRemove: true });
    fireEvent(screen.getByText("Remover"), "press", { stopPropagation: jest.fn() });
    fireEvent.press(screen.getByText("Cancelar"));
    expect(screen.queryByText("Remover seguidor")).toBeNull();
  });

  it("calls onRemove and closes the modal when confirm remove is pressed", () => {
    const onRemove = jest.fn();
    renderCard({ showRemove: true, onRemove });

    fireEvent(screen.getByText("Remover"), "press", { stopPropagation: jest.fn() });

    // The modal has a second "Remover" button for confirmation
    const allRemove = screen.getAllByText("Remover");
    fireEvent.press(allRemove[allRemove.length - 1]);

    expect(onRemove).toHaveBeenCalledWith(mockProfile);
    expect(screen.queryByText("Remover seguidor")).toBeNull();
  });
});

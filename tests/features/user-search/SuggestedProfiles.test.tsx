import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { I18nextProvider } from "react-i18next";

import { useFollowMutation } from "@/features/follow/hooks/useFollowMutation";
import { SuggestedProfiles } from "@/features/user-search/components/SuggestedProfiles";
import { useUserSuggestions } from "@/features/user-search/hooks/useUserSuggestions";
import { i18n } from "@/i18n";
import { ApiError } from "@/services/api";

jest.mock("@/features/follow/hooks/useFollowMutation", () => ({
  useFollowMutation: jest.fn()
}));

jest.mock("@/features/user-search/hooks/useUserSuggestions", () => ({
  useUserSuggestions: jest.fn()
}));

type MutateCallbacks = {
  onError?: (error?: unknown) => void;
  onSettled?: () => void;
  onSuccess?: (result: { follow_status: string } | null) => void;
};

const mockMutate = jest.fn();
const mockOpenProfile = jest.fn();

function suggestions(overrides: Record<string, unknown>) {
  jest.mocked(useUserSuggestions).mockReturnValue({
    data: undefined,
    isPending: false,
    ...overrides
  } as unknown as ReturnType<typeof useUserSuggestions>);
}

function renderSuggestions() {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { gcTime: 0, retry: false } }
  });

  return render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <SuggestedProfiles onOpenProfile={mockOpenProfile} />
      </QueryClientProvider>
    </I18nextProvider>
  );
}

function lastCallbacks(): MutateCallbacks {
  return mockMutate.mock.calls.at(-1)?.[1] as MutateCallbacks;
}

beforeEach(() => {
  mockMutate.mockReset();
  mockOpenProfile.mockReset();
  jest.mocked(useFollowMutation).mockReturnValue({
    mutate: mockMutate
  } as unknown as ReturnType<typeof useFollowMutation>);
  suggestions({
    data: [
      { affinity: 0.9, avatar_url: null, user_id: "u1", username: "ana" },
      { affinity: 0.5, avatar_url: null, user_id: "u2", username: "bruno" }
    ]
  });
});

describe("SuggestedProfiles", () => {
  it("lists each suggestion with its username under the photo", () => {
    renderSuggestions();

    expect(screen.getByText("Perfis sugeridos")).toBeTruthy();
    expect(screen.getByText("ana")).toBeTruthy();
    expect(screen.getByText("bruno")).toBeTruthy();
    expect(screen.getByLabelText("Seguir ana")).toBeTruthy();
  });

  it("turns the plus into a check as soon as the user follows", () => {
    renderSuggestions();

    fireEvent.press(screen.getByTestId("suggested-follow-u1"));

    expect(mockMutate).toHaveBeenCalledWith({ action: "follow", userId: "u1" }, expect.any(Object));
    expect(screen.getByLabelText("Deixar de seguir ana")).toBeSelected();
  });

  it("shows a pending request for private accounts", () => {
    renderSuggestions();

    fireEvent.press(screen.getByTestId("suggested-follow-u1"));
    act(() => {
      lastCallbacks().onSuccess?.({ follow_status: "solicitado" });
      lastCallbacks().onSettled?.();
    });

    expect(screen.getByLabelText("Cancelar solicitação para seguir ana")).toBeTruthy();
  });

  it("goes back to the plus when following fails", () => {
    renderSuggestions();

    fireEvent.press(screen.getByTestId("suggested-follow-u1"));
    act(() => {
      lastCallbacks().onError?.(new Error("offline"));
      lastCallbacks().onSettled?.();
    });

    expect(screen.getByLabelText("Seguir ana")).not.toBeSelected();
  });

  it("keeps the check when the server says the profile is already followed", () => {
    renderSuggestions();

    fireEvent.press(screen.getByTestId("suggested-follow-u1"));
    act(() => {
      lastCallbacks().onError?.(new ApiError("CONFLICT", "already", 409, null));
      lastCallbacks().onSettled?.();
    });

    expect(screen.getByLabelText("Deixar de seguir ana")).toBeSelected();
  });

  it("unfollows when the check is pressed again", () => {
    renderSuggestions();

    fireEvent.press(screen.getByTestId("suggested-follow-u1"));
    act(() => lastCallbacks().onSettled?.());
    fireEvent.press(screen.getByTestId("suggested-follow-u1"));

    expect(mockMutate).toHaveBeenLastCalledWith(
      { action: "unfollow", userId: "u1" },
      expect.any(Object)
    );
  });

  it("ignores repeated taps while the request is in flight", () => {
    renderSuggestions();

    fireEvent.press(screen.getByTestId("suggested-follow-u1"));
    fireEvent.press(screen.getByTestId("suggested-follow-u1"));

    expect(mockMutate).toHaveBeenCalledTimes(1);
  });

  it("opens the profile when the photo is pressed", () => {
    renderSuggestions();

    fireEvent.press(screen.getByTestId("suggested-profile-u2"));

    expect(mockOpenProfile).toHaveBeenCalledWith("u2");
  });

  it("stays hidden when there are no suggestions", () => {
    suggestions({ data: [] });
    renderSuggestions();

    expect(screen.queryByTestId("suggested-profiles")).toBeNull();
  });

  it("shows a spinner while suggestions load", () => {
    suggestions({ isPending: true });
    renderSuggestions();

    expect(screen.getByTestId("suggested-profiles-loading")).toBeTruthy();
  });
});

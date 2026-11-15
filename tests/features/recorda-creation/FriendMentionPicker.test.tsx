import { act, fireEvent, render, screen, within } from "@testing-library/react-native";

import { useFollowing } from "@/features/friends/hooks/useFollowing";
import { FriendMentionPicker } from "@/features/recorda-creation/components/FriendMentionPicker";

jest.mock("@/features/auth/hooks/useCurrentUser", () => ({
  useCurrentUser: () => ({ user_id: "self" })
}));
jest.mock("@/features/friends/hooks/useFollowing", () => ({ useFollowing: jest.fn() }));

const following = jest.mocked(useFollowing);

function mockFriends() {
  following.mockReturnValue({
    data: { pages: [[{ id: "friend", username: "ana" }]] },
    isError: false,
    isFetching: false,
    isPending: false,
    isPlaceholderData: false,
    isSuccess: true
  } as unknown as ReturnType<typeof useFollowing>);
}

beforeEach(() => {
  jest.useFakeTimers();
  following.mockReset();
  mockFriends();
});

afterEach(() => {
  jest.useRealTimers();
});

test("searches by @username after the typing pause and lets the author select the matching friend", () => {
  const onChange = jest.fn();
  render(<FriendMentionPicker selectedIds={[]} onChange={onChange} disabled={false} />);
  fireEvent.press(screen.getByText("Marcar amigos (0)"));
  fireEvent.changeText(screen.getByLabelText("Buscar amigos"), " @ana ");
  act(() => {
    jest.advanceTimersByTime(400);
  });
  expect(following).toHaveBeenLastCalledWith("self", "ana", true);
  fireEvent.press(screen.getByRole("checkbox", { name: "@ana" }));
  expect(onChange).toHaveBeenCalledWith(["friend"]);
});

test("does not query the backend on every keystroke", () => {
  render(<FriendMentionPicker selectedIds={[]} onChange={jest.fn()} disabled={false} />);
  fireEvent.press(screen.getByText("Marcar amigos (0)"));
  const input = screen.getByLabelText("Buscar amigos");

  fireEvent.changeText(input, "a");
  act(() => {
    jest.advanceTimersByTime(100);
  });
  fireEvent.changeText(input, "an");
  act(() => {
    jest.advanceTimersByTime(100);
  });
  fireEvent.changeText(input, "ana");

  const searched = following.mock.calls.map(([, query]) => query);
  expect(searched.every((query) => query === "")).toBe(true);

  act(() => {
    jest.advanceTimersByTime(400);
  });
  expect(following).toHaveBeenLastCalledWith("self", "ana", true);
});

test("keeps the previous results on screen while a new search settles", () => {
  following.mockReturnValue({
    data: { pages: [[{ id: "friend", username: "ana" }]] },
    isError: false,
    isFetching: true,
    isPending: false,
    isPlaceholderData: true,
    isSuccess: true
  } as unknown as ReturnType<typeof useFollowing>);
  render(<FriendMentionPicker selectedIds={[]} onChange={jest.fn()} disabled={false} />);
  fireEvent.press(screen.getByText("Marcar amigos (0)"));
  fireEvent.changeText(screen.getByLabelText("Buscar amigos"), "m");

  expect(screen.getByRole("checkbox", { name: "@ana" })).toBeTruthy();
  expect(screen.queryByText("Carregando amigos…")).toBeNull();
});

test("shows the selected friends as removable chips", () => {
  const onChange = jest.fn();
  const { rerender } = render(
    <FriendMentionPicker selectedIds={[]} onChange={onChange} disabled={false} />
  );
  fireEvent.press(screen.getByText("Marcar amigos (0)"));
  fireEvent.press(screen.getByRole("checkbox", { name: "@ana" }));
  expect(onChange).toHaveBeenLastCalledWith(["friend"]);

  rerender(<FriendMentionPicker selectedIds={["friend"]} onChange={onChange} disabled={false} />);

  expect(within(screen.getByTestId("chip")).getByText("@ana")).toBeTruthy();
});

import { fireEvent, render, screen } from "@testing-library/react-native";
import { FriendMentionPicker } from "@/features/recorda-creation/components/FriendMentionPicker";
import { useFollowing } from "@/features/friends/hooks/useFollowing";

jest.mock("@/features/auth/hooks/useCurrentUser", () => ({
  useCurrentUser: () => ({ user_id: "self" })
}));
jest.mock("@/features/friends/hooks/useFollowing", () => ({ useFollowing: jest.fn() }));

const following = jest.mocked(useFollowing);

test("searches by @username and lets the author select the matching friend", () => {
  following.mockReturnValue({
    data: { pages: [[{ id: "friend", username: "ana" }]] }
  } as unknown as ReturnType<typeof useFollowing>);
  const onChange = jest.fn();
  render(<FriendMentionPicker selectedIds={[]} onChange={onChange} disabled={false} />);
  fireEvent.press(screen.getByText("Marcar amigos (0)"));
  fireEvent.changeText(screen.getByLabelText("Buscar amigos"), " @ana ");
  expect(following).toHaveBeenLastCalledWith("self", "ana", true);
  fireEvent.press(screen.getByRole("checkbox", { name: "@ana" }));
  expect(onChange).toHaveBeenCalledWith(["friend"]);
});

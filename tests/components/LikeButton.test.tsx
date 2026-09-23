import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import { LikeButton } from "@/components/ui";

describe("LikeButton", () => {
  it("updates the count immediately and keeps the liked state after success", async () => {
    const onToggle = jest.fn().mockResolvedValue(undefined);
    const onChange = jest.fn();

    render(
      <LikeButton accessibilityLabel="Curtir" count={12} onChange={onChange} onToggle={onToggle} />
    );

    fireEvent.press(screen.getByRole("button", { name: "Curtir" }));

    expect(screen.getByText("13")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Curtir" })).toBeSelected();
    expect(onChange).toHaveBeenCalledWith({ count: 13, liked: true });
    expect(onToggle).toHaveBeenCalledWith(true);
    await waitFor(() => expect(onToggle).toHaveBeenCalledTimes(1));
  });

  it("reverts the optimistic update when the toggle fails", async () => {
    const onToggle = jest.fn().mockRejectedValue(new Error("Request failed"));
    const onChange = jest.fn();

    render(
      <LikeButton accessibilityLabel="Curtir" count={12} onChange={onChange} onToggle={onToggle} />
    );

    fireEvent.press(screen.getByRole("button", { name: "Curtir" }));
    expect(screen.getByText("13")).toBeTruthy();

    await waitFor(() => {
      expect(screen.getByText("12")).toBeTruthy();
      expect(screen.getByRole("button", { name: "Curtir" })).not.toBeSelected();
      expect(onChange).toHaveBeenLastCalledWith({ count: 12, liked: false });
    });
  });
});

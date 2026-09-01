import { fireEvent, render, screen } from "@testing-library/react-native";
import { Text, TouchableOpacity } from "react-native";

import {
  RecordaDraftProvider,
  useRecordaDraft
} from "@/features/recorda-creation/context/RecordaDraftContext";

function DraftConsumer() {
  const { clearMedia, media, setMedia } = useRecordaDraft();

  return (
    <>
      <Text testID="media-value">{media ? `${media.type}:${media.uri}` : "empty"}</Text>
      <TouchableOpacity
        onPress={() => setMedia({ type: "photo", uri: "file://test.jpg" })}
        testID="set-button"
      >
        <Text>set</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={clearMedia} testID="clear-button">
        <Text>clear</Text>
      </TouchableOpacity>
    </>
  );
}

describe("RecordaDraftContext", () => {
  it("starts with no media", () => {
    render(
      <RecordaDraftProvider>
        <DraftConsumer />
      </RecordaDraftProvider>
    );

    expect(screen.getByTestId("media-value")).toHaveTextContent("empty");
  });

  it("stores media set via setMedia", () => {
    render(
      <RecordaDraftProvider>
        <DraftConsumer />
      </RecordaDraftProvider>
    );

    fireEvent.press(screen.getByTestId("set-button"));

    expect(screen.getByTestId("media-value")).toHaveTextContent("photo:file://test.jpg");
  });

  it("clears media via clearMedia", () => {
    render(
      <RecordaDraftProvider>
        <DraftConsumer />
      </RecordaDraftProvider>
    );

    fireEvent.press(screen.getByTestId("set-button"));
    fireEvent.press(screen.getByTestId("clear-button"));

    expect(screen.getByTestId("media-value")).toHaveTextContent("empty");
  });

  it("throws when used outside of the provider", () => {
    function renderWithoutProvider() {
      render(<DraftConsumer />);
    }

    expect(renderWithoutProvider).toThrow(
      "useRecordaDraft precisa ser usado dentro de um RecordaDraftProvider"
    );
  });
});

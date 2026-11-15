import { fireEvent, render, screen } from "@testing-library/react-native";
import { Text, TouchableOpacity } from "react-native";

import {
  RecordaDraftProvider,
  useRecordaDraft
} from "@/features/recorda-creation/context/RecordaDraftContext";

const song = {
  artistName: "Legião Urbana",
  coverUrl: "https://cdn/cover.jpg",
  deezerTrackId: "916424",
  previewUrl: null,
  title: "Tempo Perdido"
};

function DraftConsumer() {
  const { clearMedia, description, media, reset, setDescription, setMedia, setSong } =
    useRecordaDraft();
  const currentSong = useRecordaDraft().song;

  return (
    <>
      <Text testID="media-value">{media ? `${media.type}:${media.uri}` : "empty"}</Text>
      <Text testID="song-value">{currentSong ? currentSong.title : "no-song"}</Text>
      <Text testID="description-value">{description || "no-description"}</Text>
      <TouchableOpacity onPress={() => setSong(song)} testID="set-song-button">
        <Text>song</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => setDescription("Show")} testID="set-description-button">
        <Text>description</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={reset} testID="reset-button">
        <Text>reset</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => setMedia({ type: "photo", uri: "file://test.jpg" })}
        testID="set-button"
      >
        <Text>set</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => setMedia({ type: "video", uri: "file://test.mp4" })}
        testID="replace-button"
      >
        <Text>replace</Text>
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

  it("replaces the current media instead of storing multiple items", () => {
    render(
      <RecordaDraftProvider>
        <DraftConsumer />
      </RecordaDraftProvider>
    );

    fireEvent.press(screen.getByTestId("set-button"));
    fireEvent.press(screen.getByTestId("replace-button"));

    expect(screen.getByTestId("media-value")).toHaveTextContent("video:file://test.mp4");
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

  it("keeps the song when the same media is confirmed again", () => {
    render(
      <RecordaDraftProvider>
        <DraftConsumer />
      </RecordaDraftProvider>
    );

    fireEvent.press(screen.getByTestId("set-button"));
    fireEvent.press(screen.getByTestId("set-song-button"));
    fireEvent.press(screen.getByTestId("set-button"));

    expect(screen.getByTestId("song-value")).toHaveTextContent("Tempo Perdido");
  });

  it("drops the song when the media changes", () => {
    render(
      <RecordaDraftProvider>
        <DraftConsumer />
      </RecordaDraftProvider>
    );

    fireEvent.press(screen.getByTestId("set-button"));
    fireEvent.press(screen.getByTestId("set-song-button"));
    fireEvent.press(screen.getByTestId("replace-button"));

    expect(screen.getByTestId("song-value")).toHaveTextContent("no-song");
  });

  it("resets media, song and description", () => {
    render(
      <RecordaDraftProvider>
        <DraftConsumer />
      </RecordaDraftProvider>
    );

    fireEvent.press(screen.getByTestId("set-button"));
    fireEvent.press(screen.getByTestId("set-song-button"));
    fireEvent.press(screen.getByTestId("set-description-button"));
    expect(screen.getByTestId("description-value")).toHaveTextContent("Show");

    fireEvent.press(screen.getByTestId("reset-button"));

    expect(screen.getByTestId("media-value")).toHaveTextContent("empty");
    expect(screen.getByTestId("song-value")).toHaveTextContent("no-song");
    expect(screen.getByTestId("description-value")).toHaveTextContent("no-description");
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

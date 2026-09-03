import { fireEvent, render, screen } from "@testing-library/react-native";
import type { ReactElement } from "react";

import { AppProviders } from "@/app/providers/AppProviders";
import { RecordaDetailsScreen } from "@/features/recorda-creation/screens/RecordaDetailsScreen";
import type { RecordaDraft } from "@/features/recorda-creation/types";
import { mockRecordaDraft } from "@/features/recorda-creation/mocks/recordaDraft";

const mockGoBack = jest.fn();

jest.mock("@react-navigation/native", () => {
  const actual = jest.requireActual("@react-navigation/native");

  return {
    ...actual,
    useNavigation: () => ({ goBack: mockGoBack })
  };
});

function renderScreen(ui: ReactElement) {
  return render(<AppProviders>{ui}</AppProviders>);
}

function createDraft(overrides: Partial<RecordaDraft> = {}): RecordaDraft {
  return { ...mockRecordaDraft, ...overrides };
}

describe("RecordaDetailsScreen", () => {
  beforeEach(() => {
    mockGoBack.mockClear();
  });

  it("renders the selected media and song as read-only content", () => {
    renderScreen(<RecordaDetailsScreen draft={mockRecordaDraft} onPublish={jest.fn()} />);

    expect(screen.getByTestId("recorda-details-media")).toBeTruthy();
    expect(screen.getByTestId("recorda-details-song-cover")).toBeTruthy();
    expect(screen.getByText(mockRecordaDraft.song!.title)).toBeTruthy();
    expect(screen.getByText(mockRecordaDraft.song!.artistName)).toBeTruthy();
    expect(screen.queryByRole("button", { name: /música|song/i })).toBeNull();
    expect(screen.getByRole("button", { name: "Compartilhar" })).toBeTruthy();
    expect(screen.queryByText(/\/2200/)).toBeNull();
    expect(screen.getByPlaceholderText("Adicione uma descrição...")).toBeTruthy();
    expect(screen.getByText("Descrição")).toBeTruthy();
  });

  it("goes back when the header back button is pressed", () => {
    renderScreen(<RecordaDetailsScreen draft={mockRecordaDraft} onPublish={jest.fn()} />);

    fireEvent.press(screen.getByRole("button", { name: "Voltar" }));

    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });

  it("renders selected video media for review", () => {
    renderScreen(
      <RecordaDetailsScreen
        draft={createDraft({
          media: { type: "video", uri: "file://selected-video.mp4" }
        })}
        onPublish={jest.fn()}
      />
    );

    expect(screen.getByTestId("recorda-details-video")).toBeTruthy();
  });

  it("renders a cover placeholder when the song has no cover URL", () => {
    renderScreen(
      <RecordaDetailsScreen
        draft={createDraft({ song: { ...mockRecordaDraft.song!, coverUrl: "" } })}
        onPublish={jest.fn()}
      />
    );

    expect(screen.getByTestId("recorda-details-song-cover")).toBeTruthy();
  });

  it("renders the cover placeholder when the cover image fails", () => {
    renderScreen(
      <RecordaDetailsScreen
        draft={createDraft({
          song: { ...mockRecordaDraft.song!, coverUrl: "https://invalid.example/cover.jpg" }
        })}
        onPublish={jest.fn()}
      />
    );

    fireEvent(screen.getByTestId("recorda-details-song-cover"), "error");

    expect(screen.getByTestId("recorda-details-song-cover")).toBeTruthy();
  });

  it("updates the optional description locally", () => {
    renderScreen(<RecordaDetailsScreen draft={mockRecordaDraft} onPublish={jest.fn()} />);

    const description = screen.getByLabelText("Descrição");
    fireEvent.changeText(description, "Uma memória especial");

    expect(description).toHaveProp("value", "Uma memória especial");
  });

  it("allows an empty description", () => {
    renderScreen(
      <RecordaDetailsScreen
        draft={createDraft({ description: "" })}
        onPublish={jest.fn()}
      />
    );

    expect(screen.getByLabelText("Descrição")).toHaveProp("value", "");
    expect(screen.getByRole("button", { name: "Publicar" })).toBeEnabled();
  });

  it("accepts exactly 2200 characters and blocks additional characters", () => {
    renderScreen(<RecordaDetailsScreen draft={mockRecordaDraft} onPublish={jest.fn()} />);

    const description = screen.getByLabelText("Descrição");
    const acceptedText = "a".repeat(2200);

    fireEvent.changeText(description, `${acceptedText}extra`);

    expect(description).toHaveProp("value", acceptedText);
  });

  it("disables publishing when no song is associated", () => {
    renderScreen(
      <RecordaDetailsScreen
        draft={createDraft({ song: null })}
        onPublish={jest.fn()}
      />
    );

    expect(screen.getByRole("button", { name: "Publicar" })).toBeDisabled();
  });

  it("publishes through the temporary action when a song is available", () => {
    const onPublish = jest.fn();
    renderScreen(<RecordaDetailsScreen draft={mockRecordaDraft} onPublish={onPublish} />);

    fireEvent.press(screen.getByRole("button", { name: "Publicar" }));

    expect(onPublish).toHaveBeenCalledTimes(1);
  });

  it("renders without failing when media is absent", () => {
    renderScreen(
      <RecordaDetailsScreen
        draft={createDraft({ media: null })}
        onPublish={jest.fn()}
      />
    );

    expect(screen.getByText("Mídia indisponível")).toBeTruthy();
  });
});

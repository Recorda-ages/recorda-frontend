import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { type ReactElement, useEffect } from "react";
import { Alert } from "react-native";

import { AppProviders } from "@/app/providers/AppProviders";
import { useRecordaDraft } from "@/features/recorda-creation/context/RecordaDraftContext";
import { RecordaDetailsScreen } from "@/features/recorda-creation/screens/RecordaDetailsScreen";
import type { RecordaDraft } from "@/features/recorda-creation/types";
import { usePublishRecorda } from "@/features/recorda-publish";

import { mockAudioPlayer, resetAudioMock } from "../../../mocks/expoAudio";
import { mockRecordaDraft } from "../../../mocks/recordaDraft";

const mockGoBack = jest.fn();
const mockNavigate = jest.fn();
const mockReset = jest.fn();
const mockPublish = jest.fn();
const mockRetry = jest.fn();

jest.mock("@react-navigation/native", () => {
  const actual = jest.requireActual("@react-navigation/native");

  return {
    ...actual,
    useNavigation: () => ({ goBack: mockGoBack, navigate: mockNavigate, reset: mockReset })
  };
});

jest.mock("@/features/recorda-publish", () => ({
  usePublishRecorda: jest.fn()
}));

jest.mock("@/features/friends/hooks/useFollowing", () => ({
  useFollowing: () => ({ data: { pages: [[{ id: "friend-1", username: "amiga" }]] } })
}));

const mockedUsePublishRecorda = usePublishRecorda as jest.Mock;

function renderScreen(ui: ReactElement) {
  return render(<AppProviders>{ui}</AppProviders>);
}

function createDraft(overrides: Partial<RecordaDraft> = {}): RecordaDraft {
  return { ...mockRecordaDraft, ...overrides };
}

function DraftSeeder({ draft }: { draft: RecordaDraft }) {
  const { setDescription, setMedia, setSong } = useRecordaDraft();

  useEffect(() => {
    if (draft.media) {
      setMedia(draft.media);
    }
    setSong(draft.song);
    setDescription(draft.description);
  }, [draft, setDescription, setMedia, setSong]);

  return null;
}

describe("RecordaDetailsScreen", () => {
  beforeEach(() => {
    mockGoBack.mockClear();
    mockNavigate.mockClear();
    mockReset.mockClear();
    mockPublish.mockReset();
    mockRetry.mockReset();
    mockPublish.mockResolvedValue(undefined);
    mockRetry.mockResolvedValue(undefined);
    mockedUsePublishRecorda.mockReturnValue({
      error: null,
      publish: mockPublish,
      retry: mockRetry,
      status: "idle"
    });
    resetAudioMock();
    jest.spyOn(Alert, "alert").mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
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

  it("publishes the selected friend tags", () => {
    const onPublish = jest.fn();
    renderScreen(<RecordaDetailsScreen draft={mockRecordaDraft} onPublish={onPublish} />);
    fireEvent.press(screen.getByText("Marcar amigos (0)"));
    fireEvent.press(screen.getByRole("checkbox", { name: "@amiga" }));
    fireEvent.press(screen.getByRole("button", { name: "Publicar" }));
    expect(onPublish).toHaveBeenCalledWith(
      expect.objectContaining({ mentionedUserIds: ["friend-1"] })
    );
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
      <RecordaDetailsScreen draft={createDraft({ description: "" })} onPublish={jest.fn()} />
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
      <RecordaDetailsScreen draft={createDraft({ song: null })} onPublish={jest.fn()} />
    );

    expect(screen.getByRole("button", { name: "Publicar" })).toBeDisabled();
  });

  it("disables publishing when no media is available", () => {
    renderScreen(
      <RecordaDetailsScreen draft={createDraft({ media: null })} onPublish={jest.fn()} />
    );

    expect(screen.getByRole("button", { name: "Publicar" })).toBeDisabled();
  });

  it("publishes the current draft when a song is available", () => {
    const onPublish = jest.fn();
    renderScreen(<RecordaDetailsScreen draft={mockRecordaDraft} onPublish={onPublish} />);

    fireEvent.changeText(screen.getByLabelText("Descrição"), "Uma memória especial");
    fireEvent.press(screen.getByRole("button", { name: "Publicar" }));

    expect(onPublish).toHaveBeenCalledWith(
      expect.objectContaining({
        description: "Uma memória especial",
        media: mockRecordaDraft.media,
        song: mockRecordaDraft.song
      })
    );
    expect(mockPublish).not.toHaveBeenCalled();
  });

  it("publishes through the default publish flow without an explicit handler", async () => {
    renderScreen(<RecordaDetailsScreen draft={mockRecordaDraft} />);

    fireEvent.changeText(screen.getByLabelText("Descrição"), "Uma memória especial");
    fireEvent.press(screen.getByRole("button", { name: "Publicar" }));

    await waitFor(() => {
      expect(mockPublish).toHaveBeenCalledWith({
        description: "Uma memória especial",
        media: {
          fileName: "recorda.jpg",
          mimeType: "image/jpeg",
          type: "PHOTO",
          uri: mockRecordaDraft.media!.uri
        },
        song: {
          artistName: mockRecordaDraft.song!.artistName,
          coverUrl: mockRecordaDraft.song!.coverUrl,
          deezerTrackId: mockRecordaDraft.song!.deezerTrackId,
          previewUrl: undefined,
          title: mockRecordaDraft.song!.title
        }
      });
    });
  });

  it("shows progress and blocks another publish while uploading", () => {
    mockedUsePublishRecorda.mockReturnValue({
      error: null,
      publish: mockPublish,
      retry: mockRetry,
      status: "uploading"
    });

    renderScreen(<RecordaDetailsScreen draft={mockRecordaDraft} />);

    expect(screen.getByText("Enviando mídia...")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Enviando mídia..." })).toBeDisabled();

    fireEvent.press(screen.getByRole("button", { name: "Enviando mídia..." }));

    expect(mockPublish).not.toHaveBeenCalled();
  });

  it("keeps data visible and allows retry when publishing fails", async () => {
    mockedUsePublishRecorda.mockReturnValue({
      error: { message: "Falha ao publicar.", step: "create" },
      publish: mockPublish,
      retry: mockRetry,
      status: "error"
    });

    renderScreen(
      <RecordaDetailsScreen draft={createDraft({ description: "Descrição preservada" })} />
    );

    expect(screen.getByTestId("recorda-details-media")).toBeTruthy();
    expect(screen.getByText(mockRecordaDraft.song!.title)).toBeTruthy();
    expect(screen.getByLabelText("Descrição")).toHaveProp("value", "Descrição preservada");
    expect(screen.getByText("Não foi possível publicar a Recorda. Tente novamente.")).toBeTruthy();
    expect(screen.queryByText("Falha ao publicar.")).toBeNull();

    fireEvent.press(screen.getByRole("button", { name: "Tentar novamente" }));

    await waitFor(() => {
      expect(mockRetry).toHaveBeenCalledWith(
        expect.objectContaining({
          media: expect.objectContaining({ uri: mockRecordaDraft.media!.uri }),
          song: expect.objectContaining({ deezerTrackId: mockRecordaDraft.song!.deezerTrackId })
        })
      );
    });
  });

  it("redirects to the Feed on successful publish without a native alert", async () => {
    mockedUsePublishRecorda.mockReturnValue({
      error: null,
      publish: mockPublish,
      retry: mockRetry,
      status: "success"
    });

    renderScreen(<RecordaDetailsScreen draft={mockRecordaDraft} />);

    await waitFor(() => {
      expect(Alert.alert).not.toHaveBeenCalled();
      expect(mockReset).toHaveBeenCalledWith({
        index: 0,
        routes: [{ name: "Feed" }]
      });
    });
  });

  it("shares the current draft when a share action is provided", () => {
    const onShare = jest.fn();
    renderScreen(<RecordaDetailsScreen draft={mockRecordaDraft} onShare={onShare} />);

    fireEvent.press(screen.getByRole("button", { name: "Compartilhar" }));

    expect(onShare).toHaveBeenCalledWith(
      expect.objectContaining({
        description: "",
        media: mockRecordaDraft.media,
        song: mockRecordaDraft.song
      })
    );
  });

  it("navigates to ShareCard when no share action is provided", () => {
    renderScreen(<RecordaDetailsScreen draft={mockRecordaDraft} />);

    fireEvent.press(screen.getByRole("button", { name: "Compartilhar" }));

    expect(mockNavigate).toHaveBeenCalledWith("ShareCard", {
      artistName: mockRecordaDraft.song!.artistName,
      coverUrl: null,
      mediaUri: mockRecordaDraft.media!.uri,
      mediaType: mockRecordaDraft.media!.type,
      songTitle: mockRecordaDraft.song!.title
    });
  });

  it("reads media and song from the draft stored during the creation flow", async () => {
    renderScreen(
      <>
        <DraftSeeder
          draft={createDraft({ song: { ...mockRecordaDraft.song!, title: "Evidências" } })}
        />
        <RecordaDetailsScreen />
      </>
    );

    expect(await screen.findByText("Evidências")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Publicar" })).toBeEnabled();
  });

  it("does not fall back to mocked content when the draft is empty", () => {
    renderScreen(<RecordaDetailsScreen />);

    expect(screen.getByText("Mídia indisponível")).toBeTruthy();
    expect(screen.queryByText(mockRecordaDraft.song!.title)).toBeNull();
    expect(screen.getByRole("button", { name: "Publicar" })).toBeDisabled();
  });

  it("renders without failing when media is absent", () => {
    renderScreen(
      <RecordaDetailsScreen draft={createDraft({ media: null })} onPublish={jest.fn()} />
    );

    expect(screen.getByText("Mídia indisponível")).toBeTruthy();
  });

  it("plays the song preview while the Recorda is being created and can be muted", async () => {
    const draft = createDraft({
      song: { ...mockRecordaDraft.song!, previewUrl: "https://cdn.example.com/preview.mp3" }
    });
    renderScreen(<RecordaDetailsScreen draft={draft} onPublish={jest.fn()} />);

    await waitFor(() => expect(mockAudioPlayer.play).toHaveBeenCalled());
    expect(mockAudioPlayer.replace).toHaveBeenCalledWith("https://cdn.example.com/preview.mp3");
    expect(mockAudioPlayer.muted).toBe(false);

    fireEvent.press(screen.getByRole("button", { name: "Silenciar música" }));
    await waitFor(() => expect(mockAudioPlayer.muted).toBe(true));

    fireEvent.press(screen.getByRole("button", { name: "Reativar música" }));
    await waitFor(() => expect(mockAudioPlayer.muted).toBe(false));
  });

  it("has no sound control when the song has no preview", () => {
    renderScreen(<RecordaDetailsScreen draft={mockRecordaDraft} onPublish={jest.fn()} />);

    expect(screen.queryByTestId("draft-sound-toggle")).toBeNull();
    expect(mockAudioPlayer.play).not.toHaveBeenCalled();
  });
});

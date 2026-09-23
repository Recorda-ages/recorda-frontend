import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { useEffect } from "react";
import { Text } from "react-native";
import { I18nextProvider } from "react-i18next";

import { musicService } from "@/features/music/services/musicService";
import {
  RecordaDraftProvider,
  useRecordaDraft
} from "@/features/recorda-creation/context/RecordaDraftContext";
import {
  RecordaMusicScreen,
  toDraftSong
} from "@/features/recorda-creation/screens/RecordaMusicScreen";
import { i18n } from "@/i18n";

const mockGoBack = jest.fn();
const mockNavigate = jest.fn();

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ goBack: mockGoBack, navigate: mockNavigate })
}));

jest.mock("@/features/music/services/musicService", () => ({
  musicService: { searchTracks: jest.fn() }
}));

const mockSearchTracks = musicService.searchTracks as jest.Mock;

const tracks = [
  {
    album: "Dois",
    artist: "Legião Urbana",
    cover_url: "https://cdn/dois.jpg",
    genre_id: 152,
    id: 916424,
    preview_url: "https://cdn/preview.mp3",
    title: "Tempo Perdido"
  },
  {
    album: "Cowboy do Asfalto",
    artist: "Chitãozinho & Xororó",
    cover_url: null,
    genre_id: null,
    id: 3135556,
    preview_url: null,
    title: "Evidências"
  }
];

function DraftSeeder() {
  const { setMedia } = useRecordaDraft();

  useEffect(() => {
    setMedia({ type: "photo", uri: "file://photo.jpg" });
  }, [setMedia]);

  return null;
}

function DraftSongProbe() {
  const { song } = useRecordaDraft();

  return <Text testID="draft-song">{song ? `${song.deezerTrackId}:${song.title}` : "none"}</Text>;
}

function renderScreen() {
  const client = new QueryClient({
    defaultOptions: { queries: { gcTime: 0, retry: false } }
  });

  return render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={client}>
        <RecordaDraftProvider>
          <DraftSeeder />
          <DraftSongProbe />
          <RecordaMusicScreen />
        </RecordaDraftProvider>
      </QueryClientProvider>
    </I18nextProvider>
  );
}

describe("RecordaMusicScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchTracks.mockResolvedValue(tracks);
  });

  it("keeps next disabled until a song is chosen", async () => {
    renderScreen();

    expect(
      screen.getByText("Busque por música, artista ou álbum para associar à sua Recorda.")
    ).toBeTruthy();
    expect(screen.getByTestId("recorda-music-next-button")).toBeDisabled();

    fireEvent.changeText(screen.getByLabelText("Que som te representa?"), "tempo");
    const track = await screen.findByRole("radio", { name: "Tempo Perdido, Legião Urbana" });
    fireEvent.press(track);

    expect(screen.getByTestId("recorda-music-next-button")).toBeEnabled();
    expect(track).toBeChecked();
    expect(mockSearchTracks).toHaveBeenCalledWith("tempo", expect.anything());
  });

  it("stores the chosen song in the draft and moves to details", async () => {
    renderScreen();

    fireEvent.changeText(screen.getByLabelText("Que som te representa?"), "evidencias");
    fireEvent.press(await screen.findByRole("radio", { name: "Evidências, Chitãozinho & Xororó" }));
    fireEvent.press(screen.getByTestId("recorda-music-next-button"));

    expect(screen.getByTestId("draft-song")).toHaveTextContent("3135556:Evidências");
    expect(mockNavigate).toHaveBeenCalledWith("RecordaDetails");
  });

  it("shows an empty state when no songs are found", async () => {
    mockSearchTracks.mockResolvedValueOnce([]);
    renderScreen();

    fireEvent.changeText(screen.getByLabelText("Que som te representa?"), "zzzz");

    expect(
      await screen.findByText("Nenhuma música encontrada. Tente outro nome ou artista.")
    ).toBeTruthy();
  });

  it("lets the user retry when the music service is unavailable", async () => {
    mockSearchTracks.mockRejectedValueOnce(new Error("offline"));
    renderScreen();

    fireEvent.changeText(screen.getByLabelText("Que som te representa?"), "tempo");

    expect(await screen.findByText("Não foi possível buscar músicas.")).toBeTruthy();

    fireEvent.press(screen.getByRole("button", { name: "Tentar novamente" }));

    expect(await screen.findByRole("radio", { name: "Tempo Perdido, Legião Urbana" })).toBeTruthy();
  });

  it("goes back to the preview", () => {
    renderScreen();

    fireEvent.press(screen.getByRole("button", { name: "Voltar" }));

    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });

  it("maps a track keeping its preview url", () => {
    expect(toDraftSong(tracks[0])).toEqual({
      artistName: "Legião Urbana",
      coverUrl: "https://cdn/dois.jpg",
      deezerTrackId: "916424",
      previewUrl: "https://cdn/preview.mp3",
      title: "Tempo Perdido"
    });
    expect(toDraftSong(tracks[1]).coverUrl).toBe("");
    expect(toDraftSong(tracks[1]).previewUrl).toBeNull();
  });

  it("renders the preview card even before the media is available", async () => {
    renderScreen();

    await waitFor(() => expect(screen.getByTestId("recorda-music-preview")).toBeTruthy());
  });
});

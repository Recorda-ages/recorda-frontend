import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react-native";
import { I18nextProvider } from "react-i18next";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import { FeedProvider, PublishedRecordaScreen, RecordaIntegrationScreen } from "@/features/feed";
import { shouldCloseCommentsSheet } from "@/features/feed/components/RecordaDetailView";
import { FeedAudioProvider } from "@/features/feed/state/FeedAudioContext";
import { feedService } from "@/features/feed/services/feedService";
import { useFeed } from "@/features/feed/state/FeedContext";
import type { FeedItem, RecordaDetailResponse } from "@/features/feed/types";
import { i18n } from "@/i18n";
import { authApiClient } from "@/services/api";

import { mockUseVideoPlayer, resetVideoMock } from "../../mocks/expoVideo";
import { mockAudioPlayer, resetAudioMock } from "../../mocks/expoAudio";

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
let mockRoute = { name: "PublishedRecorda", params: { postId: "post-1" } };
let queryClient: QueryClient;

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ navigate: mockNavigate, goBack: mockGoBack }),
  useRoute: () => mockRoute
}));

function FeedSnapshot() {
  const { posts, likedIds } = useFeed();
  return (
    <View>
      <Text testID="remaining-posts">{posts.map((post) => post.id).join(",")}</Text>
      <Text testID="liked-posts">{likedIds.join(",")}</Text>
      <Text testID="shared-comments">
        {posts[0]?.comments.map((comment) => comment.text).join(",")}
      </Text>
    </View>
  );
}

function OpenFeedItem({ item }: { item: FeedItem }) {
  const { openFeedItem } = useFeed();
  const [opened, setOpened] = useState(false);

  return (
    <>
      <Pressable
        onPress={() => {
          openFeedItem(item);
          setOpened(true);
        }}
      >
        <Text>Open API item</Text>
      </Pressable>
      {opened ? <PublishedRecordaScreen /> : null}
    </>
  );
}

function renderScreen(item?: FeedItem) {
  queryClient = new QueryClient({
    defaultOptions: { queries: { gcTime: Infinity, retry: false } }
  });

  return render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <FeedProvider>
          <FeedAudioProvider>
            {item ? <OpenFeedItem item={item} /> : null}
            {item ? null : <PublishedRecordaScreen />}
            <FeedSnapshot />
          </FeedAudioProvider>
        </FeedProvider>
      </QueryClientProvider>
    </I18nextProvider>
  );
}

describe("PublishedRecordaScreen", () => {
  let getRecordaById: jest.SpyInstance;
  let getComments: jest.SpyInstance;
  let createComment: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    resetVideoMock();
    resetAudioMock();
    mockRoute = { name: "PublishedRecorda", params: { postId: "post-1" } };
    getRecordaById = jest
      .spyOn(feedService, "getRecordaById")
      .mockRejectedValue(new Error("not found"));
    getComments = jest.spyOn(feedService, "getComments").mockResolvedValue([]);
    createComment = jest.spyOn(feedService, "createComment");
  });

  afterEach(() => {
    queryClient?.clear();
    jest.restoreAllMocks();
  });

  it("shows the expanded post, publication date and comments", () => {
    renderScreen();
    expect(getRecordaById).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Show I-N-C-R-I-V-E-L!")).toBeTruthy();
    expect(screen.getByText("The Edge")).toBeTruthy();
    expect(screen.getByText(/The American Dawn/)).toBeTruthy();
    expect(screen.getByText("01 de janeiro")).toBeTruthy();
    // Comments live in the sheet opened from the comment button.
    expect(
      within(screen.getByTestId("recorda-detail-screen")).queryByText(/Estava d\+!/)
    ).toBeNull();
    fireEvent.press(screen.getByRole("button", { name: "Comentar" }));
    expect(
      within(screen.getByTestId("recorda-detail-screen")).getByText(/Estava d\+!/)
    ).toBeTruthy();
    expect(screen.queryByText(/Data da Memória|Local|Marcações/)).toBeNull();
    fireEvent.press(screen.getByRole("button", { name: "Voltar" }));
    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });

  it("keeps likes and comments in shared state", async () => {
    renderScreen();
    const details = within(screen.getByTestId("recorda-detail-screen"));
    fireEvent.press(details.getByRole("button", { name: "Curtir" }));
    expect(screen.getByTestId("liked-posts")).toHaveTextContent("post-1");
    expect(details.getByText("13 curtidas")).toBeTruthy();
    fireEvent.press(details.getByRole("button", { name: "Curtir" }));
    expect(screen.getByTestId("liked-posts")).toHaveTextContent("");
    expect(details.getByText("12 curtidas")).toBeTruthy();

    expect(details.queryByLabelText("Adicione um comentário...")).toBeNull();
    fireEvent.press(details.getByRole("button", { name: "Comentar" }));
    const input = details.getByLabelText("Adicione um comentário...");
    expect(details.getByRole("button", { name: "Enviar comentário" })).toBeDisabled();
    fireEvent.changeText(input, "   ");
    expect(details.getByRole("button", { name: "Enviar comentário" })).toBeDisabled();
    fireEvent.changeText(input, "  Que lembrança boa!  ");
    fireEvent.press(details.getByRole("button", { name: "Enviar comentário" }));
    await waitFor(() => expect(details.getByText(/Que lembrança boa!/)).toBeTruthy());
    expect(screen.getByTestId("shared-comments").props.children).toContain("Que lembrança boa!");
    expect(input.props.value).toBe("");
  });

  it("only offers Delete for own posts and requires confirmation", () => {
    renderScreen();
    fireEvent.press(screen.getByRole("button", { name: "Mais opções" }));
    expect(screen.queryByText("Denunciar")).toBeNull();
    fireEvent.press(screen.getByRole("button", { name: "Excluir" }));
    expect(screen.getByText("Excluir Recorda?")).toBeTruthy();
    expect(screen.getByTestId("remaining-posts")).toHaveTextContent(/post-1/);
    fireEvent.press(screen.getByRole("button", { name: "Cancelar" }));
    expect(screen.getByTestId("remaining-posts")).toHaveTextContent(/post-1/);
    expect(mockGoBack).not.toHaveBeenCalled();
    fireEvent.press(screen.getByRole("button", { name: "Mais opções" }));
    fireEvent.press(screen.getByRole("button", { name: "Excluir" }));
    fireEvent.press(screen.getByRole("button", { name: "Confirmar exclusão" }));
    expect(screen.getByTestId("remaining-posts")).not.toHaveTextContent(/post-1/);
    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });

  it("deletes an owned API Recorda on the server before removing it locally", async () => {
    const recordaId = "11111111-1111-4111-8111-111111111111";
    const item: FeedItem = {
      author: { user_id: "demo-lucas", username: "lucas_almeida", profile_picture_url: null },
      created_at: "2026-01-01T12:00:00Z",
      description: "Minha Recorda",
      is_liked: false,
      likes_count: 0,
      media_type: "PHOTO",
      media_url: "https://cdn.example.com/photo.jpg",
      recorda_id: recordaId,
      song_artist_name: "Artist",
      song_cover_url: "",
      song_preview_url: null,
      song_title: "Song"
    };
    let finishDelete!: () => void;
    const deleteRecorda = jest.spyOn(feedService, "deleteRecorda").mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          finishDelete = resolve;
        })
    );
    mockRoute.params.postId = recordaId;
    renderScreen(item);
    fireEvent.press(screen.getByText("Open API item"));
    fireEvent.press(screen.getByRole("button", { name: "Mais opções" }));
    fireEvent.press(screen.getByRole("button", { name: "Excluir" }));
    fireEvent.press(screen.getByRole("button", { name: "Confirmar exclusão" }));

    await waitFor(() => expect(deleteRecorda).toHaveBeenCalledWith(recordaId));
    expect(screen.getByTestId("remaining-posts").props.children).toContain(recordaId);
    expect(mockGoBack).not.toHaveBeenCalled();

    await act(async () => finishDelete());
    await waitFor(() =>
      expect(screen.getByTestId("remaining-posts").props.children).not.toContain(recordaId)
    );
    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });

  it("only offers Report for another author and opens the report dialog", () => {
    mockRoute.params.postId = "post-2";
    renderScreen();
    fireEvent.press(screen.getByRole("button", { name: "Mais opções" }));
    expect(screen.queryByText("Excluir")).toBeNull();
    fireEvent.press(screen.getByRole("button", { name: "Denunciar" }));
    expect(screen.getByText("Denunciar conteúdo")).toBeTruthy();
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(screen.getByTestId("remaining-posts")).toHaveTextContent(/post-2/);
  });

  // Só o contrato da integração: que a tela entrega o id certo ao fluxo de
  // denúncia. Contador, limite, duplo envio e os ramos de erro são da feature
  // moderation e estão cobertos nos testes dela.
  it("sends the report for the open Recorda with its own id", async () => {
    mockRoute.params.postId = "post-2";
    const reportPost = jest.spyOn(authApiClient, "post").mockResolvedValue({
      created_at: "2026-10-06T12:00:00Z",
      report_id: "11111111-1111-4111-8111-111111111111",
      status: "OPEN"
    });
    renderScreen();

    fireEvent.press(screen.getByRole("button", { name: "Mais opções" }));
    fireEvent.press(screen.getByRole("button", { name: "Denunciar" }));
    fireEvent.changeText(screen.getByPlaceholderText("Descrição (opcional)"), "conteúdo ofensivo");
    fireEvent.press(screen.getByRole("button", { name: "Denunciar" }));

    await waitFor(() =>
      expect(reportPost).toHaveBeenCalledWith("/recordas/post-2/reports", {
        description: "conteúdo ofensivo"
      })
    );
  });

  it("shares a Recorda opened from the feed with its album cover", () => {
    const item: FeedItem = {
      author: { user_id: "user-2", username: "jane", profile_picture_url: null },
      created_at: "2026-01-01T12:00:00Z",
      description: "Show ao vivo",
      is_liked: false,
      likes_count: 0,
      media_type: "PHOTO",
      media_url: "https://cdn.example.com/live.jpg",
      recorda_id: "11111111-1111-4111-8111-111111111111",
      song_artist_name: "Artist",
      song_cover_url: "https://cdn.example.com/cover.jpg",
      song_preview_url: null,
      song_title: "Song"
    };
    mockRoute.params.postId = item.recorda_id;
    renderScreen(item);
    fireEvent.press(screen.getByText("Open API item"));

    fireEvent.press(screen.getByRole("button", { name: "Compartilhar" }));

    expect(mockNavigate).toHaveBeenCalledWith(
      "ShareCard",
      expect.objectContaining({ coverUrl: "https://cdn.example.com/cover.jpg" })
    );
  });

  it("opens the sharing destination with the selected Recorda", () => {
    renderScreen();
    fireEvent.press(screen.getByRole("button", { name: "Compartilhar" }));
    expect(mockNavigate).toHaveBeenCalledWith("ShareCard", {
      artistName: "The American Dawn",
      coverUrl: null,
      mediaUri: expect.any(String),
      mediaType: "photo",
      songTitle: "The Edge"
    });
  });

  it("closes the comments sheet when tapping outside it", () => {
    // Keep React's async act scheduler running while animation timers are mocked.
    jest.useFakeTimers({ doNotFake: ["setImmediate"] });
    try {
      renderScreen();
      fireEvent.press(screen.getByRole("button", { name: "Comentar" }));
      expect(screen.getByTestId("comments-sheet")).toBeTruthy();
      expect(screen.getByLabelText("Adicione um comentário...")).toBeTruthy();

      // The open sheet is modal for screen readers, so everything behind it is hidden
      // from accessibility (and from default queries).
      const hidden = { includeHiddenElements: true };
      expect(screen.queryByTestId("recorda-bottom-overlay")).toBeNull();
      // Description and actions stop taking touches while the sheet covers them.
      expect(screen.getByTestId("recorda-bottom-overlay", hidden).props.pointerEvents).toBe("none");

      fireEvent.press(screen.getByTestId("comments-backdrop", hidden));
      // Stays mounted while it slides out, then unmounts.
      expect(screen.getByTestId("comments-sheet")).toBeTruthy();
      act(() => {
        jest.advanceTimersByTime(250);
      });
      expect(screen.queryByTestId("comments-sheet")).toBeNull();
      expect(screen.getByTestId("recorda-bottom-overlay").props.pointerEvents).toBe("box-none");
    } finally {
      jest.useRealTimers();
    }
  });

  it("keeps the description outside the comments sheet", () => {
    renderScreen();

    expect(screen.getByTestId("recorda-description")).toBeTruthy();
    expect(screen.queryByTestId("comments-sheet")).toBeNull();
  });

  it("does not offer to expand a description that fits in one line", () => {
    renderScreen();
    fireEvent(
      screen.getByTestId("recorda-description-measure", { includeHiddenElements: true }),
      "textLayout",
      {
        nativeEvent: { lines: [{ text: "cabe numa linha" }] }
      }
    );

    expect(screen.queryByRole("button", { name: /Show I-N-C-R-I-V-E-L!/ })).toBeNull();
  });

  it("shows one line of description, expands it on tap and collapses from the chevron", () => {
    renderScreen();
    // The full-width measurement reports more than one line: the text is cut off.
    fireEvent(
      screen.getByTestId("recorda-description-measure", { includeHiddenElements: true }),
      "textLayout",
      {
        nativeEvent: { lines: [{ text: "primeira" }, { text: "segunda" }] }
      }
    );
    // The visible copy is always the last one (the measurement comes first when collapsed).
    const text = () =>
      within(screen.getByTestId("recorda-description"))
        .getAllByText(/Show I-N-C-R-I-V-E-L!/)
        .at(-1)!;

    expect(text().props.numberOfLines).toBe(1);
    expect(screen.queryByRole("button", { name: "Recolher descrição" })).toBeNull();

    fireEvent.press(text());
    expect(text().props.numberOfLines).toBeUndefined();
    // The expanded text scrolls instead of reacting to taps.
    fireEvent.press(text());
    expect(text().props.numberOfLines).toBeUndefined();

    fireEvent.press(screen.getByRole("button", { name: "Recolher descrição" }));
    expect(text().props.numberOfLines).toBe(1);
  });

  it("decides when a drag on the sheet handle dismisses it", () => {
    expect(shouldCloseCommentsSheet(40, 0.1, 300)).toBe(false);
    expect(shouldCloseCommentsSheet(120, 0.1, 300)).toBe(true);
    expect(shouldCloseCommentsSheet(20, 0.9, 300)).toBe(true);
  });

  it("handles a Recorda with no comments", async () => {
    mockRoute.params.postId = "post-4";
    renderScreen();
    fireEvent.press(screen.getByRole("button", { name: "Comentar" }));
    expect(screen.getByText(/Nenhum comentário ainda/)).toBeTruthy();
    fireEvent.changeText(screen.getByLabelText("Adicione um comentário..."), "Primeiro!");
    fireEvent.press(screen.getByRole("button", { name: "Enviar comentário" }));
    await waitFor(() => expect(screen.queryByText(/Nenhum comentário ainda/)).toBeNull());
    expect(screen.getByText(/Primeiro!/)).toBeTruthy();
  });

  it("loads and publishes API comments with username and text", async () => {
    const item: FeedItem = {
      author: { user_id: "user-2", username: "jane", profile_picture_url: null },
      created_at: "2026-01-01T12:00:00Z",
      description: "Show ao vivo",
      is_liked: false,
      likes_count: 1,
      media_type: "PHOTO",
      media_url: "https://cdn.example.com/live.jpg",
      recorda_id: "11111111-1111-4111-8111-111111111111",
      song_artist_name: "Artist",
      song_cover_url: "",
      song_preview_url: null,
      song_title: "Song"
    };
    const existing = {
      comment_id: "comment-1",
      user_id: "user-3",
      username: "ana",
      avatar_url: "/avatars/ana.jpg",
      content: "Eu estava lá!",
      created_at: "2026-09-27T12:00:00Z"
    };
    const created = { ...existing, comment_id: "comment-2", content: "Que saudade!" };
    getComments.mockResolvedValue([existing]);
    createComment.mockResolvedValue(created);
    mockRoute.params.postId = item.recorda_id;

    renderScreen(item);
    fireEvent.press(screen.getByText("Open API item"));
    fireEvent.press(screen.getByRole("button", { name: "Comentar" }));

    await waitFor(() => expect(screen.getByText(/Eu estava lá!/)).toBeTruthy());
    expect(getComments).toHaveBeenCalledWith(item.recorda_id, expect.any(AbortSignal));
    expect(screen.getByText("ana")).toBeTruthy();

    const input = screen.getByLabelText("Adicione um comentário...");
    expect(input.props.maxLength).toBe(500);
    fireEvent.changeText(input, " Que saudade! ");
    fireEvent.press(screen.getByRole("button", { name: "Enviar comentário" }));

    await waitFor(() => expect(screen.getByText(/Que saudade!/)).toBeTruthy());
    expect(createComment).toHaveBeenCalledWith(item.recorda_id, "Que saudade!");
    expect(input.props.value).toBe("");
  });

  it("opens an API video with its existing like count", () => {
    const item: FeedItem = {
      author: { user_id: "user-2", username: "jane_smith", profile_picture_url: null },
      created_at: "2026-01-01T12:00:00Z",
      description: "Show ao vivo",
      is_liked: true,
      likes_count: 12,
      media_type: "VIDEO",
      media_url: "https://cdn.example.com/live.mp4",
      recorda_id: "recorda-video",
      song_artist_name: "The American Dawn",
      song_cover_url: "https://cdn.example.com/cover.jpg",
      song_preview_url: null,
      song_title: "The Edge"
    };
    mockRoute.params.postId = item.recorda_id;
    renderScreen(item);
    fireEvent.press(screen.getByText("Open API item"));

    expect(screen.getByTestId("mock-video-view")).toBeTruthy();
    expect(mockUseVideoPlayer).toHaveBeenCalledWith({ uri: item.media_url }, expect.any(Function));
    // The loader covers the video until its first frame is ready.
    expect(screen.getByTestId("recorda-video-loading")).toBeTruthy();
    expect(screen.getByText("12 curtidas")).toBeTruthy();
    fireEvent.press(screen.getByRole("button", { name: "Curtir" }));
    expect(screen.getByText("11 curtidas")).toBeTruthy();

    fireEvent.press(screen.getByText("Open API item"));
    expect(screen.getByText("12 curtidas")).toBeTruthy();
  });

  it("persists API likes from the detail screen and updates its count", async () => {
    const recordaId = "11111111-1111-4111-8111-111111111111";
    const item: FeedItem = {
      author: { user_id: "user-2", username: "jane", profile_picture_url: null },
      created_at: "2026-01-01T12:00:00Z",
      description: "A memory",
      is_liked: false,
      likes_count: 8,
      media_type: "PHOTO",
      media_url: "https://cdn.example.com/photo.jpg",
      recorda_id: recordaId,
      song_artist_name: "Artist",
      song_cover_url: "",
      song_preview_url: null,
      song_title: "Song"
    };
    const setRecordaLike = jest
      .spyOn(feedService, "setRecordaLike")
      .mockResolvedValue({ is_liked: true, likes_count: 9 });
    mockRoute.params.postId = recordaId;
    renderScreen(item);
    fireEvent.press(screen.getByText("Open API item"));
    fireEvent.press(screen.getByRole("button", { name: "Curtir" }));

    await waitFor(() => expect(setRecordaLike).toHaveBeenCalledWith(recordaId, true));
    expect(screen.getByText("9 curtidas")).toBeTruthy();
  });

  it("loads a Recorda by id when there is no feed snapshot", async () => {
    const detail: RecordaDetailResponse = {
      author: { avatar_url: "/avatars/jane.jpg", user_id: "user-2", username: "jane" },
      created_at: "2026-05-10T12:00:00Z",
      deezer_track_id: "track-1",
      description: "Recorda aberta pela notificação",
      is_liked: false,
      likes_count: 7,
      media_type: "PHOTO",
      media_url: "/api/v1/recordas/media/notification.jpg",
      recorda_id: "recorda-notification",
      song_artist_name: "Artist",
      song_cover_url: "",
      song_preview_url: null,
      song_title: "Song"
    };
    getRecordaById.mockResolvedValue(detail);
    mockRoute.params.postId = detail.recorda_id;

    renderScreen();

    await waitFor(() => expect(screen.getByLabelText(detail.description!)).toBeTruthy());
    expect(getRecordaById).toHaveBeenCalledWith(detail.recorda_id, expect.any(AbortSignal));
    expect(screen.getAllByText("jane")).toHaveLength(2);
    expect(screen.getByText("7 curtidas")).toBeTruthy();
    expect(screen.getByTestId("remaining-posts")).toHaveTextContent(/recorda-notification/);
  });

  it("handles a failure loading a missing post without crashing", async () => {
    mockRoute.params.postId = "missing";
    renderScreen();

    await waitFor(() =>
      expect(screen.getByText("Não foi possível carregar o feed. Tente novamente.")).toBeTruthy()
    );
    fireEvent.press(screen.getByRole("button", { name: "Voltar" }));
    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });

  it.each(["RecordaShare", "RecordaReport"])(
    "makes pending integration explicit for %s",
    (name) => {
      mockRoute.name = name;
      render(
        <I18nextProvider i18n={i18n}>
          <RecordaIntegrationScreen />
        </I18nextProvider>
      );
      expect(screen.getByText(/ainda não está disponível/)).toBeTruthy();
      fireEvent.press(screen.getByRole("button", { name: "Voltar" }));
      expect(mockGoBack).toHaveBeenCalledTimes(1);
    }
  );

  it("synchronizes the audio preview for the opened Recorda", async () => {
    const detail: RecordaDetailResponse = {
      author: { avatar_url: "/avatars/jane.jpg", user_id: "user-2", username: "jane" },
      created_at: "2026-05-10T12:00:00Z",
      deezer_track_id: "track-1",
      description: "Recorda aberta pela notificação com áudio",
      is_liked: false,
      likes_count: 7,
      media_type: "PHOTO",
      media_url: "/api/v1/recordas/media/notification.jpg",
      recorda_id: "recorda-preview-notification",
      song_artist_name: "Artist",
      song_cover_url: "",
      song_preview_url: "https://cdn.example.com/notification-song.mp3",
      song_title: "Song"
    };
    getRecordaById.mockResolvedValue(detail);
    mockRoute.params.postId = detail.recorda_id;

    renderScreen();

    await waitFor(() =>
      expect(mockAudioPlayer.replace).toHaveBeenCalledWith(
        "https://cdn.example.com/notification-song.mp3"
      )
    );
  });
});

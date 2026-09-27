import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react-native";
import { I18nextProvider } from "react-i18next";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import { FeedProvider, PublishedRecordaScreen, RecordaIntegrationScreen } from "@/features/feed";
import { feedService } from "@/features/feed/services/feedService";
import { useFeed } from "@/features/feed/state/FeedContext";
import type { FeedItem, RecordaDetailResponse } from "@/features/feed/types";
import { i18n } from "@/i18n";

import { mockUseVideoPlayer, resetVideoMock } from "../../mocks/expoVideo";

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
          {item ? <OpenFeedItem item={item} /> : null}
          {item ? null : <PublishedRecordaScreen />}
          <FeedSnapshot />
        </FeedProvider>
      </QueryClientProvider>
    </I18nextProvider>
  );
}

describe("PublishedRecordaScreen", () => {
  let getRecordaById: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    resetVideoMock();
    mockRoute = { name: "PublishedRecorda", params: { postId: "post-1" } };
    getRecordaById = jest
      .spyOn(feedService, "getRecordaById")
      .mockRejectedValue(new Error("not found"));
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
    expect(
      within(screen.getByTestId("recorda-detail-screen")).getByText(/Estava d\+!/)
    ).toBeTruthy();
    expect(screen.getByText("Comentários")).toBeTruthy();
    expect(screen.queryByText(/Data da Memória|Local|Marcações/)).toBeNull();
    fireEvent.press(screen.getByRole("button", { name: "Voltar" }));
    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });

  it("keeps likes and comments in shared state", () => {
    renderScreen();
    const details = within(screen.getByTestId("recorda-detail-screen"));
    fireEvent.press(details.getByRole("button", { name: "Curtir" }));
    expect(screen.getByTestId("liked-posts")).toHaveTextContent("post-1");
    expect(details.getByText("13 curtidas")).toBeTruthy();
    fireEvent.press(details.getByRole("button", { name: "Curtir" }));
    expect(screen.getByTestId("liked-posts")).toHaveTextContent("");
    expect(details.getByText("12 curtidas")).toBeTruthy();

    const input = details.getByLabelText("Adicione um comentário...");
    expect(details.getByRole("button", { name: "Enviar comentário" })).toBeDisabled();
    fireEvent.changeText(input, "   ");
    expect(details.getByRole("button", { name: "Enviar comentário" })).toBeDisabled();
    fireEvent.changeText(input, "  Que lembrança boa!  ");
    fireEvent.press(details.getByRole("button", { name: "Enviar comentário" }));
    expect(details.getByText(/Que lembrança boa!/)).toBeTruthy();
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

  it("only offers Report for another author and passes the post id", () => {
    mockRoute.params.postId = "post-2";
    renderScreen();
    fireEvent.press(screen.getByRole("button", { name: "Mais opções" }));
    expect(screen.queryByText("Excluir")).toBeNull();
    fireEvent.press(screen.getByRole("button", { name: "Denunciar" }));
    expect(mockNavigate).toHaveBeenCalledWith("RecordaReport", { postId: "post-2" });
    expect(screen.getByTestId("remaining-posts")).toHaveTextContent(/post-2/);
  });

  it("opens the sharing destination with the selected Recorda", () => {
    renderScreen();
    fireEvent.press(screen.getByRole("button", { name: "Compartilhar" }));
    expect(mockNavigate).toHaveBeenCalledWith("RecordaShare", { postId: "post-1" });
  });

  it("handles a Recorda with no comments", () => {
    mockRoute.params.postId = "post-4";
    renderScreen();
    expect(screen.getByText(/Nenhum comentário ainda/)).toBeTruthy();
    fireEvent.changeText(screen.getByLabelText("Adicione um comentário..."), "Primeiro!");
    fireEvent.press(screen.getByRole("button", { name: "Enviar comentário" }));
    expect(screen.queryByText(/Nenhum comentário ainda/)).toBeNull();
    expect(screen.getByText(/Primeiro!/)).toBeTruthy();
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
    expect(mockUseVideoPlayer).toHaveBeenCalledWith(item.media_url, expect.any(Function));
    expect(screen.getByText("12 curtidas")).toBeTruthy();
    fireEvent.press(screen.getByRole("button", { name: "Curtir" }));
    expect(screen.getByText("11 curtidas")).toBeTruthy();

    fireEvent.press(screen.getByText("Open API item"));
    expect(screen.getByText("11 curtidas")).toBeTruthy();
  });

  it("loads a Recorda by id when there is no feed snapshot", async () => {
    const detail: RecordaDetailResponse = {
      author: { avatar_url: "/avatars/jane.jpg", user_id: "user-2", username: "jane" },
      created_at: "2026-05-10T12:00:00Z",
      deezer_track_id: "track-1",
      description: "Recorda aberta pela notificação",
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
});

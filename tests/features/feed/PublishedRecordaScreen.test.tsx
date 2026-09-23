import { fireEvent, render, screen, within } from "@testing-library/react-native";
import { I18nextProvider } from "react-i18next";
import { Text, View } from "react-native";

import {
  FeedProvider,
  PublishedRecordaScreen,
  RecordaIntegrationScreen
} from "@/features/feed";
import { useFeed } from "@/features/feed/state/FeedContext";
import { i18n } from "@/i18n";

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
let mockRoute = { name: "PublishedRecorda", params: { postId: "post-1" } };

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
      <Text testID="shared-comments">{posts[0]?.comments.map((comment) => comment.text).join(",")}</Text>
    </View>
  );
}

function renderScreen() {
  return render(
    <I18nextProvider i18n={i18n}>
      <FeedProvider>
        <PublishedRecordaScreen />
        <FeedSnapshot />
      </FeedProvider>
    </I18nextProvider>
  );
}

describe("PublishedRecordaScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRoute = { name: "PublishedRecorda", params: { postId: "post-1" } };
  });

  it("shows the expanded post, publication date and comments", () => {
    renderScreen();
    expect(screen.getByLabelText("Show I-N-C-R-I-V-E-L!")).toBeTruthy();
    expect(screen.getByText("The Edge")).toBeTruthy();
    expect(screen.getByText(/The American Dawn/)).toBeTruthy();
    expect(screen.getByText("01 de janeiro")).toBeTruthy();
    expect(screen.getByText(/Estava d\+!/)).toBeTruthy();
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
    expect(screen.getByTestId("shared-comments")).toHaveTextContent("Que lembrança boa!");
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

  it("handles missing or deleted posts without crashing", () => {
    mockRoute.params.postId = "missing";
    renderScreen();
    expect(screen.getByText("Esta Recorda não está mais disponível.")).toBeTruthy();
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

import { reportService } from "@/features/moderation/services/reportService";
import { authApiClient } from "@/services/api";

jest.mock("@/services/api", () => ({
  authApiClient: { post: jest.fn() }
}));

const mockPost = authApiClient.post as jest.Mock;

const CREATED = {
  created_at: "2026-10-05T18:30:00Z",
  report_id: "11111111-1111-4111-8111-111111111111",
  status: "OPEN"
};

beforeEach(() => {
  mockPost.mockReset();
  mockPost.mockResolvedValue(CREATED);
});

// Este service é o contrato com as tasks de backend #80 e #81: quando as rotas
// existirem, é por aqui que o modal fala com elas. Os testes travam path, body
// e a regra de descrição vazia.
describe("reportService", () => {
  it("reports a Recorda through POST and returns the created report", async () => {
    await expect(reportService.reportRecorda("recorda-1", "conteudo ofensivo")).resolves.toEqual(
      CREATED
    );
    expect(mockPost).toHaveBeenCalledWith("/recordas/recorda-1/reports", {
      description: "conteudo ofensivo"
    });
  });

  it("reports a profile through POST and returns the created report", async () => {
    await expect(reportService.reportUser("user-1", "perfil falso")).resolves.toEqual(CREATED);
    expect(mockPost).toHaveBeenCalledWith("/users/user-1/reports", {
      description: "perfil falso"
    });
  });

  it.each([
    ["an empty string", ""],
    ["only spaces", "   "],
    ["only line breaks and tabs", "\n\t  \n"]
  ])("sends description null when the field has %s", async (_label, description) => {
    await reportService.reportRecorda("recorda-1", description);
    await reportService.reportUser("user-1", description);

    expect(mockPost.mock.calls[0][1]).toEqual({ description: null });
    expect(mockPost.mock.calls[1][1]).toEqual({ description: null });
  });

  it("keeps a real description exactly as typed, without trimming", async () => {
    await reportService.reportRecorda("recorda-1", "  texto com espacos  ");

    expect(mockPost).toHaveBeenCalledWith("/recordas/recorda-1/reports", {
      description: "  texto com espacos  "
    });
  });

  it.each([
    [
      "reportRecorda",
      () => reportService.reportRecorda("a/b?c", "x"),
      "/recordas/a%2Fb%3Fc/reports"
    ],
    ["reportUser", () => reportService.reportUser("a/b?c", "x"), "/users/a%2Fb%3Fc/reports"]
  ])("percent-encodes the id on %s", async (_label, call, expectedPath) => {
    await call();

    expect(mockPost.mock.calls[0][0]).toBe(expectedPath);
  });
});

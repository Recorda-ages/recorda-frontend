import { notifyManager, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { I18nextProvider } from "react-i18next";
import { Pressable, Text } from "react-native";
import { PaperProvider } from "react-native-paper";

import { useReportDialog } from "@/features/moderation/hooks/useReportDialog";
import { reportService } from "@/features/moderation/services/reportService";
import type { ReportCreatedResponse } from "@/features/moderation/types";
import { i18n } from "@/i18n";
import { ApiError } from "@/services/api";
import { paperTheme } from "@/theme";

jest.mock("@/features/moderation/services/reportService", () => ({
  reportService: { reportRecorda: jest.fn(), reportUser: jest.fn() }
}));

const mockReportRecorda = reportService.reportRecorda as jest.Mock;
const mockReportUser = reportService.reportUser as jest.Mock;

notifyManager.setScheduler((callback) => callback());

const RECORDA_ID = "11111111-1111-4111-8111-111111111111";
const USER_ID = "22222222-2222-4222-8222-222222222222";

const CREATED: ReportCreatedResponse = {
  created_at: "2026-10-05T18:30:00Z",
  report_id: "33333333-3333-4333-8333-333333333333",
  status: "OPEN"
};

const RECORDA_TITLE = "Denunciar Recorda";
const USER_TITLE = "Denunciar perfil";
const MESSAGE = "Conte por que você está denunciando. A moderação avaliará sua denúncia.";
const DESCRIPTION_LABEL = "Descrição (opcional)";
const PLACEHOLDER = "Escreva uma descrição";
const SUBMIT = "Denunciar";
const CANCEL = "Cancelar";
const SUCCESS = "Denúncia enviada. Obrigado por ajudar a comunidade.";
const DUPLICATE = "Você já denunciou este conteúdo.";
const UNAVAILABLE = "Este conteúdo não está mais disponível.";
const GENERIC_ERROR = "Não foi possível enviar a denúncia. Tente novamente.";

const clients: QueryClient[] = [];

function Harness() {
  const { openReport, reportDialog } = useReportDialog();

  return (
    <>
      <Pressable onPress={() => openReport({ recordaId: RECORDA_ID, type: "RECORDA" })}>
        <Text>abrir-recorda</Text>
      </Pressable>
      <Pressable onPress={() => openReport({ type: "USER", userId: USER_ID })}>
        <Text>abrir-perfil</Text>
      </Pressable>
      {reportDialog}
    </>
  );
}

function renderHarness() {
  const client = new QueryClient({ defaultOptions: { mutations: { gcTime: 0, retry: false } } });
  clients.push(client);

  return render(
    <QueryClientProvider client={client}>
      <I18nextProvider i18n={i18n}>
        <PaperProvider theme={paperTheme}>
          <Harness />
        </PaperProvider>
      </I18nextProvider>
    </QueryClientProvider>
  );
}

function openRecordaDialog() {
  fireEvent.press(screen.getByText("abrir-recorda"));
}

function field() {
  return screen.getByPlaceholderText(PLACEHOLDER);
}

function submitButton() {
  return screen.getByRole("button", { name: SUBMIT });
}

function cancelButton() {
  return screen.getByRole("button", { name: CANCEL });
}

function apiError(status: number) {
  return new ApiError("REQUEST_FAILED", "The API request failed.", status, null);
}

function deferred<T>() {
  let resolve: (value: T) => void = () => undefined;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });

  return { promise, resolve };
}

beforeEach(() => {
  mockReportRecorda.mockReset();
  mockReportUser.mockReset();
  mockReportRecorda.mockResolvedValue(CREATED);
  mockReportUser.mockResolvedValue(CREATED);
});

afterEach(async () => {
  clients.forEach((client) => client.clear());
  clients.length = 0;
  await i18n.changeLanguage("pt-BR");
});

describe("ReportDialog", () => {
  // US 40: denúncia genérica, sem lista de motivos.
  it("shows only the description and the two actions", () => {
    renderHarness();
    openRecordaDialog();

    expect(screen.getByText(RECORDA_TITLE)).toBeTruthy();
    expect(screen.getByText(MESSAGE)).toBeTruthy();
    expect(screen.getByText(DESCRIPTION_LABEL)).toBeTruthy();
    expect(field()).toBeTruthy();
    expect(screen.getAllByRole("button")).toHaveLength(2);
  });

  it.each([
    [
      "pt-BR",
      "Denunciar Recorda",
      "Conte por que você está denunciando. A moderação avaliará sua denúncia.",
      "Descrição (opcional)"
    ],
    [
      "en",
      "Report Recorda",
      "Tell us why you are reporting this. Moderation will review your report.",
      "Description (optional)"
    ],
    [
      "es",
      "Denunciar Recorda",
      "Cuéntanos por qué haces esta denuncia. El equipo de moderación revisará tu denuncia.",
      "Descripción (opcional)"
    ]
  ])("localizes the Recorda dialog in %s", async (language, title, message, label) => {
    await i18n.changeLanguage(language);
    renderHarness();
    openRecordaDialog();

    expect(screen.getByText(title)).toBeTruthy();
    expect(screen.getByText(message)).toBeTruthy();
    expect(screen.getByText(label)).toBeTruthy();
  });

  it("sends the report with an untouched description", async () => {
    renderHarness();
    openRecordaDialog();

    fireEvent.press(submitButton());

    await waitFor(() => expect(mockReportRecorda).toHaveBeenCalledTimes(1));
    // A conversão de vazio para `null` é do reportService, exercitada no teste dele.
    expect(mockReportRecorda).toHaveBeenCalledWith(RECORDA_ID, "");
  });

  it("keeps the character counter in sync with the typed text", () => {
    renderHarness();
    openRecordaDialog();

    expect(screen.getByText("0/500")).toBeTruthy();

    fireEvent.changeText(field(), "abc");

    expect(screen.getByText("3/500")).toBeTruthy();
  });

  // O corte em 500 é comportamento nativo do TextInput, que o `changeText` do
  // RNTL não aplica: aqui travamos a prop, e o corte real é verificado à mão.
  it("caps the description at 500 characters", () => {
    renderHarness();
    openRecordaDialog();

    expect(field().props.maxLength).toBe(500);
  });

  it("sends a single request when submit is pressed twice", async () => {
    const pending = deferred<ReportCreatedResponse>();
    mockReportRecorda.mockReturnValue(pending.promise);
    renderHarness();
    openRecordaDialog();

    fireEvent.press(submitButton());
    fireEvent.press(submitButton());

    await act(async () => {
      pending.resolve(CREATED);
    });

    // Esperar o fluxo terminar antes de contar: se o segundo toque tivesse
    // passado, a segunda chamada já teria aparecido aqui.
    await waitFor(() => expect(screen.getByText(SUCCESS)).toBeTruthy());
    expect(mockReportRecorda).toHaveBeenCalledTimes(1);
  });

  it("disables both actions while the report is in flight", async () => {
    const pending = deferred<ReportCreatedResponse>();
    mockReportRecorda.mockReturnValue(pending.promise);
    renderHarness();
    openRecordaDialog();

    fireEvent.press(submitButton());

    expect(submitButton().props.accessibilityState).toMatchObject({
      busy: true,
      disabled: true
    });
    expect(cancelButton().props.accessibilityState).toMatchObject({ disabled: true });

    await act(async () => {
      pending.resolve(CREATED);
    });
  });

  it("closes, clears the field and thanks the user on 201", async () => {
    renderHarness();
    openRecordaDialog();
    fireEvent.changeText(field(), "texto");

    fireEvent.press(submitButton());

    await waitFor(() => expect(screen.getByText(SUCCESS)).toBeTruthy());
    expect(screen.queryByText(RECORDA_TITLE)).toBeNull();

    openRecordaDialog();
    expect(field().props.value).toBe("");
    expect(screen.queryByText(SUCCESS)).toBeNull();
  });

  it("closes with an informative message on 409", async () => {
    mockReportRecorda.mockRejectedValue(apiError(409));
    renderHarness();
    openRecordaDialog();
    fireEvent.changeText(field(), "texto");

    fireEvent.press(submitButton());

    await waitFor(() => expect(screen.getByText(DUPLICATE)).toBeTruthy());
    expect(screen.queryByText(RECORDA_TITLE)).toBeNull();
    expect(screen.queryByText(GENERIC_ERROR)).toBeNull();
  });

  it.each([[403], [404]])("closes reporting the target is gone on %i", async (status) => {
    mockReportRecorda.mockRejectedValue(apiError(status));
    renderHarness();
    openRecordaDialog();

    fireEvent.press(submitButton());

    await waitFor(() => expect(screen.getByText(UNAVAILABLE)).toBeTruthy());
    expect(screen.queryByText(RECORDA_TITLE)).toBeNull();
  });

  it("keeps the dialog and the typed text on a network failure", async () => {
    mockReportRecorda.mockRejectedValue(
      new ApiError("NETWORK_ERROR", "Unable to reach the API.", 0, null)
    );
    renderHarness();
    openRecordaDialog();
    fireEvent.changeText(field(), "texto digitado");

    fireEvent.press(submitButton());

    await waitFor(() => expect(screen.getByText(GENERIC_ERROR)).toBeTruthy());
    expect(screen.getByText(RECORDA_TITLE)).toBeTruthy();
    expect(field().props.value).toBe("texto digitado");
    expect(screen.queryByText(SUCCESS)).toBeNull();
  });

  it("submits again as a retry after a recoverable failure", async () => {
    mockReportRecorda
      .mockRejectedValueOnce(new ApiError("NETWORK_ERROR", "Unable to reach the API.", 0, null))
      .mockResolvedValueOnce(CREATED);
    renderHarness();
    openRecordaDialog();
    fireEvent.changeText(field(), "texto digitado");

    fireEvent.press(submitButton());
    await waitFor(() => expect(screen.getByText(GENERIC_ERROR)).toBeTruthy());

    fireEvent.press(submitButton());

    await waitFor(() => expect(screen.getByText(SUCCESS)).toBeTruthy());
    expect(mockReportRecorda).toHaveBeenCalledTimes(2);
    expect(mockReportRecorda).toHaveBeenLastCalledWith(RECORDA_ID, "texto digitado");
  });

  it.each([[408], [500]])("keeps the dialog open on %i", async (status) => {
    mockReportRecorda.mockRejectedValue(apiError(status));
    renderHarness();
    openRecordaDialog();
    fireEvent.changeText(field(), "texto");

    fireEvent.press(submitButton());

    await waitFor(() => expect(screen.getByText(GENERIC_ERROR)).toBeTruthy());
    expect(screen.getByText(RECORDA_TITLE)).toBeTruthy();
    expect(field().props.value).toBe("texto");
  });

  // 400, 401 e 422 não têm UX própria nesta task: caem no mesmo ramo recuperável.
  it.each([[400], [401], [422]])("falls back to the recoverable branch on %i", async (status) => {
    mockReportRecorda.mockRejectedValue(apiError(status));
    renderHarness();
    openRecordaDialog();

    fireEvent.press(submitButton());

    await waitFor(() => expect(screen.getByText(GENERIC_ERROR)).toBeTruthy());
    expect(screen.getByText(RECORDA_TITLE)).toBeTruthy();
  });

  it("closes without any request when cancelled", () => {
    renderHarness();
    openRecordaDialog();
    fireEvent.changeText(field(), "texto");

    fireEvent.press(cancelButton());

    expect(screen.queryByText(RECORDA_TITLE)).toBeNull();
    expect(mockReportRecorda).not.toHaveBeenCalled();

    openRecordaDialog();
    expect(field().props.value).toBe("");
  });

  it("uses the target-specific title and picks the endpoint by type", async () => {
    renderHarness();

    openRecordaDialog();
    expect(screen.getByText(RECORDA_TITLE)).toBeTruthy();
    fireEvent.press(cancelButton());

    fireEvent.press(screen.getByText("abrir-perfil"));
    expect(screen.getByText(USER_TITLE)).toBeTruthy();

    fireEvent.press(submitButton());

    await waitFor(() => expect(mockReportUser).toHaveBeenCalledWith(USER_ID, ""));
    expect(mockReportRecorda).not.toHaveBeenCalled();
  });
});

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import type { ReactNode } from "react";
import { I18nextProvider } from "react-i18next";
import { PaperProvider } from "react-native-paper";

import { AUTH_ME_QUERY_KEY } from "@/features/auth/api/getCurrentUser";
import { RetrospectiveFlow } from "@/features/memories-retrospective/components/RetrospectiveFlow";
import { retrospectiveServiceMock } from "@/features/memories-retrospective/mocks/retrospectiveMock";
import { retrospectiveService } from "@/features/memories-retrospective/services/retrospectiveService";
import { ApiError } from "@/services/api";
import { i18n } from "@/i18n";
import { paperTheme } from "@/theme";

import { resetAudioMock } from "../../mocks/expoAudio";

jest.mock("expo-linear-gradient", () => {
  const { View } = jest.requireActual("react-native");
  return { LinearGradient: View };
});

jest.mock("@/features/memories-retrospective/services/retrospectiveService", () => ({
  retrospectiveService: { getAvailablePeriods: jest.fn(), getRetrospective: jest.fn() }
}));

const getPeriods = jest.mocked(retrospectiveService.getAvailablePeriods);
const getDetails = jest.mocked(retrospectiveService.getRetrospective);

let client: QueryClient;

function Providers({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <QueryClientProvider client={client}>
      <I18nextProvider i18n={i18n}>
        <PaperProvider theme={paperTheme}>{children}</PaperProvider>
      </I18nextProvider>
    </QueryClientProvider>
  );
}

function renderFlow(onClose = jest.fn()) {
  render(<RetrospectiveFlow onClose={onClose} visible />, { wrapper: Providers });
  return { onClose };
}

beforeEach(() => {
  resetAudioMock();
  client = new QueryClient({ defaultOptions: { queries: { retryDelay: 0 } } });
  client.setQueryData(AUTH_ME_QUERY_KEY, { user_id: "user-1" });
  getPeriods.mockReset().mockImplementation(retrospectiveServiceMock.getAvailablePeriods);
  getDetails.mockReset().mockImplementation(retrospectiveServiceMock.getRetrospective);
});

afterEach(() => client.clear());

it("lists monthly and yearly periods and opens the one picked", async () => {
  renderFlow();

  expect(await screen.findByTestId("retrospective-period-MONTHLY-2026-11")).toBeTruthy();
  expect(screen.getByText("Prévia")).toBeTruthy();
  expect(screen.getAllByText(/Anual/).length).toBeGreaterThan(0);
  expect(screen.getAllByText(/Mensal/).length).toBeGreaterThan(0);

  fireEvent.press(screen.getByTestId("retrospective-period-MONTHLY-2026-11"));

  expect(await screen.findByTestId("retrospective-screen")).toBeTruthy();
  expect(getDetails).toHaveBeenCalledWith(
    { month: 11, period_type: "MONTHLY", year: 2026 },
    expect.anything()
  );
  expect(screen.getByText("3 Recordas")).toBeTruthy();
});

it("opens a yearly retrospective from the list", async () => {
  renderFlow();
  const yearly = (await screen.findAllByTestId(/^retrospective-period-YEARLY-/))[0];

  fireEvent.press(yearly);

  expect(await screen.findByTestId("retrospective-screen")).toBeTruthy();
  expect(getDetails.mock.calls[0][0].period_type).toBe("YEARLY");
});

it("skips the list when there is a single period", async () => {
  getPeriods.mockResolvedValue({
    periods: [
      {
        is_preview: false,
        label: "Outubro 2026",
        month: 10,
        period_type: "MONTHLY",
        total_memories: 12,
        year: 2026
      }
    ]
  });
  renderFlow();

  expect(await screen.findByTestId("retrospective-screen")).toBeTruthy();
  expect(screen.queryByTestId("retrospective-flow")).toBeNull();
});

it("ends the story on the shareable summary", async () => {
  renderFlow();
  fireEvent.press(await screen.findByTestId("retrospective-period-MONTHLY-2026-11"));
  await screen.findByTestId("retrospective-screen");

  for (let step = 1; step <= 5; step += 1) {
    fireEvent.press(screen.getByLabelText("Próximo slide"));
  }

  expect(screen.getByText("Etapa 6 de 6")).toBeTruthy();
  expect(screen.getByTestId("retrospective-summary")).toBeTruthy();
  expect(screen.getByTestId("retrospective-summary-share")).toBeTruthy();
});

it("tells the user when there is no retrospective yet", async () => {
  getPeriods.mockResolvedValue({ periods: [] });
  renderFlow();

  expect(
    await screen.findByText("Suas retrospectivas aparecem aqui depois que você publicar Recordas.")
  ).toBeTruthy();
});

it("shows an error with retry when the periods fail to load", async () => {
  getPeriods.mockRejectedValue(new ApiError("SERVER", "boom", 500, null));
  renderFlow();

  expect(await screen.findByText("Não foi possível carregar suas retrospectivas.")).toBeTruthy();
  getPeriods.mockImplementation(retrospectiveServiceMock.getAvailablePeriods);
  fireEvent.press(screen.getByText("Tentar novamente"));

  expect(await screen.findByTestId("retrospective-period-MONTHLY-2026-11")).toBeTruthy();
});

it("lets the user retry or choose another period when the details fail", async () => {
  getDetails.mockRejectedValue(new ApiError("SERVER", "boom", 500, null));
  renderFlow();
  fireEvent.press(await screen.findByTestId("retrospective-period-MONTHLY-2026-11"));

  expect(await screen.findByText("Não foi possível carregar esta retrospectiva.")).toBeTruthy();
  fireEvent.press(screen.getByText("Escolher outro período"));
  expect(await screen.findByTestId("retrospective-period-MONTHLY-2026-10")).toBeTruthy();
});

it("handles a period that turns out to be empty", async () => {
  getDetails.mockResolvedValueOnce(null);
  renderFlow();
  fireEvent.press(await screen.findByTestId("retrospective-period-MONTHLY-2026-11"));

  expect(await screen.findByText("Não há Recordas neste período.")).toBeTruthy();
  fireEvent.press(screen.getByText("Escolher outro período"));
  expect(await screen.findByTestId("retrospective-period-MONTHLY-2026-10")).toBeTruthy();
});

it("closes from the backdrop and the close button", async () => {
  const { onClose } = renderFlow();
  await screen.findByTestId("retrospective-period-MONTHLY-2026-11");

  fireEvent.press(screen.getByTestId("retrospective-flow-backdrop"));
  fireEvent.press(screen.getByTestId("retrospective-flow-close"));

  expect(onClose).toHaveBeenCalledTimes(2);
});

it("renders nothing while not visible", async () => {
  render(<RetrospectiveFlow onClose={jest.fn()} visible={false} />, { wrapper: Providers });
  await act(async () => undefined);

  expect(screen.queryByTestId("retrospective-flow")).toBeNull();
  expect(getDetails).not.toHaveBeenCalled();
  await waitFor(() => expect(screen.queryByTestId("retrospective-screen")).toBeNull());
});

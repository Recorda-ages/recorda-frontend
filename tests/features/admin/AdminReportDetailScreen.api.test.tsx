import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";
import { I18nextProvider } from "react-i18next";
import { PaperProvider } from "react-native-paper";

import { AdminReportDetailScreen } from "@/features/admin/reports/screens/AdminReportDetailScreen";
import { ADMIN_REPORTS_QUERY_KEY } from "@/features/admin/reports/hooks/useAdminReportGroups";
import type { AdminReportDetailResponse, AdminTargetType } from "@/features/admin/types";
import { AUTH_ME_QUERY_KEY } from "@/features/auth/api/getCurrentUser";
import { i18n } from "@/i18n";
import { AUTH_TOKEN_QUERY_KEY } from "@/services/api";
import { secureStorage } from "@/services/storage";
import { ToastProvider } from "@/components/ui/ToastProvider";
import { paperTheme } from "@/theme";

import { mockUseVideoPlayer, resetVideoMock } from "../../mocks/expoVideo";

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ canGoBack: () => true, goBack: jest.fn(), navigate: jest.fn() })
}));
jest.mock("@/services/storage", () => ({
  secureStorage: { getItem: jest.fn(), removeItem: jest.fn(), setItem: jest.fn() }
}));

const fetchMock = jest.fn();
const API = "http://localhost:8000/api/v1/admin/reports";
const date = "2026-10-05T12:00:00Z";
const account = {
  deleted_at: null,
  profile_picture_url: "/api/v1/media/avatar.jpg",
  status: "ACTIVE" as const,
  user_id: "user-1",
  username: "marina"
};

function detail(type: AdminTargetType = "RECORDA", video = false): AdminReportDetailResponse {
  const common = {
    actions: [],
    reports: [
      {
        created_at: date,
        description: "Denúncia real",
        report_id: "report-1",
        reporter: { user_id: "reporter-1", username: "paulo" },
        resolved_at: null,
        status: "OPEN" as const
      }
    ]
  };
  if (type === "USER")
    return {
      ...common,
      target_type: type,
      target: {
        ...account,
        created_at: date,
        email: "marina@example.com",
        is_private: true,
        name: "Marina"
      }
    };
  return {
    ...common,
    target_type: type,
    target: {
      author: account,
      created_at: date,
      deleted_at: null,
      description: "Memória denunciada",
      media_type: video ? "VIDEO" : "PHOTO",
      media_url: `/api/v1/media/recorda.${video ? "mp4" : "jpg"}`,
      recorda_id: "target-1",
      song_artist_name: "Dua Lipa",
      song_cover_url: "https://cdn.example.com/cover.jpg",
      song_title: "Levitating"
    }
  };
}

function response(status: number, body: unknown) {
  return {
    headers: { get: () => "application/json" },
    json: async () => body,
    ok: status < 300,
    status
  };
}

function renderDetail(type: AdminTargetType = "RECORDA") {
  const client = new QueryClient({
    defaultOptions: { queries: { gcTime: Infinity }, mutations: { gcTime: Infinity } }
  });
  client.setQueryData(AUTH_TOKEN_QUERY_KEY, "token-abc");
  client.setQueryData(AUTH_ME_QUERY_KEY, { role: "ADMIN", user_id: "admin-1" });
  render(
    <QueryClientProvider client={client}>
      <I18nextProvider i18n={i18n}>
        <PaperProvider theme={paperTheme}>
          <ToastProvider>
            <AdminReportDetailScreen targetType={type} targetId="target-1" />
          </ToastProvider>
        </PaperProvider>
      </I18nextProvider>
    </QueryClientProvider>
  );
  return client;
}

async function submit(reason = "  Confirmado.  ", status = "Resolver") {
  fireEvent.press(
    await screen.findByRole("button", {
      name: status === "Resolver" ? "Marcar como resolvida" : "Descartar denúncia"
    })
  );
  fireEvent.changeText(screen.getByLabelText("Motivo"), reason);
  fireEvent.press(screen.getByRole("button", { name: status }));
}

beforeEach(() => {
  jest.restoreAllMocks();
  fetchMock.mockReset();
  globalThis.fetch = fetchMock as unknown as typeof fetch;
  (secureStorage.getItem as jest.Mock).mockResolvedValue("token-abc");
  resetVideoMock();
});

it.each([false, true])(
  "loads Recorda media through the real service (video: %s)",
  async (video) => {
    fetchMock.mockResolvedValue(response(200, detail("RECORDA", video)));
    renderDetail();
    await screen.findByText("Levitating");
    expect(screen.getByText("Dua Lipa")).toBeTruthy();
    expect(screen.getByText("@paulo")).toBeTruthy();
    expect(screen.getByText("Denúncia real")).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledWith(
      `${API}/RECORDA/target-1`,
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({ Authorization: "Bearer token-abc" })
      })
    );
    const source = {
      uri: `http://localhost:8000/api/v1/media/recorda.${video ? "mp4" : "jpg"}`,
      headers: { Authorization: "Bearer token-abc" }
    };
    if (video) {
      expect(mockUseVideoPlayer).toHaveBeenLastCalledWith(source, expect.any(Function));
      const player = mockUseVideoPlayer.mock.results.at(-1)?.value;
      expect(player.muted).toBe(true);
      expect(player.play).not.toHaveBeenCalled();
    } else expect(screen.getByTestId("admin-report-photo").props.source).toEqual([source]);
  }
);

it("loads the reported profile", async () => {
  fetchMock.mockResolvedValue(response(200, detail("USER")));
  renderDetail("USER");
  expect(await screen.findByText("marina@example.com")).toBeTruthy();
  expect(screen.getByText("Marina")).toBeTruthy();
  expect(screen.getByText("Denúncia real")).toBeTruthy();
});

it.each(["RESOLVED", "DISMISSED"] as const)(
  "sends %s and refreshes detail, history and cached lists",
  async (status) => {
    const updated = detail();
    updated.reports[0].status = status;
    updated.reports[0].resolved_at = date;
    updated.actions.push({
      action_id: "action-1",
      action_type: "CHANGE_REPORT_STATUS",
      admin: { user_id: "admin-1", username: "admin" },
      created_at: date,
      reason: "Confirmado.",
      details: { from: "OPEN", to: status, report_count: 1 },
      target_label: "Levitating",
      target_recorda_id: "target-1",
      target_user_id: null
    });
    fetchMock
      .mockResolvedValueOnce(response(200, detail()))
      .mockResolvedValueOnce(response(200, { updated_count: 1, status }))
      .mockResolvedValue(response(200, updated));
    const client = renderDetail();
    const listKey = [...ADMIN_REPORTS_QUERY_KEY, "admin-1", { status: "OPEN" }];
    client.setQueryData(listKey, { pages: [{ items: [{ targetId: "target-1" }] }] });
    await submit(undefined, status === "RESOLVED" ? "Resolver" : "Descartar");
    expect(
      await screen.findByText(
        status === "RESOLVED" ? "Denúncias marcadas como resolvidas." : "Denúncias descartadas."
      )
    ).toBeTruthy();
    expect(fetchMock.mock.calls[1]).toEqual([
      `${API}/RECORDA/target-1/status`,
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ reason: "Confirmado.", status }),
        headers: expect.objectContaining({ Authorization: "Bearer token-abc" })
      })
    ]);
    expect(await screen.findByText("Motivo: Confirmado.")).toBeTruthy();
    expect(client.getQueryState(listKey)?.isInvalidated).toBe(true);
    expect(screen.getByRole("button", { name: "Reabrir denúncias" })).toBeTruthy();
  }
);

it("reloads the server state on 409 and warns the administrator", async () => {
  const alert = jest.spyOn(Alert, "alert").mockImplementation(() => undefined);
  const updated = detail();
  updated.reports[0].status = "RESOLVED";
  fetchMock
    .mockResolvedValueOnce(response(200, detail()))
    .mockResolvedValueOnce(
      response(409, {
        error: {
          code: "CONFLICT",
          message: "Não há denúncias neste status para alterar.",
          details: {}
        }
      })
    )
    .mockResolvedValue(response(200, updated));
  renderDetail();
  await submit();
  await waitFor(() =>
    expect(alert).toHaveBeenCalledWith("Este conteúdo já foi tratado", expect.any(String))
  );
  expect(await screen.findByRole("button", { name: "Reabrir denúncias" })).toBeTruthy();
  expect(fetchMock).toHaveBeenCalledTimes(3);
});

it("preserves the reason on 422 and allows correction and resubmission", async () => {
  fetchMock
    .mockResolvedValueOnce(response(200, detail()))
    .mockResolvedValueOnce(
      response(422, {
        error: {
          code: "VALIDATION_ERROR",
          message: "Dados inválidos",
          details: { fields: [{ field: "reason", message: "Motivo inválido" }] }
        }
      })
    )
    .mockResolvedValueOnce(response(200, { updated_count: 1, status: "RESOLVED" }))
    .mockResolvedValue(response(200, detail()));
  renderDetail();
  await submit();
  expect(await screen.findByText("Informe um motivo de 1 a 500 caracteres.")).toBeTruthy();
  expect(screen.getByLabelText("Motivo").props.value).toBe("  Confirmado.  ");
  expect(fetchMock).toHaveBeenCalledTimes(2);
  fireEvent.changeText(screen.getByLabelText("Motivo"), "Motivo corrigido.");
  fireEvent.press(screen.getByRole("button", { name: "Resolver" }));
  expect(await screen.findByText("Denúncias marcadas como resolvidas.")).toBeTruthy();
});

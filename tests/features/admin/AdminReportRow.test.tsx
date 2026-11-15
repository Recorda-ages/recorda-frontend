import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { I18nextProvider } from "react-i18next";
import { PaperProvider } from "react-native-paper";

import { AdminReportRow } from "@/features/admin/reports/components/AdminReportRow";
import { formatReportDate } from "@/features/admin/reports/formatReportDate";
import type { AdminReportGroup } from "@/features/admin/types";
import { i18n } from "@/i18n";
import { AUTH_TOKEN_QUERY_KEY } from "@/services/api";
import { paperTheme } from "@/theme";

const GROUP: AdminReportGroup = {
  contentSummary: "Usuário Um",
  imageUrl: null,
  latestReportedAt: "2026-09-27T12:00:00Z",
  latestReporterUsername: "ana",
  openReportCount: 1,
  status: "RESOLVED",
  targetId: "user-1",
  targetLabel: "Usuário Um",
  targetType: "USER",
  targetUsername: "usuario1"
};

function renderRow(item: AdminReportGroup, onPress = jest.fn()) {
  const client = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity } } });
  client.setQueryData(AUTH_TOKEN_QUERY_KEY, null);
  render(
    <QueryClientProvider client={client}>
      <I18nextProvider i18n={i18n}>
        <PaperProvider theme={paperTheme}>
          <AdminReportRow item={item} onPress={onPress} />
        </PaperProvider>
      </I18nextProvider>
    </QueryClientProvider>
  );
  return onPress;
}

describe("AdminReportRow", () => {
  it("renders the type, status, count, target and who reported last", () => {
    renderRow(GROUP);

    expect(screen.getByText("PERFIL")).toBeTruthy();
    expect(screen.getByText("RESOLVIDA")).toBeTruthy();
    expect(screen.getByText("1 denúncia")).toBeTruthy();
    expect(screen.getByText("@usuario1 — Usuário Um")).toBeTruthy();
    expect(screen.getByText("Por @ana • 27/09/2026")).toBeTruthy();
  });

  it("describes the whole row for screen readers", () => {
    renderRow({ ...GROUP, status: "DISMISSED" });

    expect(
      screen.getByRole("button", { name: "Perfil, Descartada, 1 denúncia: @usuario1 — Usuário Um" })
    ).toBeTruthy();
  });

  it("falls back to the content and the date when username or reporter are missing", () => {
    renderRow({ ...GROUP, latestReporterUsername: undefined, targetUsername: "" });

    expect(screen.getByText("Usuário Um")).toBeTruthy();
    expect(screen.getByText("27/09/2026")).toBeTruthy();
  });

  it("calls onPress with the group", () => {
    const onPress = renderRow(GROUP);

    fireEvent.press(screen.getByTestId("admin-report-row-USER-user-1"));

    expect(onPress).toHaveBeenCalledWith(GROUP);
  });

  it("uses the device time zone instead of UTC", () => {
    const iso = "2026-10-06T01:30:00Z";
    const local = new Date(iso);
    const expected = [
      String(local.getDate()).padStart(2, "0"),
      String(local.getMonth() + 1).padStart(2, "0"),
      local.getFullYear()
    ].join("/");

    expect(formatReportDate(iso, "pt-BR")).toBe(expected);
  });

  it("formats dates in the local time zone and current language", () => {
    expect(formatReportDate("2026-10-05T12:00:00Z", "pt-BR")).toBe("05/10/2026");
    expect(formatReportDate("2026-10-05T12:00:00Z", "en")).toBe("10/05/2026");
    expect(formatReportDate("not-a-date", "pt-BR")).toBe("");
  });
});

import { notifyManager, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import React from "react";

import { useReportMutation } from "@/features/moderation/hooks/useReportMutation";
import { reportService } from "@/features/moderation/services/reportService";
import type { ReportCreatedResponse } from "@/features/moderation/types";
import { ApiError } from "@/services/api";

jest.mock("@/features/moderation/services/reportService", () => ({
  reportService: { reportRecorda: jest.fn(), reportUser: jest.fn() }
}));

const mockReportRecorda = reportService.reportRecorda as jest.Mock;
const mockReportUser = reportService.reportUser as jest.Mock;

// Por padrão o React Query agenda as notificações num macrotask, que cai fora do
// `act` e polui a saída com avisos. Notificar de forma síncrona mantém tudo dentro.
notifyManager.setScheduler((callback) => callback());

const CREATED: ReportCreatedResponse = {
  created_at: "2026-10-05T18:30:00Z",
  report_id: "11111111-1111-4111-8111-111111111111",
  status: "OPEN"
};

const clients: QueryClient[] = [];

function setup() {
  const client = new QueryClient({
    defaultOptions: {
      // gcTime 0: uma mutation concluída agenda uma limpeza de 5 minutos que
      // sobreviveria ao teste e impediria o Jest de encerrar.
      mutations: { gcTime: 0, retry: false }
    }
  });
  clients.push(client);

  function wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client }, children);
  }

  const { result } = renderHook(() => useReportMutation(), { wrapper });

  return result;
}

beforeEach(() => {
  mockReportRecorda.mockReset();
  mockReportUser.mockReset();
  mockReportRecorda.mockResolvedValue(CREATED);
  mockReportUser.mockResolvedValue(CREATED);
});

afterEach(() => {
  clients.forEach((client) => client.clear());
  clients.length = 0;
});

describe("useReportMutation", () => {
  it("dispatches a RECORDA target to reportRecorda", async () => {
    const result = setup();

    await act(async () => {
      await result.current.mutateAsync({
        description: "texto",
        target: { recordaId: "recorda-1", type: "RECORDA" }
      });
    });

    expect(mockReportRecorda).toHaveBeenCalledWith("recorda-1", "texto");
    expect(mockReportUser).not.toHaveBeenCalled();
  });

  it("dispatches a USER target to reportUser", async () => {
    const result = setup();

    await act(async () => {
      await result.current.mutateAsync({
        description: "texto",
        target: { type: "USER", userId: "user-1" }
      });
    });

    expect(mockReportUser).toHaveBeenCalledWith("user-1", "texto");
    expect(mockReportRecorda).not.toHaveBeenCalled();
  });

  it("exposes the created report on success", async () => {
    const result = setup();

    await act(async () => {
      await result.current.mutateAsync({
        description: "",
        target: { recordaId: "recorda-1", type: "RECORDA" }
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(CREATED);
  });

  it("surfaces the ApiError status on failure", async () => {
    mockReportRecorda.mockRejectedValueOnce(
      new ApiError("REPORT_ALREADY_EXISTS", "already reported", 409, null)
    );
    const result = setup();

    await act(async () => {
      await expect(
        result.current.mutateAsync({
          description: "",
          target: { recordaId: "recorda-1", type: "RECORDA" }
        })
      ).rejects.toBeInstanceOf(ApiError);
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as ApiError).status).toBe(409);
  });
});

import { act, renderHook } from "@testing-library/react-native";
import type { PropsWithChildren } from "react";
import { I18nextProvider } from "react-i18next";
import { Alert } from "react-native";

import { clearSession } from "@/features/auth/session";
import { useAdminApiErrorHandler } from "@/features/admin/hooks/useAdminApiErrorHandler";
import { i18n } from "@/i18n";
import { ApiError } from "@/services/api";

const mockReset = jest.fn();
const mockNavigation = { reset: mockReset };

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => mockNavigation
}));

jest.mock("@/features/auth/session", () => ({
  clearSession: jest.fn(async () => undefined)
}));

const mockClearSession = clearSession as jest.Mock;

function apiError(status: number, code = "REQUEST_FAILED") {
  return new ApiError(code, "Request failed", status, null);
}

function I18nWrapper({ children }: PropsWithChildren) {
  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}

function renderHandler() {
  return renderHook(() => useAdminApiErrorHandler(), { wrapper: I18nWrapper });
}

describe("useAdminApiErrorHandler", () => {
  let alert: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    alert = jest.spyOn(Alert, "alert").mockImplementation(() => undefined);
  });

  afterEach(() => alert.mockRestore());

  it("ends the session and resets to Login for a 401", async () => {
    const { result } = renderHandler();

    await act(async () => {
      await expect(result.current(apiError(401, "session_expired"))).resolves.toBe(true);
    });

    expect(alert).toHaveBeenCalledWith("Sessão encerrada", "Sua sessão expirou.");
    expect(mockClearSession).toHaveBeenCalledTimes(1);
    expect(mockReset).toHaveBeenCalledWith({ index: 0, routes: [{ name: "Login" }] });
  });

  it("ends the session with the administrative access warning for a 403", async () => {
    const { result } = renderHandler();

    await act(async () => {
      await expect(result.current(apiError(403))).resolves.toBe(true);
    });

    expect(alert).toHaveBeenCalledWith(
      "Acesso administrativo removido",
      "Sua conta não tem acesso administrativo."
    );
    expect(mockClearSession).toHaveBeenCalledTimes(1);
    expect(mockReset).toHaveBeenCalledWith({ index: 0, routes: [{ name: "Login" }] });
  });

  it("leaves non-authorization errors for the caller", async () => {
    const { result } = renderHandler();

    await act(async () => {
      await expect(result.current(apiError(500))).resolves.toBe(false);
      await expect(result.current(new Error("offline"))).resolves.toBe(false);
    });

    expect(alert).not.toHaveBeenCalled();
    expect(mockClearSession).not.toHaveBeenCalled();
    expect(mockReset).not.toHaveBeenCalled();
  });

  it("keeps a stable handler across rerenders", () => {
    const { rerender, result } = renderHandler();
    const firstHandler = result.current;

    rerender(undefined);

    expect(result.current).toBe(firstHandler);
  });

  it("coalesces concurrent authorization failures into one logout", async () => {
    let releaseClearSession: () => void = () => undefined;
    mockClearSession.mockImplementationOnce(
      () => new Promise<void>((resolve) => (releaseClearSession = resolve))
    );
    const { result } = renderHandler();

    let first!: Promise<boolean>;
    let second!: Promise<boolean>;
    act(() => {
      first = result.current(apiError(401, "session_expired"));
      second = result.current(apiError(403));
    });

    releaseClearSession();
    await act(async () => {
      await expect(Promise.all([first, second])).resolves.toEqual([true, true]);
    });

    expect(alert).toHaveBeenCalledTimes(1);
    expect(mockClearSession).toHaveBeenCalledTimes(1);
    expect(mockReset).toHaveBeenCalledTimes(1);
  });
});

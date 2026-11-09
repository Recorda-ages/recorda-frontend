import type { ComponentRef } from "react";
import { act, renderHook } from "@testing-library/react-native";
import { Alert, type AlertButton, Linking, type View } from "react-native";
import { captureRef } from "react-native-view-shot";

import {
  POSTER_EXPORT_HEIGHT,
  POSTER_EXPORT_WIDTH,
  useRetrospectiveExport
} from "@/features/memories-retrospective/hooks/useRetrospectiveExport";
import {
  saveCardToGallery,
  shareCardGeneric,
  shareCardToInstagramStories
} from "@/features/share/services/cardExport";
import { i18n } from "@/i18n";

import { mockDeleteFile } from "../../mocks/expoFileSystem";

jest.mock("react-native-view-shot", () => ({ captureRef: jest.fn() }));

jest.mock("@/features/share/services/cardExport", () => ({
  saveCardToGallery: jest.fn(),
  shareCardGeneric: jest.fn(),
  shareCardToInstagramStories: jest.fn()
}));

const CAPTURED_URI = "file:///cache/retrospective.png";

const mockCaptureRef = captureRef as jest.Mock;
const mockShareStories = shareCardToInstagramStories as jest.Mock;
const mockShareGeneric = shareCardGeneric as jest.Mock;
const mockSaveToGallery = saveCardToGallery as jest.Mock;

let alertSpy: jest.SpyInstance;
let consoleErrorSpy: jest.SpyInstance;

function renderExportHook(mounted = true) {
  const posterRef = { current: mounted ? ({} as ComponentRef<typeof View>) : null };
  return { posterRef, ...renderHook(() => useRetrospectiveExport(posterRef)) };
}

function lastAlert() {
  const [title, message, buttons] = alertSpy.mock.calls.at(-1) as [
    string,
    string,
    AlertButton[] | undefined
  ];
  return { buttons, message, title };
}

describe("useRetrospectiveExport", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => undefined);
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);
    mockCaptureRef.mockResolvedValue(CAPTURED_URI);
    mockShareStories.mockResolvedValue("shared");
    mockShareGeneric.mockResolvedValue(undefined);
    mockSaveToGallery.mockResolvedValue("saved");
  });

  afterEach(() => {
    alertSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it("captures a full HD 9:16 PNG and opens Instagram Stories without extra feedback", async () => {
    const { posterRef, result } = renderExportHook();

    await act(() => result.current.exportPoster("stories"));

    expect(mockCaptureRef).toHaveBeenCalledWith(posterRef, {
      format: "png",
      height: POSTER_EXPORT_HEIGHT,
      quality: 1,
      result: "tmpfile",
      width: POSTER_EXPORT_WIDTH
    });
    expect(POSTER_EXPORT_HEIGHT / POSTER_EXPORT_WIDTH).toBeCloseTo(16 / 9);
    expect(mockShareStories).toHaveBeenCalledWith(CAPTURED_URI);
    expect(alertSpy).not.toHaveBeenCalled();
    expect(result.current.pendingAction).toBeNull();
  });

  it("explains the fallback when Instagram Stories is unavailable", async () => {
    mockShareStories.mockResolvedValue("fallback");
    const { result } = renderExportHook();

    await act(() => result.current.exportPoster("stories"));

    expect(lastAlert()).toMatchObject({
      message:
        "O Instagram não está disponível, então abrimos o compartilhamento do sistema com o seu pôster.",
      title: "Compartilhamento alternativo"
    });
  });

  it("opens the system share menu for more options", async () => {
    const { result } = renderExportHook();

    await act(() => result.current.exportPoster("share"));

    expect(mockShareGeneric).toHaveBeenCalledWith(CAPTURED_URI);
    expect(mockShareStories).not.toHaveBeenCalled();
    expect(alertSpy).not.toHaveBeenCalled();
    // The receiving app may still be reading the shared file.
    expect(mockDeleteFile).not.toHaveBeenCalled();
  });

  it("saves to the gallery, confirms it and deletes the temporary capture", async () => {
    const { result } = renderExportHook();

    await act(() => result.current.exportPoster("save"));

    expect(mockSaveToGallery).toHaveBeenCalledWith(CAPTURED_URI);
    expect(mockDeleteFile).toHaveBeenCalledWith(CAPTURED_URI);
    expect(lastAlert()).toMatchObject({
      message: "Sua retrospectiva foi salva na galeria do dispositivo.",
      title: "Pôster salvo"
    });
  });

  it("offers the device settings when gallery permission is denied", async () => {
    const openSettings = jest.spyOn(Linking, "openSettings").mockResolvedValue(undefined);
    mockSaveToGallery.mockResolvedValue("permission-denied");
    const { result } = renderExportHook();

    await act(() => result.current.exportPoster("save"));

    const alert = lastAlert();
    expect(alert.title).toBe("Permissão necessária");
    expect(alert.buttons?.map((button) => button.text)).toEqual([
      "Cancelar",
      "Abrir configurações"
    ]);
    expect(mockDeleteFile).not.toHaveBeenCalled();

    alert.buttons?.[1].onPress?.();
    expect(openSettings).toHaveBeenCalled();
    openSettings.mockRestore();
  });

  it("shows a share error and shares nothing when the capture fails", async () => {
    mockCaptureRef.mockRejectedValue(new Error("capture failed"));
    const { result } = renderExportHook();

    await act(() => result.current.exportPoster("stories"));

    expect(mockShareStories).not.toHaveBeenCalled();
    expect(lastAlert()).toMatchObject({
      message: "Não foi possível compartilhar o pôster. Tente novamente.",
      title: "Erro ao compartilhar"
    });
    expect(result.current.pendingAction).toBeNull();
  });

  it("shows a save error when the gallery rejects the poster", async () => {
    mockSaveToGallery.mockRejectedValue(new Error("disk full"));
    const { result } = renderExportHook();

    await act(() => result.current.exportPoster("save"));

    expect(lastAlert()).toMatchObject({
      message: "Não foi possível salvar o pôster. Tente novamente.",
      title: "Erro ao salvar"
    });
  });

  it("does not capture when the poster is not mounted", async () => {
    const { result } = renderExportHook(false);

    await act(() => result.current.exportPoster("share"));

    expect(mockCaptureRef).not.toHaveBeenCalled();
    expect(mockShareGeneric).not.toHaveBeenCalled();
    expect(lastAlert().title).toBe("Erro ao compartilhar");
  });

  it("tracks the pending action and ignores a second export meanwhile", async () => {
    let finishCapture: (uri: string) => void = () => undefined;
    mockCaptureRef.mockReturnValue(
      new Promise<string>((resolve) => {
        finishCapture = resolve;
      })
    );
    const { result } = renderExportHook();

    let firstExport: Promise<void> = Promise.resolve();
    act(() => {
      firstExport = result.current.exportPoster("stories");
    });
    expect(result.current.pendingAction).toBe("stories");

    await act(() => result.current.exportPoster("save"));
    expect(mockCaptureRef).toHaveBeenCalledTimes(1);

    await act(async () => {
      finishCapture(CAPTURED_URI);
      await firstExport;
    });

    expect(mockShareStories).toHaveBeenCalledTimes(1);
    expect(mockSaveToGallery).not.toHaveBeenCalled();
    expect(result.current.pendingAction).toBeNull();
  });

  it("speaks the user's language", async () => {
    await i18n.changeLanguage("en");
    mockSaveToGallery.mockResolvedValue("permission-denied");
    const { result } = renderExportHook();

    await act(() => result.current.exportPoster("save"));

    const alert = lastAlert();
    expect(alert.title).toBe("Permission needed");
    expect(alert.message).toBe("Allow gallery access in Settings to save the poster.");
    expect(alert.buttons?.map((button) => button.text)).toEqual(["Cancel", "Open Settings"]);
  });
});

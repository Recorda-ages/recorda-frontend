import { act, fireEvent, render, screen, within } from "@testing-library/react-native";
import type { ReactNode } from "react";
import { I18nextProvider } from "react-i18next";
import { BackHandler, PixelRatio, StyleSheet } from "react-native";
import { PaperProvider } from "react-native-paper";
import { captureRef } from "react-native-view-shot";

import { RetrospectiveSummaryCard } from "@/features/memories-retrospective/components/RetrospectiveSummaryCard";
import type { RetrospectiveSummary } from "@/features/memories-retrospective/components/RetrospectiveSummaryPoster";
import {
  saveCardToGallery,
  shareCardGeneric,
  shareCardToInstagramStories
} from "@/features/share/services/cardExport";
import { i18n } from "@/i18n";
import en from "@/i18n/locales/en.json";
import es from "@/i18n/locales/es.json";
import ptBR from "@/i18n/locales/pt-BR.json";
import { paperTheme } from "@/theme";

jest.mock("react-native-view-shot", () => ({ captureRef: jest.fn() }));

jest.mock("@/features/share/services/cardExport", () => ({
  saveCardToGallery: jest.fn(),
  shareCardGeneric: jest.fn(),
  shareCardToInstagramStories: jest.fn()
}));

jest.mock("expo-linear-gradient", () => {
  const { View } = jest.requireActual("react-native");
  return { LinearGradient: View };
});

const mockCaptureRef = captureRef as jest.Mock;

const summary: RetrospectiveSummary = {
  activeDays: 19,
  commentsReceived: 37,
  featuredSongTitle: "Vienna",
  likesReceived: 1214,
  maxStreak: 12,
  periodLabel: "2026",
  topArtistName: "Billy Joel",
  topGenreName: "Rock",
  topTaggedUsername: "pedro",
  totalRecordas: 28
};

function Providers({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <I18nextProvider i18n={i18n}>
      <PaperProvider theme={paperTheme}>{children}</PaperProvider>
    </I18nextProvider>
  );
}

function renderCard(value: RetrospectiveSummary = summary) {
  const onFinish = jest.fn();
  render(<RetrospectiveSummaryCard onFinish={onFinish} summary={value} />, {
    wrapper: Providers
  });
  fireEvent(screen.getByTestId("retrospective-summary-preview-area"), "layout", {
    nativeEvent: { layout: { height: 640, width: 400 } }
  });
  return { onFinish };
}

function metric(key: string) {
  return within(screen.getByTestId(`retrospective-summary-${key}`));
}

describe("RetrospectiveSummaryCard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCaptureRef.mockResolvedValue("file:///cache/retrospective.png");
    (shareCardToInstagramStories as jest.Mock).mockResolvedValue("shared");
    (shareCardGeneric as jest.Mock).mockResolvedValue(undefined);
    (saveCardToGallery as jest.Mock).mockResolvedValue("saved");
  });

  it("condenses the six approved metrics into the poster", () => {
    renderCard();

    expect(screen.getByText("Retrospectiva 2026")).toBeVisible();
    expect(screen.getByText("Seu 2026, em uma frase")).toBeVisible();
    expect(screen.getByText("Você transformou momentos em música.")).toBeVisible();
    expect(screen.getByText("28 Recordas · 19 dias ativos")).toBeVisible();
    expect(metric("song").getByText("Vienna")).toBeVisible();
    expect(metric("artist").getByText("Billy Joel")).toBeVisible();
    expect(metric("genre").getByText("Rock")).toBeVisible();
    expect(metric("friend").getByText("@pedro")).toBeVisible();
    expect(metric("engagement").getByLabelText("1.214 curtidas e 37 comentários")).toBeVisible();
    expect(metric("streak").getByText("12 dias")).toBeVisible();
  });

  it("fits the 9:16 preview inside the available space", () => {
    renderCard();

    // 400 × 640 available: the height is the limit, so the poster is 360 × 640.
    const poster = StyleSheet.flatten(
      screen.getByTestId("retrospective-summary-poster").props.style
    ) as { height: number; width: number };
    expect(poster.height).toBeCloseTo(640);
    expect(poster.width).toBeCloseTo(360);
  });

  it("lays out the captured copy at exactly 1080 × 1920 pixels", () => {
    renderCard();

    const poster = StyleSheet.flatten(
      screen.getByTestId("retrospective-summary-export-poster", { includeHiddenElements: true })
        .props.style
    ) as { height: number; width: number };
    expect(poster.width * PixelRatio.get()).toBeCloseTo(1080);
    expect(poster.height * PixelRatio.get()).toBeCloseTo(1920);
  });

  it("uses safe placeholders and singular forms for sparse periods", () => {
    renderCard({
      ...summary,
      activeDays: null,
      featuredSongTitle: null,
      maxStreak: 1,
      topArtistName: null,
      topGenreName: null,
      topTaggedUsername: null,
      totalRecordas: 1
    });

    expect(screen.getByText("1 Recorda")).toBeVisible();
    expect(metric("song").getByText("—")).toBeVisible();
    expect(metric("artist").getByText("—")).toBeVisible();
    expect(metric("genre").getByText("—")).toBeVisible();
    expect(metric("friend").getByText("—")).toBeVisible();
    expect(metric("streak").getByText("1 dia")).toBeVisible();
  });

  it("captures the export copy and shares it on Instagram Stories from the share menu", async () => {
    renderCard();

    fireEvent.press(screen.getByLabelText("Compartilhar retrospectiva"));
    expect(screen.getByText("Instagram Stories")).toBeVisible();
    expect(screen.getByText("Mais opções")).toBeVisible();
    expect(screen.getByText("Salvar na galeria")).toBeVisible();

    await act(async () => {
      fireEvent.press(screen.getByTestId("retrospective-summary-share-stories"));
    });

    expect(mockCaptureRef).toHaveBeenCalledTimes(1);
    // React Native's Jest preset mocks View as a component, so its ref exposes the props.
    expect(mockCaptureRef.mock.calls[0][0].current?.props?.testID).toBe(
      "retrospective-summary-export"
    );
    expect(shareCardToInstagramStories).toHaveBeenCalledWith("file:///cache/retrospective.png");
    expect(screen.queryByTestId("retrospective-summary-share-menu")).toBeNull();
  });

  it.each([
    ["share", shareCardGeneric],
    ["save", saveCardToGallery]
  ] as const)("runs the %s option", async (action, service) => {
    renderCard();

    fireEvent.press(screen.getByTestId("retrospective-summary-share"));
    await act(async () => {
      fireEvent.press(screen.getByTestId(`retrospective-summary-share-${action}`));
    });

    expect(service).toHaveBeenCalledWith("file:///cache/retrospective.png");
  });

  it("disables sharing while an export is running", async () => {
    mockCaptureRef.mockReturnValue(new Promise(() => undefined));
    renderCard();

    fireEvent.press(screen.getByTestId("retrospective-summary-share"));
    await act(async () => {
      fireEvent.press(screen.getByTestId("retrospective-summary-share-save"));
    });

    expect(screen.getByTestId("retrospective-summary-share")).toBeDisabled();
  });

  it("closes the share menu with cancel, the backdrop or the back button", () => {
    const addBackListener = jest.spyOn(BackHandler, "addEventListener");
    renderCard();

    fireEvent.press(screen.getByTestId("retrospective-summary-share"));
    fireEvent.press(screen.getByTestId("retrospective-summary-share-cancel"));
    expect(screen.queryByTestId("retrospective-summary-share-menu")).toBeNull();

    fireEvent.press(screen.getByTestId("retrospective-summary-share"));
    fireEvent.press(screen.getByTestId("retrospective-summary-share-backdrop"));
    expect(screen.queryByTestId("retrospective-summary-share-menu")).toBeNull();

    fireEvent.press(screen.getByTestId("retrospective-summary-share"));
    const onBackPress = addBackListener.mock.calls.at(-1)?.[1];
    let handled: boolean | null | undefined;
    act(() => {
      handled = onBackPress?.({} as Parameters<typeof onBackPress>[0]);
    });
    expect(handled).toBe(true);
    expect(screen.queryByTestId("retrospective-summary-share-menu")).toBeNull();
    expect(mockCaptureRef).not.toHaveBeenCalled();
    addBackListener.mockRestore();
  });

  it("finishes the retrospective", () => {
    const { onFinish } = renderCard();

    fireEvent.press(screen.getByText("Concluir"));

    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["en", "2026 Retrospective", "You turned moments into music.", "12 days", "Done"],
    ["es", "Retrospectiva 2026", "Convertiste momentos en música.", "12 días", "Concluir"]
  ])("renders in %s", async (language, title, headline, streak, finish) => {
    await i18n.changeLanguage(language);
    renderCard();

    expect(screen.getByText(title)).toBeVisible();
    expect(screen.getByText(headline)).toBeVisible();
    expect(metric("streak").getByText(streak)).toBeVisible();
    expect(screen.getByText(finish)).toBeVisible();
  });

  it("has every message translated in pt-BR, en and es", () => {
    const keys = (messages: Record<string, string>) => Object.keys(messages).sort();
    const expected = keys(ptBR.retrospectiveSummary);

    expect(keys(en.retrospectiveSummary)).toEqual(expected);
    expect(keys(es.retrospectiveSummary)).toEqual(expected);
    for (const messages of [ptBR, en, es]) {
      for (const value of Object.values(messages.retrospectiveSummary)) {
        expect(value.trim()).not.toBe("");
      }
    }
  });
});

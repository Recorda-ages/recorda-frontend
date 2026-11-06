import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react-native";
import type { ReactElement } from "react";
import { StyleSheet } from "react-native";
import { I18nextProvider } from "react-i18next";
import { PaperProvider } from "react-native-paper";

import { DailyStreakCard } from "@/features/memories-metrics/components/widgets/DailyStreakCard";
import { TopArtistHighlightCard } from "@/features/memories-metrics/components/widgets/TopArtistHighlightCard";
import { TopGenresRankingCard } from "@/features/memories-metrics/components/widgets/TopGenresRankingCard";
import {
  emptyProfileMetricsMock,
  profileMetricsMock
} from "@/features/memories-metrics/mocks/metricsMock";
import { i18n } from "@/i18n";
import { AUTH_TOKEN_QUERY_KEY } from "@/services/api";
import { colors, paperTheme } from "@/theme";

function renderWidget(ui: ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity } } });
  client.setQueryData(AUTH_TOKEN_QUERY_KEY, null);

  return render(
    <QueryClientProvider client={client}>
      <I18nextProvider i18n={i18n}>
        <PaperProvider theme={paperTheme}>{ui}</PaperProvider>
      </I18nextProvider>
    </QueryClientProvider>
  );
}

describe("TopArtistHighlightCard", () => {
  it("shows the photo, the name and the Recorda count", () => {
    renderWidget(
      <TopArtistHighlightCard
        artist={{
          ...profileMetricsMock.top_artist,
          image_url: "https://cdn.example.com/liniker.jpg"
        }}
      />
    );

    expect(screen.getByText("Liniker")).toBeTruthy();
    expect(screen.getByText("12 Recordas")).toBeTruthy();
    expect(screen.getByTestId("top-artist-photo")).toBeTruthy();
    expect(screen.queryByTestId("top-artist-photo-fallback")).toBeNull();
  });

  it("falls back to an icon when there is no photo", () => {
    renderWidget(<TopArtistHighlightCard artist={profileMetricsMock.top_artist} />);

    expect(screen.getByTestId("top-artist-photo-fallback")).toBeTruthy();
    expect(screen.queryByTestId("top-artist-photo")).toBeNull();
    expect(screen.getByText("Liniker")).toBeTruthy();
    expect(screen.getByText("12 Recordas")).toBeTruthy();
  });

  it("uses the singular for a single Recorda", () => {
    renderWidget(
      <TopArtistHighlightCard artist={{ ...profileMetricsMock.top_artist, memory_count: 1 }} />
    );

    expect(screen.getByText("1 Recorda")).toBeTruthy();
  });

  it("shows an empty message when there is no top artist", () => {
    renderWidget(<TopArtistHighlightCard artist={emptyProfileMetricsMock.top_artist} />);

    expect(screen.getByText("Ainda não há um artista em destaque neste período.")).toBeTruthy();
    expect(screen.queryByTestId("top-artist-photo")).toBeNull();
    expect(screen.queryByTestId("top-artist-photo-fallback")).toBeNull();
  });
});

describe("TopGenresRankingCard", () => {
  it("shows one proportional bar per genre with its percentage", () => {
    renderWidget(<TopGenresRankingCard genres={profileMetricsMock.top_genres} />);

    const expected = [
      { name: "MPB", percentage: "50%" },
      { name: "R&B", percentage: "30%" },
      { name: "Pop", percentage: "20%" }
    ];

    expected.forEach(({ name, percentage }, index) => {
      const row = screen.getByTestId(`top-genre-row-${index + 1}`);
      expect(within(row).getByText(name)).toBeTruthy();
      expect(within(row).getByText(percentage)).toBeTruthy();

      const fill = StyleSheet.flatten(
        screen.getByTestId(`top-genre-fill-${index + 1}`).props.style
      );
      expect(fill).toMatchObject({ backgroundColor: colors.primary[500], width: percentage });
    });

    expect(screen.getAllByRole("progressbar")).toHaveLength(3);
  });

  it("orders the genres by frequency", () => {
    renderWidget(
      <TopGenresRankingCard
        genres={[
          { count: 6, genre_name: "Pop", percentage: 20 },
          { count: 15, genre_name: "MPB", percentage: 50 },
          { count: 9, genre_name: "R&B", percentage: 30 }
        ]}
      />
    );

    expect(within(screen.getByTestId("top-genre-row-1")).getByText("MPB")).toBeTruthy();
    expect(within(screen.getByTestId("top-genre-row-2")).getByText("R&B")).toBeTruthy();
    expect(within(screen.getByTestId("top-genre-row-3")).getByText("Pop")).toBeTruthy();
  });

  it("keeps the bars between 0% and 100%", () => {
    renderWidget(
      <TopGenresRankingCard
        genres={[
          { count: 3, genre_name: "Rock", percentage: 130 },
          { count: 1, genre_name: "Jazz", percentage: -5 },
          { count: 0, genre_name: "Soul", percentage: 0 }
        ]}
      />
    );

    const widths = [1, 2, 3].map(
      (position) =>
        StyleSheet.flatten(screen.getByTestId(`top-genre-fill-${position}`).props.style).width
    );

    expect(widths).toEqual(["100%", "0%", "0%"]);
    expect(within(screen.getByTestId("top-genre-row-1")).getByText("100%")).toBeTruthy();
  });

  it("shows an empty message when there are no genres", () => {
    renderWidget(<TopGenresRankingCard genres={emptyProfileMetricsMock.top_genres} />);

    expect(screen.getByText("Ainda não há gêneros neste período.")).toBeTruthy();
    expect(screen.queryByTestId("top-genre-row-1")).toBeNull();
    expect(screen.queryAllByRole("progressbar")).toHaveLength(0);
  });
});

describe("DailyStreakCard", () => {
  it("shows the number of consecutive days and the daily rule", () => {
    renderWidget(<DailyStreakCard streak={profileMetricsMock.streak} />);

    expect(screen.getByTestId("daily-streak-value")).toBeTruthy();
    expect(screen.getByText("14")).toBeTruthy();
    expect(screen.getByText("dias seguidos")).toBeTruthy();
    expect(
      screen.getByText("A sequência é diária e zera se um dia terminar sem publicação.")
    ).toBeTruthy();
  });

  it("uses the singular for a single day", () => {
    renderWidget(<DailyStreakCard streak={{ current_streak_days: 1, last_post_date: null }} />);

    expect(screen.getByText("dia seguido")).toBeTruthy();
    expect(screen.queryByText("dias seguidos")).toBeNull();
  });

  it("shows zero without a streak label when there is no active streak", () => {
    renderWidget(<DailyStreakCard streak={emptyProfileMetricsMock.streak} />);

    expect(screen.getByText("0")).toBeTruthy();
    expect(screen.getByText("Nenhuma sequência ativa")).toBeTruthy();
    expect(screen.queryByText("dias seguidos")).toBeNull();
  });

  it("shows only the count: no fire, no glow and no last post date", () => {
    renderWidget(<DailyStreakCard streak={profileMetricsMock.streak} />);

    expect(screen.queryByText(/🔥/u)).toBeNull();
    expect(screen.queryByText(/2026/)).toBeNull();

    const card = StyleSheet.flatten(screen.getByTestId("daily-streak-card").props.style);
    const value = StyleSheet.flatten(screen.getByTestId("daily-streak-value").props.style);
    for (const key of ["elevation", "shadowColor", "shadowOpacity", "shadowRadius"]) {
      expect(card).not.toHaveProperty(key);
    }
    expect(value).not.toHaveProperty("textShadowColor");
    expect(card.backgroundColor).toBe(colors.neutrals[800]);
  });
});

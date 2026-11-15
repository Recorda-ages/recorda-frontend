import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react-native";
import type { ReactElement } from "react";
import { StyleSheet } from "react-native";
import { I18nextProvider } from "react-i18next";
import { PaperProvider } from "react-native-paper";

import { DailyStreakCard } from "@/features/memories-metrics/components/widgets/DailyStreakCard";
import { MonthlyDistributionCard } from "@/features/memories-metrics/components/widgets/MonthlyDistributionCard";
import { TopArtistsRankingCard } from "@/features/memories-metrics/components/widgets/TopArtistsRankingCard";
import { TopGenresRankingCard } from "@/features/memories-metrics/components/widgets/TopGenresRankingCard";
import { TotalRecordasCard } from "@/features/memories-metrics/components/widgets/TotalRecordasCard";
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

describe("TotalRecordasCard", () => {
  it("shows the total with the plural label", () => {
    renderWidget(<TotalRecordasCard total={30} />);

    expect(screen.getByTestId("total-recordas-value")).toBeTruthy();
    expect(screen.getByText("30")).toBeTruthy();
    expect(screen.getByText("Recordas publicadas")).toBeTruthy();
  });

  it("uses the singular for a single Recorda", () => {
    renderWidget(<TotalRecordasCard total={1} />);

    expect(screen.getByText("Recorda publicada")).toBeTruthy();
    expect(screen.queryByText("Recordas publicadas")).toBeNull();
  });
});

describe("TopArtistsRankingCard", () => {
  it("lists the artists in the order received with their Recorda count", () => {
    renderWidget(<TopArtistsRankingCard artists={profileMetricsMock.top_artists} />);

    const expected = [
      { count: "12 Recordas", name: "Liniker" },
      { count: "9 Recordas", name: "Djavan" },
      { count: "9 Recordas", name: "Anitta" }
    ];

    expected.forEach(({ count, name }, index) => {
      const row = screen.getByTestId(`top-artist-row-${index + 1}`);
      expect(within(row).getByText(name)).toBeTruthy();
      expect(within(row).getByText(count)).toBeTruthy();
      expect(within(row).getByText(String(index + 1))).toBeTruthy();
    });
  });

  it("shows the photo when available and an icon otherwise", () => {
    renderWidget(
      <TopArtistsRankingCard
        artists={[
          {
            artist_name: "Liniker",
            image_url: "https://cdn.example.com/liniker.jpg",
            memory_count: 2
          },
          { artist_name: "Djavan", image_url: null, memory_count: 1 }
        ]}
      />
    );

    expect(screen.getByTestId("top-artist-photo-1")).toBeTruthy();
    expect(screen.queryByTestId("top-artist-fallback-1")).toBeNull();
    expect(screen.getByTestId("top-artist-fallback-2")).toBeTruthy();
    expect(screen.getByText("1 Recorda")).toBeTruthy();
  });

  it("shows an empty message when there are no artists", () => {
    renderWidget(<TopArtistsRankingCard artists={emptyProfileMetricsMock.top_artists} />);

    expect(screen.getByText("Ainda não há artistas neste período.")).toBeTruthy();
    expect(screen.queryByTestId("top-artist-row-1")).toBeNull();
  });
});

describe("MonthlyDistributionCard", () => {
  it("draws one bar per month proportional to the highest count", () => {
    renderWidget(<MonthlyDistributionCard months={profileMetricsMock.monthly_distribution} />);

    const september = screen.getByTestId("monthly-bar-2026-9");
    const october = screen.getByTestId("monthly-bar-2026-10");
    expect(within(september).getByText("8")).toBeTruthy();
    expect(within(october).getByText("22")).toBeTruthy();
    expect(october.props.accessibilityLabel).toContain("22 Recordas");
  });

  it("keeps only the latest twelve months", () => {
    const months = Array.from({ length: 14 }, (_, index) => ({
      count: index + 1,
      month: (index % 12) + 1,
      year: 2025 + Math.floor(index / 12)
    }));

    renderWidget(<MonthlyDistributionCard months={months} />);

    expect(screen.queryByTestId("monthly-bar-2025-1")).toBeNull();
    expect(screen.queryByTestId("monthly-bar-2025-2")).toBeNull();
    expect(screen.getByTestId("monthly-bar-2025-3")).toBeTruthy();
    expect(screen.getByTestId("monthly-bar-2026-2")).toBeTruthy();
  });

  it("shows an empty message when there are no months", () => {
    renderWidget(<MonthlyDistributionCard months={emptyProfileMetricsMock.monthly_distribution} />);

    expect(screen.getByText("Ainda não há Recordas neste período.")).toBeTruthy();
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

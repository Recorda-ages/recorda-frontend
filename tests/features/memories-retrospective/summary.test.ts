import {
  formatRetrospectivePeriod,
  toRetrospectiveSummary
} from "@/features/memories-retrospective/summary";
import type { RetrospectiveDetailsResponse } from "@/features/memories-retrospective/types";

const details: RetrospectiveDetailsResponse = {
  active_days: 19,
  engagement: { comments_received: 37, likes_received: 214 },
  featured_song: {
    deezer_track_id: "3135556",
    memory_count: 4,
    song_artist_name: "Billy Joel",
    song_cover_url: null,
    song_preview_url: "/api/v1/music/tracks/3135556/preview",
    song_title: "Vienna"
  },
  is_preview: false,
  label: "Ano de 2025",
  max_streak: 12,
  month: null,
  period_type: "YEARLY",
  tagged_users: [
    { profile_picture_url: null, tag_count: 7, user_id: "u-1", username: "pedro" },
    { profile_picture_url: null, tag_count: 5, user_id: "u-2", username: "marina" }
  ],
  top_artists: [
    { artist_name: "Billy Joel", image_url: null, memory_count: 6 },
    { artist_name: "The Beatles", image_url: null, memory_count: 4 }
  ],
  top_genres: [
    { count: 13, genre_name: "Rock", percentage: 46 },
    { count: 8, genre_name: "Pop", percentage: 29 }
  ],
  total_recordas: 28,
  year: 2025
};

describe("toRetrospectiveSummary", () => {
  it("keeps the top entry of each ranking and the engagement totals", () => {
    expect(toRetrospectiveSummary(details, "pt-BR")).toEqual({
      activeDays: 19,
      commentsReceived: 37,
      featuredSongTitle: "Vienna",
      likesReceived: 214,
      maxStreak: 12,
      periodLabel: "2025",
      topArtistName: "Billy Joel",
      topGenreName: "Rock",
      topTaggedUsername: "pedro",
      totalRecordas: 28
    });
  });

  it("leaves empty rankings and a missing featured song as null", () => {
    expect(
      toRetrospectiveSummary(
        { ...details, featured_song: null, tagged_users: [], top_artists: [], top_genres: [] },
        "pt-BR"
      )
    ).toMatchObject({
      featuredSongTitle: null,
      topArtistName: null,
      topGenreName: null,
      topTaggedUsername: null
    });
  });
});

describe("formatRetrospectivePeriod", () => {
  it("uses only the year for yearly retrospectives", () => {
    expect(formatRetrospectivePeriod(details, "en")).toBe("2025");
  });

  it.each([
    ["pt-BR", "outubro de 2026"],
    ["en", "October 2026"],
    ["es", "octubre de 2026"]
  ])("names the month in %s", (language, expected) => {
    expect(
      formatRetrospectivePeriod({ month: 10, period_type: "MONTHLY", year: 2026 }, language)
    ).toBe(expected);
  });

  it("does not shift January into the previous year", () => {
    expect(formatRetrospectivePeriod({ month: 1, period_type: "MONTHLY", year: 2026 }, "en")).toBe(
      "January 2026"
    );
  });
});

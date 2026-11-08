import type {
  AvailableRetrospectivesResponse,
  RetrospectiveDetailsResponse,
  RetrospectivePeriod,
  RetrospectivePeriodSelection,
  RetrospectiveService,
  RetrospectiveTaggedUser,
  RetrospectiveTopArtist,
  RetrospectiveTopGenre
} from "../types";
import { assertRetrospectivePeriod, throwIfAborted } from "../validation";

type Track = {
  deezer_track_id: string;
  song_title: string;
  song_artist_name: string;
  artist_image_url: string;
  song_cover_url: string;
  genre_name: string;
};

const DEEZER = "https://cdn-images.dzcdn.net/images";

const TRACKS = {
  aindaBem: {
    deezer_track_id: "950812822",
    song_title: "Ainda Bem",
    song_artist_name: "Marisa Monte",
    artist_image_url: `${DEEZER}/artist/4da4e950a642d21a32c0d6ae32d31c4d/250x250-000000-80-0-0.jpg`,
    song_cover_url: `${DEEZER}/cover/745738969ea23df2e6d66a8827254f9e/500x500-000000-80-0-0.jpg`,
    genre_name: "MPB"
  },
  andarComFe: {
    deezer_track_id: "876104422",
    song_title: "Andar com fé",
    song_artist_name: "Gilberto Gil",
    artist_image_url: `${DEEZER}/artist/1155049990857b7e5260f2f99a2d48dd/250x250-000000-80-0-0.jpg`,
    song_cover_url: `${DEEZER}/cover/cddf140873af8d2a3512e5e21c70bc34/500x500-000000-80-0-0.jpg`,
    genre_name: "MPB"
  },
  blindingLights: {
    deezer_track_id: "908604612",
    song_title: "Blinding Lights",
    song_artist_name: "The Weeknd",
    artist_image_url: `${DEEZER}/artist/581693b4724a7fcfa754455101e13a44/250x250-000000-80-0-0.jpg`,
    song_cover_url: `${DEEZER}/cover/fd00ebd6d30d7253f813dba3bb1c66a9/500x500-000000-80-0-0.jpg`,
    genre_name: "Pop"
  },
  ceuAzul: {
    deezer_track_id: "1509938122",
    song_title: "Céu Azul",
    song_artist_name: "Charlie Brown Jr.",
    artist_image_url: `${DEEZER}/artist/1a2e562dde23cdbd9abea4bae13eb4fc/250x250-000000-80-0-0.jpg`,
    song_cover_url: `${DEEZER}/cover/e7878aaa78c4d0d00a15ff43f4229b89/500x500-000000-80-0-0.jpg`,
    genre_name: "Rock"
  },
  donaDeMim: {
    deezer_track_id: "487611532",
    song_title: "Dona de mim",
    song_artist_name: "IZA",
    artist_image_url: `${DEEZER}/artist/fd74f81cf7ebf8182d8b469cebf19396/250x250-000000-80-0-0.jpg`,
    song_cover_url: `${DEEZER}/cover/a8a284ab7b2eb270f3c62ed0af6c3039/500x500-000000-80-0-0.jpg`,
    genre_name: "Pop"
  },
  harderBetter: {
    deezer_track_id: "3135556",
    song_title: "Harder, Better, Faster, Stronger",
    song_artist_name: "Daft Punk",
    artist_image_url: `${DEEZER}/artist/638e69b9caaf9f9f3f8826febea7b543/250x250-000000-80-0-0.jpg`,
    song_cover_url: `${DEEZER}/cover/5718f7c81c27e0b2417e2a4c45224f8a/500x500-000000-80-0-0.jpg`,
    genre_name: "Eletrônica"
  },
  levitating: {
    deezer_track_id: "1124841682",
    song_title: "Levitating",
    song_artist_name: "Dua Lipa",
    artist_image_url: `${DEEZER}/artist/877872aaf75694f11d53c318700ab2b5/250x250-000000-80-0-0.jpg`,
    song_cover_url: `${DEEZER}/cover/f8364f090ba04f1b19b381ec0390f3e4/500x500-000000-80-0-0.jpg`,
    genre_name: "Pop"
  },
  naoQueroDinheiro: {
    deezer_track_id: "543139482",
    song_title: "Não Quero Dinheiro (Só Quero Amar)",
    song_artist_name: "Tim Maia",
    artist_image_url: `${DEEZER}/artist/fa32f3688e3b5901b7588020b0377623/250x250-000000-80-0-0.jpg`,
    song_cover_url: `${DEEZER}/cover/8aa8859d166a8a4ab4335bff6796b244/500x500-000000-80-0-0.jpg`,
    genre_name: "Soul"
  },
  tempoPerdido: {
    deezer_track_id: "3530724",
    song_title: "Tempo Perdido",
    song_artist_name: "Legião Urbana",
    artist_image_url: `${DEEZER}/artist/27331b5535cf5a8fd0cece324c201a18/250x250-000000-80-0-0.jpg`,
    song_cover_url: `${DEEZER}/cover/b4738becedbed0481ac71cee50b18d6b/500x500-000000-80-0-0.jpg`,
    genre_name: "Rock"
  },
  yellow: {
    deezer_track_id: "3128096",
    song_title: "Yellow",
    song_artist_name: "Coldplay",
    artist_image_url: `${DEEZER}/artist/3087954bca22f306324912e5ac8375c3/250x250-000000-80-0-0.jpg`,
    song_cover_url: `${DEEZER}/cover/970dce98eeea6729244c0ae71707a83d/500x500-000000-80-0-0.jpg`,
    genre_name: "Rock"
  }
} satisfies Record<string, Track>;

type TrackKey = keyof typeof TRACKS;

type Friend = "ana" | "julia" | "lucas" | "marina" | "pedro";

type MonthFixture = {
  year: number;
  month: number;
  is_preview: boolean;
  tracks: TrackKey[];
  active_days: number;
  max_streak: number;
  likes: number;
  comments: number;
  tags: Partial<Record<Friend, number>>;
};

const MONTH_NAMES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro"
];

const MONTHS: MonthFixture[] = [
  {
    year: 2026,
    month: 11,
    is_preview: true,
    tracks: ["levitating", "levitating", "aindaBem"],
    active_days: 3,
    max_streak: 2,
    likes: 9,
    comments: 2,
    tags: { ana: 2, pedro: 1 }
  },
  {
    year: 2026,
    month: 10,
    is_preview: false,
    tracks: [
      "aindaBem",
      "yellow",
      "aindaBem",
      "harderBetter",
      "yellow",
      "aindaBem",
      "levitating",
      "tempoPerdido",
      "ceuAzul",
      "andarComFe",
      "donaDeMim",
      "yellow"
    ],
    active_days: 10,
    max_streak: 4,
    likes: 47,
    comments: 13,
    tags: { ana: 3, lucas: 1, marina: 2, pedro: 4 }
  },
  {
    year: 2026,
    month: 9,
    is_preview: false,
    tracks: [
      "tempoPerdido",
      "tempoPerdido",
      "ceuAzul",
      "naoQueroDinheiro",
      "andarComFe",
      "aindaBem",
      "harderBetter",
      "blindingLights"
    ],
    active_days: 7,
    max_streak: 3,
    likes: 31,
    comments: 8,
    tags: { julia: 1, lucas: 3 }
  },
  {
    year: 2026,
    month: 7,
    is_preview: false,
    tracks: ["blindingLights", "levitating", "donaDeMim", "blindingLights", "yellow"],
    active_days: 5,
    max_streak: 2,
    likes: 18,
    comments: 4,
    tags: {}
  },
  {
    year: 2026,
    month: 3,
    is_preview: false,
    tracks: ["andarComFe", "naoQueroDinheiro"],
    active_days: 2,
    max_streak: 1,
    likes: 6,
    comments: 1,
    tags: { marina: 1 }
  },
  {
    year: 2025,
    month: 12,
    is_preview: false,
    tracks: ["yellow", "ceuAzul", "tempoPerdido", "harderBetter", "harderBetter", "aindaBem"],
    active_days: 5,
    max_streak: 3,
    likes: 22,
    comments: 6,
    tags: { ana: 1, pedro: 2 }
  },
  {
    year: 2025,
    month: 11,
    is_preview: false,
    tracks: ["harderBetter", "harderBetter", "levitating"],
    active_days: 3,
    max_streak: 2,
    likes: 10,
    comments: 3,
    tags: { ana: 1 }
  }
];

const CLOSED_YEARS = [2025];

function countBy<T extends string>(values: T[]) {
  const counts = new Map<T, number>();
  values.forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1));
  return [...counts.entries()];
}

function byCountThenName<T extends string>(
  [nameA, countA]: [T, number],
  [nameB, countB]: [T, number]
) {
  return countB - countA || nameA.localeCompare(nameB);
}

function rankArtists(tracks: TrackKey[]): RetrospectiveTopArtist[] {
  const imageByArtist = new Map(
    tracks.map((key) => [TRACKS[key].song_artist_name, TRACKS[key].artist_image_url])
  );

  return countBy(tracks.map((key) => TRACKS[key].song_artist_name))
    .sort(byCountThenName)
    .slice(0, 5)
    .map(([artist_name, memory_count]) => ({
      artist_name,
      image_url: imageByArtist.get(artist_name) ?? null,
      memory_count
    }));
}

function rankGenres(tracks: TrackKey[]): RetrospectiveTopGenre[] {
  const counts = countBy(tracks.map((key) => TRACKS[key].genre_name)).sort(byCountThenName);
  const exact = counts.map(([, count]) => (count * 100) / tracks.length);
  const percentages = exact.map(Math.floor);
  const missing = 100 - percentages.reduce((sum, value) => sum + value, 0);

  exact
    .map((value, index) => ({ index, remainder: value - Math.floor(value) }))
    .sort((a, b) => b.remainder - a.remainder || a.index - b.index)
    .slice(0, missing)
    .forEach(({ index }) => {
      percentages[index] += 1;
    });

  return counts.map(([genre_name, count], index) => ({
    count,
    genre_name,
    percentage: percentages[index]
  }));
}

function rankTaggedUsers(months: MonthFixture[]): RetrospectiveTaggedUser[] {
  const totals = new Map<Friend, number>();
  months.forEach((month) =>
    Object.entries(month.tags).forEach(([friend, count]) =>
      totals.set(friend as Friend, (totals.get(friend as Friend) ?? 0) + (count ?? 0))
    )
  );

  return [...totals.entries()].sort(byCountThenName).map(([username, tag_count]) => ({
    profile_picture_url: null,
    tag_count,
    user_id: `mock-user-${username}`,
    username
  }));
}

function featuredSong(tracks: TrackKey[]) {
  const [top] = countBy(tracks).sort(([keyA, countA], [keyB, countB]) => {
    return countB - countA || tracks.indexOf(keyA) - tracks.indexOf(keyB);
  });

  if (!top) return null;

  const [key, memory_count] = top;
  const track = TRACKS[key];
  return {
    deezer_track_id: track.deezer_track_id,
    memory_count,
    song_artist_name: track.song_artist_name,
    song_cover_url: track.song_cover_url,
    song_preview_url: `/api/v1/music/tracks/${track.deezer_track_id}/preview`,
    song_title: track.song_title
  };
}

function monthLabel(year: number, month: number) {
  return `${MONTH_NAMES[month - 1]} ${year}`;
}

function yearLabel(year: number) {
  return `Ano de ${year}`;
}

function monthsOf(period: RetrospectivePeriodSelection) {
  if (period.period_type === "YEARLY") {
    return CLOSED_YEARS.includes(period.year)
      ? MONTHS.filter((month) => month.year === period.year)
      : [];
  }

  return MONTHS.filter((month) => month.year === period.year && month.month === period.month);
}

function buildDetails(
  period: RetrospectivePeriodSelection,
  months: MonthFixture[]
): RetrospectiveDetailsResponse {
  const tracks = months.flatMap((month) => month.tracks);
  const isYearly = period.period_type === "YEARLY";

  return {
    active_days: months.reduce((sum, month) => sum + month.active_days, 0),
    engagement: {
      comments_received: months.reduce((sum, month) => sum + month.comments, 0),
      likes_received: months.reduce((sum, month) => sum + month.likes, 0)
    },
    featured_song: featuredSong(tracks),
    is_preview: !isYearly && months.some((month) => month.is_preview),
    label: isYearly ? yearLabel(period.year) : monthLabel(period.year, period.month ?? 1),
    max_streak: Math.max(...months.map((month) => month.max_streak)),
    month: isYearly ? null : period.month,
    period_type: period.period_type,
    tagged_users: rankTaggedUsers(months),
    top_artists: rankArtists(tracks),
    top_genres: rankGenres(tracks),
    total_recordas: tracks.length,
    year: period.year
  };
}

function availablePeriods(): RetrospectivePeriod[] {
  const years = [...new Set(MONTHS.map((month) => month.year))].sort((a, b) => b - a);

  return years.flatMap((year) => {
    const months: RetrospectivePeriod[] = MONTHS.filter((month) => month.year === year)
      .sort((a, b) => b.month - a.month)
      .map((month) => ({
        is_preview: month.is_preview,
        label: monthLabel(year, month.month),
        month: month.month,
        period_type: "MONTHLY",
        total_memories: month.tracks.length,
        year
      }));

    if (!CLOSED_YEARS.includes(year)) return months;

    return [
      ...months,
      {
        is_preview: false,
        label: yearLabel(year),
        month: null,
        period_type: "YEARLY",
        total_memories: months.reduce((sum, month) => sum + month.total_memories, 0),
        year
      }
    ];
  });
}

export const retrospectiveServiceMock: RetrospectiveService = {
  async getAvailablePeriods(signal): Promise<AvailableRetrospectivesResponse> {
    throwIfAborted(signal);
    return { periods: availablePeriods() };
  },
  async getRetrospective(period, signal) {
    assertRetrospectivePeriod(period);
    throwIfAborted(signal);
    const months = monthsOf(period);
    return months.length > 0 ? buildDetails(period, months) : null;
  }
};

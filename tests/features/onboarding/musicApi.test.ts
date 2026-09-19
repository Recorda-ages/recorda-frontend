import { getPopularTracks, saveMusicPreferences, searchTracks } from "@/features/onboarding";

jest.mock("@/services/storage", () => ({
  secureStorage: {
    getItem: jest.fn(async () => "token-123"),
    removeItem: jest.fn(),
    setItem: jest.fn()
  }
}));

const fetchMock = jest.fn();
globalThis.fetch = fetchMock as unknown as typeof fetch;

function jsonResponse(body: unknown) {
  return {
    ok: true,
    status: 200,
    headers: { get: () => "application/json" },
    json: async () => body
  };
}

beforeEach(() => fetchMock.mockReset());

it("maps the track search response to the screen model", async () => {
  fetchMock.mockResolvedValue(
    jsonResponse([
      {
        id: 916424,
        title: "Tempo Perdido",
        artist: "Legião Urbana",
        album: "Dois",
        cover_url: "https://cdn/cover.jpg",
        preview_url: null,
        genre_id: 152
      },
      {
        id: 3135556,
        title: "Evidências",
        artist: "Chitãozinho & Xororó",
        album: "Cowboy do Asfalto",
        cover_url: null,
        preview_url: null,
        genre_id: null
      }
    ])
  );

  const tracks = await searchTracks("tempo perdido", new AbortController().signal);

  expect(fetchMock.mock.calls[0]?.[0]).toBe(
    "http://localhost:8000/api/v1/music/tracks/search?q=tempo%20perdido"
  );
  expect(tracks).toEqual([
    {
      id: 916424,
      title: "Tempo Perdido",
      artist: "Legião Urbana",
      artworkUrl: "https://cdn/cover.jpg"
    },
    { id: 3135556, title: "Evidências", artist: "Chitãozinho & Xororó", artworkUrl: undefined }
  ]);
});

it("maps the popular tracks response to the screen model", async () => {
  fetchMock.mockResolvedValue(
    jsonResponse([
      {
        id: 916424,
        title: "Tempo Perdido",
        artist: "Legião Urbana",
        album: "Dois",
        cover_url: "https://cdn/cover.jpg",
        preview_url: null,
        genre_id: 152
      }
    ])
  );

  const tracks = await getPopularTracks(new AbortController().signal);

  expect(fetchMock.mock.calls[0]?.[0]).toBe("http://localhost:8000/api/v1/music/tracks/popular");
  expect(tracks).toEqual([
    {
      id: 916424,
      title: "Tempo Perdido",
      artist: "Legião Urbana",
      artworkUrl: "https://cdn/cover.jpg"
    }
  ]);
});

it("sends the three steps as the backend music preferences payload", async () => {
  fetchMock.mockResolvedValue(jsonResponse({ onboarding_completed: true }));

  await saveMusicPreferences({
    artists: [
      { id: 10, name: "Legião Urbana", pictureUrl: "https://cdn/legiao.jpg" },
      { id: 20, name: "Tribalistas" },
      { id: 30, name: "Toquinho" }
    ],
    genres: [
      { id: 152, name: "Rock" },
      { id: 116, name: "Rap" },
      { id: 132, name: "Pop" }
    ],
    track: {
      id: 916424,
      title: "Tempo Perdido",
      artist: "Legião Urbana",
      artworkUrl: "https://cdn/cover.jpg",
      previewUrl: "https://cdn/preview.mp3"
    }
  });

  const [url, init] = fetchMock.mock.calls[0] ?? [];
  expect(url).toBe("http://localhost:8000/api/v1/users/me/music-preferences");
  expect(init.method).toBe("POST");
  expect(init.headers.Authorization).toBe("Bearer token-123");
  expect(JSON.parse(init.body)).toEqual({
    artists: [
      { deezer_id: 10, name: "Legião Urbana", picture_url: "https://cdn/legiao.jpg" },
      { deezer_id: 20, name: "Tribalistas", picture_url: null },
      { deezer_id: 30, name: "Toquinho", picture_url: null }
    ],
    genres: [
      { deezer_id: 152, name: "Rock", picture_url: null },
      { deezer_id: 116, name: "Rap", picture_url: null },
      { deezer_id: 132, name: "Pop", picture_url: null }
    ],
    favorite_track: {
      deezer_id: 916424,
      title: "Tempo Perdido",
      artist_name: "Legião Urbana",
      cover_url: "https://cdn/cover.jpg",
      preview_url: "https://cdn/preview.mp3"
    }
  });
});

it("sends an empty cover and null preview when the favorite track has none", async () => {
  fetchMock.mockResolvedValue(jsonResponse({ onboarding_completed: true }));
  const selection = { id: 1, name: "X" };

  await saveMusicPreferences({
    artists: [selection],
    genres: [selection],
    track: { id: 1, title: "Evidências", artist: "Chitãozinho & Xororó" }
  });

  const [, init] = fetchMock.mock.calls[0] ?? [];
  expect(JSON.parse(init.body).favorite_track).toEqual({
    deezer_id: 1,
    title: "Evidências",
    artist_name: "Chitãozinho & Xororó",
    cover_url: "",
    preview_url: null
  });
});

import { apiClient } from "@/services/api";
import { musicService } from "@/features/music/services/musicService";

jest.mock("@/services/api", () => ({
  apiClient: { get: jest.fn() },
}));

const mockGet = apiClient.get as jest.Mock;

const GENRES = [{ id: 1, name: "Pop", picture_url: null }];
const ARTISTS = [{ id: 10, name: "Eminem", picture_url: null }];
const TRACKS = [
  {
    id: 100,
    title: "Lose Yourself",
    artist: "Eminem",
    album: "8 Mile",
    cover_url: null,
    preview_url: null,
    genre_id: 1,
  },
];

beforeEach(() => mockGet.mockReset());

describe("musicService.getGenres", () => {
  it("calls the correct endpoint and returns genres", async () => {
    mockGet.mockResolvedValueOnce(GENRES);

    const result = await musicService.getGenres();

    expect(mockGet).toHaveBeenCalledWith("/music/genres");
    expect(result).toEqual(GENRES);
  });
});

describe("musicService.searchArtists", () => {
  it("calls the correct endpoint with the encoded query", async () => {
    mockGet.mockResolvedValueOnce(ARTISTS);

    const result = await musicService.searchArtists("Eminem");

    expect(mockGet).toHaveBeenCalledWith("/music/artists/search?q=Eminem");
    expect(result).toEqual(ARTISTS);
  });

  it("encodes special characters in the query", async () => {
    mockGet.mockResolvedValueOnce([]);

    await musicService.searchArtists("AC/DC");

    expect(mockGet).toHaveBeenCalledWith("/music/artists/search?q=AC%2FDC");
  });
});

describe("musicService.searchTracks", () => {
  it("calls the correct endpoint with the encoded query", async () => {
    mockGet.mockResolvedValueOnce(TRACKS);

    const result = await musicService.searchTracks("Lose Yourself");

    expect(mockGet).toHaveBeenCalledWith(
      "/music/tracks/search?q=Lose%20Yourself"
    );
    expect(result).toEqual(TRACKS);
  });
});

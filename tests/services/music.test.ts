import { searchArtists } from "@/services/api/music";
import { apiClient } from "@/services/api/client";

jest.mock("@/services/api/client", () => ({
  apiClient: {
    get: jest.fn()
  }
}));

describe("searchArtists", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("returns empty array if query is empty or whitespace", async () => {
    const resultEmpty = await searchArtists("");
    const resultWhitespace = await searchArtists("   ");

    expect(resultEmpty).toEqual([]);
    expect(resultWhitespace).toEqual([]);
    expect(apiClient.get).not.toHaveBeenCalled();
  });

  it("calls /music/artists/search with encoded query and formats response", async () => {
    const mockDeezerResponse = [
      {
        id: 13,
        name: "Eminem",
        picture_url: "https://e-cdns-images.dzcdn.net/images/artist/eminem.jpg"
      },
      {
        id: 27,
        name: "Daft Punk",
        picture_url: null
      }
    ];

    (apiClient.get as jest.Mock).mockResolvedValueOnce(mockDeezerResponse);

    const result = await searchArtists("Eminem & Daft");

    expect(apiClient.get).toHaveBeenCalledWith("/music/artists/search?q=Eminem%20%26%20Daft");
    expect(result).toEqual([
      {
        id: "13",
        name: "Eminem",
        imageUrl: "https://e-cdns-images.dzcdn.net/images/artist/eminem.jpg"
      },
      {
        id: "27",
        name: "Daft Punk",
        imageUrl: undefined
      }
    ]);
  });

  it("throws error when apiClient fails", async () => {
    (apiClient.get as jest.Mock).mockRejectedValueOnce(new Error("Not Found"));

    await expect(searchArtists("Coldplay")).rejects.toThrow("Not Found");
  });
});

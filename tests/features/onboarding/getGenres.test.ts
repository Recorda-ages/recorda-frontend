import { getGenres } from "@/features/onboarding/api/getGenres";
import { apiClient } from "@/services/api";

jest.mock("@/services/api", () => ({
  apiClient: {
    get: jest.fn()
  }
}));

const mockedGet = jest.mocked(apiClient.get);

describe("getGenres", () => {
  beforeEach(() => {
    mockedGet.mockReset();
  });

  it("loads the normalized genre list from the music API", async () => {
    const genres = [
      { id: 1, imagem: "https://example.com/pop.jpg", nome: "Pop" },
      { id: 2, imagem: "https://example.com/rock.jpg", nome: "Rock" }
    ];
    mockedGet.mockResolvedValue(genres);

    await expect(getGenres()).resolves.toEqual(genres);
    expect(mockedGet).toHaveBeenCalledWith("/music/genres");
  });
});

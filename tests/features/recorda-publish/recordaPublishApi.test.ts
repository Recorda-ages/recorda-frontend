import { apiClient } from "@/services/api";
import { secureStorage } from "@/services/storage";
import {
  createRecorda,
  uploadRecordaMedia
} from "@/features/recorda-publish/api/recordaPublishApi";
import type { CreateRecordaPayload, RecordaMediaDraft } from "@/features/recorda-publish/types";

jest.mock("@/services/api", () => ({
  apiClient: {
    post: jest.fn()
  }
}));

jest.mock("@/services/storage", () => ({
  secureStorage: {
    getItem: jest.fn(async () => "token-123")
  }
}));

const mockedPost = apiClient.post as jest.Mock;
const mockedGetItem = secureStorage.getItem as jest.Mock;

describe("recordaPublishApi", () => {
  beforeEach(() => {
    mockedPost.mockReset();
    mockedGetItem.mockReset();
    mockedGetItem.mockResolvedValue("token-123");
  });

  describe("uploadRecordaMedia", () => {
    const media: RecordaMediaDraft = {
      fileName: "recorda.jpg",
      mimeType: "image/jpeg",
      type: "PHOTO",
      uri: "file:///tmp/recorda.jpg"
    };

    it("posts the media as multipart form data to /recordas/media", async () => {
      mockedPost.mockResolvedValueOnce({ url: "https://cdn.example.com/recorda.jpg" });
      const appendSpy = jest.spyOn(FormData.prototype, "append");

      await uploadRecordaMedia(media);

      expect(mockedPost).toHaveBeenCalledTimes(1);
      const [path, body] = mockedPost.mock.calls[0] as [string, FormData];
      expect(path).toBe("/recordas/media");
      expect(body).toBeInstanceOf(FormData);
      // FormData.getParts() only exists on RN's native polyfill, not in this
      // test environment's FormData, so the append call itself is asserted.
      expect(appendSpy).toHaveBeenCalledWith("file", {
        name: media.fileName,
        type: media.mimeType,
        uri: media.uri
      });

      appendSpy.mockRestore();
    });

    it("attaches the Bearer token from secure storage", async () => {
      mockedPost.mockResolvedValueOnce({ url: "https://cdn.example.com/recorda.jpg" });

      await uploadRecordaMedia(media);

      const [, , options] = mockedPost.mock.calls[0] as [string, FormData, { headers: Record<string, string> }];
      expect(options.headers).toEqual({ Authorization: "Bearer token-123" });
    });

    it("omits the Authorization header when there is no stored token", async () => {
      mockedGetItem.mockResolvedValueOnce(null);
      mockedPost.mockResolvedValueOnce({ url: "https://cdn.example.com/recorda.jpg" });

      await uploadRecordaMedia(media);

      const [, , options] = mockedPost.mock.calls[0] as [string, FormData, undefined];
      expect(options).toBeUndefined();
    });

    it("maps the upload url response to { mediaUrl } without assuming a mediaId", async () => {
      mockedPost.mockResolvedValueOnce({ url: "https://cdn.example.com/recorda.jpg" });

      const result = await uploadRecordaMedia(media);

      expect(result).toEqual({ mediaUrl: "https://cdn.example.com/recorda.jpg" });
    });

    it("keeps compatibility with media_url upload responses", async () => {
      mockedPost.mockResolvedValueOnce({ media_url: "https://cdn.example.com/recorda.jpg" });

      const result = await uploadRecordaMedia(media);

      expect(result).toEqual({ mediaUrl: "https://cdn.example.com/recorda.jpg" });
    });

    it("fails clearly when upload response does not include a media link", async () => {
      mockedPost.mockResolvedValueOnce({});

      await expect(uploadRecordaMedia(media)).rejects.toThrow(
        "Resposta de upload de mídia inválida."
      );
    });
  });

  describe("createRecorda", () => {
    const payload: CreateRecordaPayload = {
      mediaType: "PHOTO",
      mediaUrl: "https://cdn.example.com/recorda.jpg",
      song: {
        artistName: "Artist",
        coverUrl: "https://cdn.example.com/cover.jpg",
        deezerTrackId: "12345",
        previewUrl: "https://cdn.example.com/preview.mp3",
        title: "Song Title"
      }
    };

    it("adapts the payload to the legacy Recorda schema (midia/music/description)", async () => {
      // Schema legado da Recorda: sem colunas para snapshot musical (ver ADR 0001).
      // song.artistName/coverUrl/previewUrl/deezerTrackId não são enviados nesta etapa.
      mockedPost.mockResolvedValueOnce({});

      await createRecorda({ ...payload, description: "legenda opcional" });

      expect(mockedPost).toHaveBeenCalledWith(
        "/recordas",
        {
          description: "legenda opcional",
          midia: "https://cdn.example.com/recorda.jpg",
          music: "Song Title"
        },
        { headers: { Authorization: "Bearer token-123" } }
      );
    });

    it("omits the Authorization header when there is no stored token", async () => {
      mockedGetItem.mockResolvedValueOnce(null);
      mockedPost.mockResolvedValueOnce({});

      await createRecorda(payload);

      const [, , options] = mockedPost.mock.calls[0] as [string, unknown, undefined];
      expect(options).toBeUndefined();
    });

    it("leaves description undefined when it is not provided", async () => {
      mockedPost.mockResolvedValueOnce({});

      await createRecorda(payload);

      // apiClient serializes with JSON.stringify, which drops undefined keys.
      const [, body] = mockedPost.mock.calls[0] as [string, { description?: string }];
      expect(body.description).toBeUndefined();
    });

    it("resolves with whatever the backend returns, without assuming its shape", async () => {
      const backendResponse = { anything: "the real shape is still undefined" };
      mockedPost.mockResolvedValueOnce(backendResponse);

      const result = await createRecorda(payload);

      expect(result).toBe(backendResponse);
    });
  });
});

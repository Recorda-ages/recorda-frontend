import { apiClient } from "@/services/api";
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

const mockedPost = apiClient.post as jest.Mock;

describe("recordaPublishApi", () => {
  beforeEach(() => {
    mockedPost.mockReset();
  });

  describe("uploadRecordaMedia", () => {
    const media: RecordaMediaDraft = {
      fileName: "recorda.jpg",
      mimeType: "image/jpeg",
      type: "PHOTO",
      uri: "file:///tmp/recorda.jpg"
    };

    it("posts the media as multipart form data to /recordas/media", async () => {
      mockedPost.mockResolvedValueOnce({ media_url: "https://cdn.example.com/recorda.jpg" });
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

    it("maps the response to { mediaUrl } without assuming a mediaId", async () => {
      mockedPost.mockResolvedValueOnce({ media_url: "https://cdn.example.com/recorda.jpg" });

      const result = await uploadRecordaMedia(media);

      expect(result).toEqual({ mediaUrl: "https://cdn.example.com/recorda.jpg" });
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

    it("posts the media link, media type, song snapshot and description to /recordas", async () => {
      mockedPost.mockResolvedValueOnce({});

      await createRecorda({ ...payload, description: "legenda opcional" });

      expect(mockedPost).toHaveBeenCalledWith("/recordas", {
        deezer_track_id: "12345",
        description: "legenda opcional",
        media_type: "PHOTO",
        media_url: "https://cdn.example.com/recorda.jpg",
        song_artist_name: "Artist",
        song_cover_url: "https://cdn.example.com/cover.jpg",
        song_preview_url: "https://cdn.example.com/preview.mp3",
        song_title: "Song Title"
      });
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

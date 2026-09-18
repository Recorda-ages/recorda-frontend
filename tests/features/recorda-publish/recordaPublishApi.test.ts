import { File } from "expo-file-system";

import { authApiClient } from "@/services/api";
import {
  createRecorda,
  MEDIA_UPLOAD_TIMEOUT_MS,
  uploadRecordaMedia
} from "@/features/recorda-publish/api/recordaPublishApi";
import type { CreateRecordaPayload, RecordaMediaDraft } from "@/features/recorda-publish/types";

jest.mock("@/services/api", () => ({
  authApiClient: {
    post: jest.fn()
  }
}));

const mockedPost = authApiClient.post as jest.Mock;

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

    it("sends the media as a file part supported by expo/fetch", async () => {
      mockedPost.mockResolvedValueOnce({ url: "/api/v1/recordas/media/abc.jpg" });
      const appendSpy = jest.spyOn(FormData.prototype, "append");

      await uploadRecordaMedia(media);

      expect(mockedPost).toHaveBeenCalledTimes(1);
      const [path, body, options] = mockedPost.mock.calls[0] as [
        string,
        FormData,
        { timeoutMs: number }
      ];
      expect(path).toBe("/recordas/media");
      expect(body).toBeInstanceOf(FormData);
      expect(options).toEqual({ timeoutMs: MEDIA_UPLOAD_TIMEOUT_MS });
      const [field, filePart, fileName] = appendSpy.mock.calls[0] as [string, File, string];
      expect(field).toBe("file");
      expect(filePart).toBeInstanceOf(File);
      expect(filePart.uri).toBe(media.uri);
      expect(fileName).toBe(media.fileName);

      appendSpy.mockRestore();
    });

    it("maps the upload url response to { mediaUrl }", async () => {
      mockedPost.mockResolvedValueOnce({ url: "/api/v1/recordas/media/abc.jpg" });

      await expect(uploadRecordaMedia(media)).resolves.toEqual({
        mediaUrl: "/api/v1/recordas/media/abc.jpg"
      });
    });

    it("keeps compatibility with media_url upload responses", async () => {
      mockedPost.mockResolvedValueOnce({ media_url: "https://cdn.example.com/recorda.jpg" });

      await expect(uploadRecordaMedia(media)).resolves.toEqual({
        mediaUrl: "https://cdn.example.com/recorda.jpg"
      });
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
      mediaUrl: "/api/v1/recordas/media/abc.jpg",
      song: {
        artistName: "Artist",
        coverUrl: "https://cdn.example.com/cover.jpg",
        deezerTrackId: "12345",
        previewUrl: "https://cdn.example.com/preview.mp3",
        title: "Song Title"
      }
    };

    it("sends the media link, media type and song snapshot", async () => {
      mockedPost.mockResolvedValueOnce({ recorda_id: "recorda-1" });

      await createRecorda({ ...payload, description: "legenda opcional" });

      expect(mockedPost).toHaveBeenCalledWith("/recordas", {
        deezer_track_id: "12345",
        description: "legenda opcional",
        media_type: "PHOTO",
        media_url: "/api/v1/recordas/media/abc.jpg",
        song_artist_name: "Artist",
        song_cover_url: "https://cdn.example.com/cover.jpg",
        song_preview_url: "https://cdn.example.com/preview.mp3",
        song_title: "Song Title"
      });
    });

    it("never sends the legacy midia and music fields", async () => {
      mockedPost.mockResolvedValueOnce({ recorda_id: "recorda-1" });

      await createRecorda(payload);

      const [, body] = mockedPost.mock.calls[0] as [string, Record<string, unknown>];
      expect(body).not.toHaveProperty("midia");
      expect(body).not.toHaveProperty("music");
    });

    it("sends a null preview when the song has none", async () => {
      mockedPost.mockResolvedValueOnce({ recorda_id: "recorda-1" });

      await createRecorda({ ...payload, song: { ...payload.song, previewUrl: undefined } });

      const [, body] = mockedPost.mock.calls[0] as [string, { song_preview_url: string | null }];
      expect(body.song_preview_url).toBeNull();
    });

    it("sends an empty cover when the song has none", async () => {
      mockedPost.mockResolvedValueOnce({ recorda_id: "recorda-1" });

      await createRecorda({ ...payload, song: { ...payload.song, coverUrl: "" } });

      const [, body] = mockedPost.mock.calls[0] as [string, { song_cover_url: string }];
      expect(body.song_cover_url).toBe("");
    });

    it("leaves description undefined when it is not provided", async () => {
      mockedPost.mockResolvedValueOnce({ recorda_id: "recorda-1" });

      await createRecorda(payload);

      const [, body] = mockedPost.mock.calls[0] as [string, { description?: string }];
      expect(body.description).toBeUndefined();
    });

    it("resolves with the created recorda", async () => {
      const backendResponse = { recorda_id: "recorda-7", user_id: "user-1" };
      mockedPost.mockResolvedValueOnce(backendResponse);

      await expect(createRecorda(payload)).resolves.toBe(backendResponse);
    });
  });
});

import { act, renderHook, waitFor } from "@testing-library/react-native";

import {
  createRecorda,
  uploadRecordaMedia
} from "@/features/recorda-publish/api/recordaPublishApi";
import { usePublishRecorda } from "@/features/recorda-publish/hooks/usePublishRecorda";
import type { PublishRecordaDraft } from "@/features/recorda-publish/types";

jest.mock("@/features/recorda-publish/api/recordaPublishApi", () => ({
  createRecorda: jest.fn(),
  uploadRecordaMedia: jest.fn()
}));

const mockedUpload = uploadRecordaMedia as jest.Mock;
const mockedCreate = createRecorda as jest.Mock;

const draft: PublishRecordaDraft = {
  description: "uma legenda",
  media: {
    fileName: "recorda.jpg",
    mimeType: "image/jpeg",
    type: "PHOTO",
    uri: "file:///tmp/recorda.jpg"
  },
  song: {
    artistName: "Artist",
    coverUrl: "https://cdn.example.com/cover.jpg",
    deezerTrackId: "12345",
    previewUrl: "https://cdn.example.com/preview.mp3",
    title: "Song Title"
  }
};

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, reject, resolve };
}

describe("usePublishRecorda", () => {
  beforeEach(() => {
    mockedUpload.mockReset();
    mockedCreate.mockReset();
  });

  it("goes upload -> create -> success on the happy path", async () => {
    mockedUpload.mockResolvedValueOnce({ mediaUrl: "https://cdn.example.com/a.jpg" });
    mockedCreate.mockResolvedValueOnce({});

    const { result } = renderHook(() => usePublishRecorda());

    await act(async () => {
      await result.current.publish(draft);
    });

    expect(mockedUpload).toHaveBeenCalledWith(draft.media);
    expect(mockedCreate).toHaveBeenCalledWith({
      description: draft.description,
      mediaType: draft.media.type,
      mediaUrl: "https://cdn.example.com/a.jpg",
      song: draft.song
    });
    expect(result.current.status).toBe("success");
    expect(result.current.error).toBeNull();
  });

  it("does not call createRecorda when the upload fails", async () => {
    mockedUpload.mockRejectedValueOnce(new Error("network down"));

    const { result } = renderHook(() => usePublishRecorda());

    await act(async () => {
      await result.current.publish(draft);
    });

    expect(mockedCreate).not.toHaveBeenCalled();
    expect(result.current.status).toBe("error");
    expect(result.current.error).toEqual({ message: "network down", step: "upload" });
  });

  it("retries the upload when the previous attempt failed at the upload step", async () => {
    mockedUpload.mockRejectedValueOnce(new Error("network down"));

    const { result } = renderHook(() => usePublishRecorda());

    await act(async () => {
      await result.current.publish(draft);
    });

    mockedUpload.mockResolvedValueOnce({ mediaUrl: "https://cdn.example.com/a.jpg" });
    mockedCreate.mockResolvedValueOnce({});

    await act(async () => {
      await result.current.retry(draft);
    });

    expect(mockedUpload).toHaveBeenCalledTimes(2);
    expect(mockedCreate).toHaveBeenCalledTimes(1);
    expect(result.current.status).toBe("success");
    expect(result.current.error).toBeNull();
  });

  it("keeps the obtained mediaUrl in the error state when creation fails", async () => {
    mockedUpload.mockResolvedValueOnce({ mediaUrl: "https://cdn.example.com/a.jpg" });
    mockedCreate.mockRejectedValueOnce(new Error("validation failed"));

    const { result } = renderHook(() => usePublishRecorda());

    await act(async () => {
      await result.current.publish(draft);
    });

    expect(result.current.status).toBe("error");
    expect(result.current.error).toEqual({ message: "validation failed", step: "create" });
  });

  it("retries only createRecorda, without a new upload, when creation fails", async () => {
    mockedUpload.mockResolvedValueOnce({ mediaUrl: "https://cdn.example.com/a.jpg" });
    mockedCreate.mockRejectedValueOnce(new Error("validation failed"));

    const { result } = renderHook(() => usePublishRecorda());

    await act(async () => {
      await result.current.publish(draft);
    });

    mockedCreate.mockResolvedValueOnce({});

    await act(async () => {
      await result.current.retry(draft);
    });

    expect(mockedUpload).toHaveBeenCalledTimes(1);
    expect(mockedCreate).toHaveBeenCalledTimes(2);
    expect(mockedCreate).toHaveBeenLastCalledWith(
      expect.objectContaining({ mediaUrl: "https://cdn.example.com/a.jpg" })
    );
    expect(result.current.status).toBe("success");
  });

  it("ignores a duplicate publish call while a submission is in flight", async () => {
    let resolveUpload: (value: { mediaUrl: string }) => void = () => undefined;
    mockedUpload.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveUpload = resolve;
        })
    );
    mockedCreate.mockResolvedValueOnce({});

    const { result } = renderHook(() => usePublishRecorda());

    await act(async () => {
      const firstCall = result.current.publish(draft);
      const secondCall = result.current.publish(draft);
      resolveUpload({ mediaUrl: "https://cdn.example.com/a.jpg" });
      await Promise.all([firstCall, secondCall]);
    });

    expect(mockedUpload).toHaveBeenCalledTimes(1);
    expect(result.current.status).toBe("success");
  });

  it("does nothing when retry is called outside of the error state", async () => {
    const { result } = renderHook(() => usePublishRecorda());

    await act(async () => {
      await result.current.retry(draft);
    });

    expect(mockedUpload).not.toHaveBeenCalled();
    expect(mockedCreate).not.toHaveBeenCalled();
    expect(result.current.status).toBe("idle");

    mockedUpload.mockResolvedValueOnce({ mediaUrl: "https://cdn.example.com/a.jpg" });
    mockedCreate.mockResolvedValueOnce({});

    await act(async () => {
      await result.current.publish(draft);
    });

    await act(async () => {
      await result.current.retry(draft);
    });

    expect(mockedUpload).toHaveBeenCalledTimes(1);
    expect(mockedCreate).toHaveBeenCalledTimes(1);
    expect(result.current.status).toBe("success");
  });

  it("publish() after a previous attempt starts a brand-new attempt", async () => {
    mockedUpload.mockResolvedValueOnce({ mediaUrl: "https://cdn.example.com/a.jpg" });
    mockedCreate.mockRejectedValueOnce(new Error("validation failed"));

    const { result } = renderHook(() => usePublishRecorda());

    await act(async () => {
      await result.current.publish(draft);
    });

    expect(result.current.status).toBe("error");

    mockedUpload.mockResolvedValueOnce({ mediaUrl: "https://cdn.example.com/b.jpg" });
    mockedCreate.mockResolvedValueOnce({});

    await act(async () => {
      await result.current.publish(draft);
    });

    expect(mockedUpload).toHaveBeenCalledTimes(2);
    expect(mockedCreate).toHaveBeenLastCalledWith(
      expect.objectContaining({ mediaUrl: "https://cdn.example.com/b.jpg" })
    );
    expect(result.current.status).toBe("success");
    expect(result.current.error).toBeNull();
  });

  it("reports status as uploading while the upload is pending and creating while the creation is pending", async () => {
    const uploadDeferred = createDeferred<{ mediaUrl: string }>();
    const createDeferredResult = createDeferred<unknown>();
    mockedUpload.mockReturnValueOnce(uploadDeferred.promise);
    mockedCreate.mockReturnValueOnce(createDeferredResult.promise);

    const { result } = renderHook(() => usePublishRecorda());

    let publishPromise!: Promise<void>;
    act(() => {
      publishPromise = result.current.publish(draft);
    });

    await waitFor(() => expect(result.current.status).toBe("uploading"));
    expect(mockedCreate).not.toHaveBeenCalled();

    act(() => {
      uploadDeferred.resolve({ mediaUrl: "https://cdn.example.com/a.jpg" });
    });

    await waitFor(() => expect(result.current.status).toBe("creating"));

    await act(async () => {
      createDeferredResult.resolve({});
      await publishPromise;
    });

    expect(result.current.status).toBe("success");
  });

  it("ignores retry() while a submission is already in progress", async () => {
    const uploadDeferred = createDeferred<{ mediaUrl: string }>();
    mockedUpload.mockReturnValueOnce(uploadDeferred.promise);
    mockedCreate.mockResolvedValueOnce({});

    const { result } = renderHook(() => usePublishRecorda());

    let publishPromise!: Promise<void>;
    act(() => {
      publishPromise = result.current.publish(draft);
    });

    await waitFor(() => expect(result.current.status).toBe("uploading"));

    await act(async () => {
      await result.current.retry(draft);
    });

    expect(mockedUpload).toHaveBeenCalledTimes(1);
    expect(mockedCreate).not.toHaveBeenCalled();
    expect(result.current.status).toBe("uploading");

    await act(async () => {
      uploadDeferred.resolve({ mediaUrl: "https://cdn.example.com/a.jpg" });
      await publishPromise;
    });

    expect(result.current.status).toBe("success");
  });

  it("re-uploads on retry when the media changed since the failed create attempt", async () => {
    mockedUpload.mockResolvedValueOnce({ mediaUrl: "https://cdn.example.com/a.jpg" });
    mockedCreate.mockRejectedValueOnce(new Error("validation failed"));

    const { result } = renderHook(() => usePublishRecorda());

    await act(async () => {
      await result.current.publish(draft);
    });

    expect(result.current.status).toBe("error");

    const changedDraft: PublishRecordaDraft = {
      ...draft,
      media: { ...draft.media, uri: "file:///tmp/another.jpg" }
    };

    mockedUpload.mockResolvedValueOnce({ mediaUrl: "https://cdn.example.com/b.jpg" });
    mockedCreate.mockResolvedValueOnce({});

    await act(async () => {
      await result.current.retry(changedDraft);
    });

    expect(mockedUpload).toHaveBeenCalledTimes(2);
    expect(mockedUpload).toHaveBeenLastCalledWith(changedDraft.media);
    expect(mockedCreate).toHaveBeenLastCalledWith(
      expect.objectContaining({ mediaUrl: "https://cdn.example.com/b.jpg" })
    );
    expect(result.current.status).toBe("success");
  });
});

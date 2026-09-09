import { useRef, useState } from "react";

import { createRecorda, uploadRecordaMedia } from "../api/recordaPublishApi";
import type { PublishRecordaDraft } from "../types";

export type PublishStatus = "creating" | "error" | "idle" | "success" | "uploading";

export type PublishErrorStep = "create" | "upload";

export type PublishError = {
  message: string;
  step: PublishErrorStep;
};

type UsePublishRecordaResult = {
  error: PublishError | null;
  publish: (draft: PublishRecordaDraft) => Promise<void>;
  retry: (draft: PublishRecordaDraft) => Promise<void>;
  status: PublishStatus;
};

export function usePublishRecorda(): UsePublishRecordaResult {
  const [status, setStatus] = useState<PublishStatus>("idle");
  const [error, setError] = useState<PublishError | null>(null);
  const mediaUrlRef = useRef<string | null>(null);
  const mediaUriRef = useRef<string | null>(null);
  const isSubmittingRef = useRef(false);

  async function attempt(draft: PublishRecordaDraft, skipUpload: boolean) {
    let step: PublishErrorStep = skipUpload ? "create" : "upload";
    let mediaUrl = mediaUrlRef.current;

    try {
      if (!skipUpload) {
        setStatus("uploading");
        const uploadResult = await uploadRecordaMedia(draft.media);
        mediaUrl = uploadResult.mediaUrl;
        mediaUrlRef.current = mediaUrl;
        mediaUriRef.current = draft.media.uri;
      }

      step = "create";
      setStatus("creating");
      await createRecorda({
        description: draft.description,
        mediaType: draft.media.type,
        mediaUrl: mediaUrl as string,
        song: draft.song
      });

      // Ends here on purpose: navigating to the Feed (team decision, not the
      // Profile originally described) and clearing the draft are the caller's job.
      setStatus("success");
    } catch (caughtError) {
      setError({ message: toErrorMessage(caughtError), step });
      setStatus("error");
    } finally {
      isSubmittingRef.current = false;
    }
  }

  async function publish(draft: PublishRecordaDraft) {
    if (isSubmittingRef.current) {
      return;
    }

    isSubmittingRef.current = true;
    mediaUrlRef.current = null;
    mediaUriRef.current = null;
    setError(null);
    await attempt(draft, false);
  }

  async function retry(draft: PublishRecordaDraft) {
    if (isSubmittingRef.current || status !== "error") {
      return;
    }

    isSubmittingRef.current = true;
    // Only reuse the cached mediaUrl if it came from this same media file;
    // otherwise the media changed since the failed attempt and must be re-uploaded.
    const skipUpload =
      error?.step === "create" &&
      mediaUrlRef.current !== null &&
      mediaUriRef.current === draft.media.uri;
    setError(null);
    await attempt(draft, skipUpload);
  }

  return { error, publish, retry, status };
}

function toErrorMessage(caughtError: unknown): string {
  return caughtError instanceof Error ? caughtError.message : "Unknown error";
}

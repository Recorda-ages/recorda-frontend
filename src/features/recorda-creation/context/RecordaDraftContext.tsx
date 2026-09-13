import type { PropsWithChildren } from "react";
import { createContext, useCallback, useContext, useMemo, useState } from "react";

import type { RecordaDraft, RecordaDraftMedia, RecordaDraftSong } from "../types";

export type DraftMedia = RecordaDraftMedia;

type RecordaDraftContextValue = RecordaDraft & {
  clearMedia: () => void;
  reset: () => void;
  setDescription: (description: string) => void;
  setMedia: (media: RecordaDraftMedia) => void;
  setSong: (song: RecordaDraftSong | null) => void;
};

const EMPTY_DRAFT: RecordaDraft = { description: "", media: null, song: null };

const RecordaDraftContext = createContext<RecordaDraftContextValue | undefined>(undefined);

export function RecordaDraftProvider({ children }: PropsWithChildren) {
  const [draft, setDraft] = useState<RecordaDraft>(EMPTY_DRAFT);

  const setMedia = useCallback((media: RecordaDraftMedia) => {
    setDraft((current) =>
      current.media?.uri === media.uri && current.media.type === media.type
        ? current
        : { ...current, media, song: null }
    );
  }, []);

  const clearMedia = useCallback(() => {
    setDraft((current) => ({ ...current, media: null, song: null }));
  }, []);

  const setSong = useCallback((song: RecordaDraftSong | null) => {
    setDraft((current) => ({ ...current, song }));
  }, []);

  const setDescription = useCallback((description: string) => {
    setDraft((current) => ({ ...current, description }));
  }, []);

  const reset = useCallback(() => setDraft(EMPTY_DRAFT), []);

  const value = useMemo<RecordaDraftContextValue>(
    () => ({ ...draft, clearMedia, reset, setDescription, setMedia, setSong }),
    [clearMedia, draft, reset, setDescription, setMedia, setSong]
  );

  return <RecordaDraftContext.Provider value={value}>{children}</RecordaDraftContext.Provider>;
}

export function useRecordaDraft() {
  const context = useContext(RecordaDraftContext);

  if (!context) {
    throw new Error("useRecordaDraft precisa ser usado dentro de um RecordaDraftProvider");
  }

  return context;
}

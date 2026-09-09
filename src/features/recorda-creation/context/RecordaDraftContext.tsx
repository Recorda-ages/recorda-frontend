import type { PropsWithChildren } from "react";
import { createContext, useContext, useMemo, useState } from "react";

export type DraftMedia = {
  type: "photo" | "video";
  uri: string;
};

type RecordaDraftContextValue = {
  clearMedia: () => void;
  media: DraftMedia | null;
  setMedia: (media: DraftMedia) => void;
};

const RecordaDraftContext = createContext<RecordaDraftContextValue | undefined>(undefined);

export function RecordaDraftProvider({ children }: PropsWithChildren) {
  const [media, setMediaState] = useState<DraftMedia | null>(null);

  const value = useMemo<RecordaDraftContextValue>(
    () => ({
      clearMedia: () => setMediaState(null),
      media,
      setMedia: (newMedia: DraftMedia) => setMediaState(newMedia)
    }),
    [media]
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

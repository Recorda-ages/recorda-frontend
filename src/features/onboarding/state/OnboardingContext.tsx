import {
  createContext,
  type Dispatch,
  type PropsWithChildren,
  type SetStateAction,
  useCallback,
  useContext,
  useMemo,
  useState
} from "react";

import type { MusicSelection } from "../types";

type OnboardingContextValue = {
  reset: () => void;
  selectedArtists: MusicSelection[];
  selectedGenres: MusicSelection[];
  setSelectedArtists: Dispatch<SetStateAction<MusicSelection[]>>;
  setSelectedGenres: Dispatch<SetStateAction<MusicSelection[]>>;
};

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function OnboardingProvider({ children }: PropsWithChildren) {
  const [selectedArtists, setSelectedArtists] = useState<MusicSelection[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<MusicSelection[]>([]);

  const reset = useCallback(() => {
    setSelectedArtists([]);
    setSelectedGenres([]);
  }, []);

  const value = useMemo(
    () => ({
      reset,
      selectedArtists,
      selectedGenres,
      setSelectedArtists,
      setSelectedGenres
    }),
    [reset, selectedArtists, selectedGenres]
  );

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);

  if (!context) {
    throw new Error("useOnboarding must be used within an OnboardingProvider");
  }

  return context;
}

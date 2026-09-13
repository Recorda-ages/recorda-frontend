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

export type OnboardingContextValue = {
  selectedArtists: MusicSelection[];
  selectedGenres: MusicSelection[];
  setSelectedArtists: Dispatch<SetStateAction<MusicSelection[]>>;
  setSelectedGenres: Dispatch<SetStateAction<MusicSelection[]>>;
  toggleArtist: (artist: MusicSelection) => void;
  toggleGenre: (genre: MusicSelection) => void;
  clearSelections: () => void;
};

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function OnboardingProvider({ children }: PropsWithChildren) {
  const [selectedArtists, setSelectedArtists] = useState<MusicSelection[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<MusicSelection[]>([]);

  const toggleArtist = useCallback((artist: MusicSelection) => {
    setSelectedArtists((prev) => {
      const exists = prev.some((a) => a.id === artist.id);
      if (exists) {
        return prev.filter((a) => a.id !== artist.id);
      }
      return [...prev, artist];
    });
  }, []);

  const toggleGenre = useCallback((genre: MusicSelection) => {
    setSelectedGenres((prev) => {
      const exists = prev.some((g) => g.id === genre.id);
      if (exists) {
        return prev.filter((g) => g.id !== genre.id);
      }
      return [...prev, genre];
    });
  }, []);

  const clearSelections = useCallback(() => {
    setSelectedArtists([]);
    setSelectedGenres([]);
  }, []);

  const value = useMemo(
    () => ({
      selectedArtists,
      selectedGenres,
      setSelectedArtists,
      setSelectedGenres,
      toggleArtist,
      toggleGenre,
      clearSelections
    }),
    [selectedArtists, selectedGenres, toggleArtist, toggleGenre, clearSelections]
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

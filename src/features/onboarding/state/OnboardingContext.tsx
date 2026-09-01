import {
  createContext,
  type Dispatch,
  type PropsWithChildren,
  type SetStateAction,
  useContext,
  useMemo,
  useState
} from "react";

type OnboardingContextValue = {
  selectedArtistIds: number[];
  selectedGenreIds: number[];
  setSelectedArtistIds: Dispatch<SetStateAction<number[]>>;
  setSelectedGenreIds: Dispatch<SetStateAction<number[]>>;
};

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function OnboardingProvider({ children }: PropsWithChildren) {
  const [selectedArtistIds, setSelectedArtistIds] = useState<number[]>([]);
  const [selectedGenreIds, setSelectedGenreIds] = useState<number[]>([]);

  const value = useMemo(
    () => ({
      selectedArtistIds,
      selectedGenreIds,
      setSelectedArtistIds,
      setSelectedGenreIds
    }),
    [selectedArtistIds, selectedGenreIds]
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

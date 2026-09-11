import React, { createContext, useContext, useState, ReactNode } from "react";
import { Artist } from "@/types/artist";

interface OnboardingContextData {
  selectedArtists: Artist[];
  addArtist: (artist: Artist) => void;
  removeArtist: (artistId: string) => void;
  toggleArtist: (artist: Artist) => void;
  clearArtists: () => void;
}

const OnboardingContext = createContext<OnboardingContextData | undefined>(undefined);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [selectedArtists, setSelectedArtists] = useState<Artist[]>([]);

  const addArtist = (artist: Artist) => {
    setSelectedArtists((prev) => {
      if (prev.some((a) => a.id === artist.id)) return prev;
      return [...prev, artist];
    });
  };

  const removeArtist = (artistId: string) => {
    setSelectedArtists((prev) => prev.filter((a) => a.id !== artistId));
  };

  const toggleArtist = (artist: Artist) => {
    setSelectedArtists((prev) => {
      if (prev.some((a) => a.id === artist.id)) {
        return prev.filter((a) => a.id !== artist.id);
      }
      return [...prev, artist];
    });
  };

  const clearArtists = () => {
    setSelectedArtists([]);
  };

  return (
    <OnboardingContext.Provider
      value={{
        selectedArtists,
        addArtist,
        removeArtist,
        toggleArtist,
        clearArtists
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error("useOnboarding must be used within an OnboardingProvider");
  }
  return context;
}

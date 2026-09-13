import { act, renderHook } from "@testing-library/react-native";
import type { ReactNode } from "react";

import {
  OnboardingProvider,
  useOnboarding
} from "@/features/onboarding/state/OnboardingContext";
import type { MusicSelection } from "@/features/onboarding/types";

const mockArtist1: MusicSelection = {
  id: 1,
  name: "Artist 1",
  imageUrl: "http://example.com/1.jpg"
};

const mockArtist2: MusicSelection = {
  id: 2,
  name: "Artist 2",
  imageUrl: "http://example.com/2.jpg"
};

const mockGenre1: MusicSelection = {
  id: 10,
  name: "Pop"
};

const mockGenre2: MusicSelection = {
  id: 20,
  name: "Rock"
};

describe("OnboardingContext", () => {
  it("throws an error if useOnboarding is used outside of OnboardingProvider", () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() => renderHook(() => useOnboarding())).toThrow(
      "useOnboarding must be used within an OnboardingProvider"
    );
    consoleError.mockRestore();
  });

  it("provides initial empty state for artists and genres", () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <OnboardingProvider>{children}</OnboardingProvider>
    );

    const { result } = renderHook(() => useOnboarding(), { wrapper });

    expect(result.current.selectedArtists).toEqual([]);
    expect(result.current.selectedGenres).toEqual([]);
  });

  it("toggles artists on and off without duplication", () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <OnboardingProvider>{children}</OnboardingProvider>
    );

    const { result } = renderHook(() => useOnboarding(), { wrapper });

    act(() => {
      result.current.toggleArtist(mockArtist1);
    });
    expect(result.current.selectedArtists).toEqual([mockArtist1]);

    act(() => {
      result.current.toggleArtist(mockArtist2);
    });
    expect(result.current.selectedArtists).toEqual([mockArtist1, mockArtist2]);

    act(() => {
      result.current.toggleArtist(mockArtist1);
    });
    expect(result.current.selectedArtists).toEqual([mockArtist2]);
  });

  it("toggles genres on and off without duplication", () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <OnboardingProvider>{children}</OnboardingProvider>
    );

    const { result } = renderHook(() => useOnboarding(), { wrapper });

    act(() => {
      result.current.toggleGenre(mockGenre1);
    });
    expect(result.current.selectedGenres).toEqual([mockGenre1]);

    act(() => {
      result.current.toggleGenre(mockGenre2);
    });
    expect(result.current.selectedGenres).toEqual([mockGenre1, mockGenre2]);

    act(() => {
      result.current.toggleGenre(mockGenre1);
    });
    expect(result.current.selectedGenres).toEqual([mockGenre2]);
  });

  it("clears all artist and genre selections", () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <OnboardingProvider>{children}</OnboardingProvider>
    );

    const { result } = renderHook(() => useOnboarding(), { wrapper });

    act(() => {
      result.current.toggleArtist(mockArtist1);
      result.current.toggleGenre(mockGenre1);
    });
    expect(result.current.selectedArtists).toHaveLength(1);
    expect(result.current.selectedGenres).toHaveLength(1);

    act(() => {
      result.current.clearSelections();
    });
    expect(result.current.selectedArtists).toEqual([]);
    expect(result.current.selectedGenres).toEqual([]);
  });
});

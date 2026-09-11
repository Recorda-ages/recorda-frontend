import React from "react";
import { renderHook, act } from "@testing-library/react-native";
import {
  OnboardingProvider,
  useOnboarding
} from "../../../src/features/onboarding/providers/OnboardingContext";
import { Artist } from "../../../src/types/artist";

const mockArtist: Artist = {
  id: "1",
  name: "Artist 1",
  imageUrl: "http://example.com/1.jpg"
};

const mockArtist2: Artist = {
  id: "2",
  name: "Artist 2",
  imageUrl: "http://example.com/2.jpg"
};

describe("OnboardingContext", () => {
  it("throws an error if useOnboarding is used outside of OnboardingProvider", () => {
    // Suppress console.error for the expected error
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() => renderHook(() => useOnboarding())).toThrow(
      "useOnboarding must be used within an OnboardingProvider"
    );
    consoleError.mockRestore();
  });

  it("provides initial empty state", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <OnboardingProvider>{children}</OnboardingProvider>
    );

    const { result } = renderHook(() => useOnboarding(), { wrapper });

    expect(result.current.selectedArtists).toEqual([]);
  });

  it("adds an artist and ignores duplicates", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <OnboardingProvider>{children}</OnboardingProvider>
    );

    const { result } = renderHook(() => useOnboarding(), { wrapper });

    act(() => {
      result.current.addArtist(mockArtist);
    });
    expect(result.current.selectedArtists).toEqual([mockArtist]);

    // Add same artist again
    act(() => {
      result.current.addArtist(mockArtist);
    });
    // Should not duplicate
    expect(result.current.selectedArtists).toEqual([mockArtist]);
  });

  it("removes an artist", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <OnboardingProvider>{children}</OnboardingProvider>
    );

    const { result } = renderHook(() => useOnboarding(), { wrapper });

    act(() => {
      result.current.addArtist(mockArtist);
      result.current.addArtist(mockArtist2);
    });
    expect(result.current.selectedArtists).toHaveLength(2);

    act(() => {
      result.current.removeArtist(mockArtist.id);
    });
    expect(result.current.selectedArtists).toEqual([mockArtist2]);
  });

  it("toggles an artist", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <OnboardingProvider>{children}</OnboardingProvider>
    );

    const { result } = renderHook(() => useOnboarding(), { wrapper });

    // Toggle on
    act(() => {
      result.current.toggleArtist(mockArtist);
    });
    expect(result.current.selectedArtists).toEqual([mockArtist]);

    // Toggle off
    act(() => {
      result.current.toggleArtist(mockArtist);
    });
    expect(result.current.selectedArtists).toEqual([]);
  });

  it("clears all artists", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <OnboardingProvider>{children}</OnboardingProvider>
    );

    const { result } = renderHook(() => useOnboarding(), { wrapper });

    act(() => {
      result.current.addArtist(mockArtist);
      result.current.addArtist(mockArtist2);
    });
    expect(result.current.selectedArtists).toHaveLength(2);

    act(() => {
      result.current.clearArtists();
    });
    expect(result.current.selectedArtists).toEqual([]);
  });
});

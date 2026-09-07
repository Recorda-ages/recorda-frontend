import { useState } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { I18nextProvider } from "react-i18next";
import { i18n } from "@/i18n";
import { OnboardingMusicScreen } from "@/features/onboarding";
import type { MusicTrack } from "@/features/onboarding";

const tracks: MusicTrack[] = [
  { id: "1", title: "Tempo Perdido", artist: "Legião Urbana" },
  { id: "2", title: "Evidências", artist: "Chitãozinho & Xororó" }
];

function setup(options: { save?: () => Promise<void>; search?: () => Promise<MusicTrack[]> } = {}) {
  const search = jest.fn(options.search ?? (async () => tracks));
  const save = jest.fn(async (_preferences: unknown) => {
    await options.save?.();
  });
  const complete = jest.fn();
  const back = jest.fn();
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false, gcTime: 0 } }
  });
  function Host() {
    const [track, setTrack] = useState<MusicTrack | null>(null);
    return (
      <OnboardingMusicScreen
        selectedTrack={track}
        selectedArtistIds={[10, 20]}
        selectedGenreIds={[30, 40, 50]}
        onSelectTrack={setTrack}
        onBack={back}
        onComplete={complete}
        searchTracks={search}
        savePreferences={save}
      />
    );
  }
  render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={client}>
        <Host />
      </QueryClientProvider>
    </I18nextProvider>
  );
  return { search, save, complete, back };
}

it("starts disabled, debounces search and replaces the single selection before submitting all preferences", async () => {
  const { search, save, complete } = setup();
  expect(screen.getByText("ETAPA 3 DE 3")).toBeTruthy();
  expect(screen.getByRole("button", { name: "Começar a Recordar" })).toBeDisabled();
  expect(search).not.toHaveBeenCalled();
  fireEvent.changeText(screen.getByLabelText("Buscar músicas"), "Tempo");
  fireEvent.changeText(screen.getByLabelText("Buscar músicas"), "Evidências");
  fireEvent.press(await screen.findByRole("radio", { name: "Tempo Perdido, Legião Urbana" }));
  fireEvent.press(screen.getByRole("radio", { name: "Evidências, Chitãozinho & Xororó" }));
  expect(search).toHaveBeenCalledTimes(1);
  expect(search).toHaveBeenCalledWith("Evidências", expect.anything());
  expect(screen.getByRole("radio", { name: "Tempo Perdido, Legião Urbana" })).not.toBeChecked();
  expect(save).not.toHaveBeenCalled();
  fireEvent.press(screen.getByRole("button", { name: "Começar a Recordar" }));
  await waitFor(() => expect(complete).toHaveBeenCalledTimes(1));
  expect(save.mock.calls[0]?.[0]).toEqual({
    artistIds: [10, 20],
    genreIds: [30, 40, 50],
    track: tracks[1]
  });
});

it("preserves selection on failed submission and allows retry without completing early", async () => {
  let rejectSave: (error: Error) => void = () => undefined;
  const { save, complete, back } = setup({
    save: () =>
      new Promise<void>((_, reject) => {
        rejectSave = reject;
      })
  });
  fireEvent.changeText(screen.getByLabelText("Buscar músicas"), "Tempo");
  fireEvent.press(await screen.findByRole("radio", { name: "Tempo Perdido, Legião Urbana" }));
  const button = screen.getByRole("button", { name: "Começar a Recordar" });
  fireEvent.press(button);
  fireEvent.press(button);
  await waitFor(() => expect(save).toHaveBeenCalledTimes(1));
  rejectSave(new Error("offline"));
  expect(await screen.findByRole("alert")).toHaveTextContent(/Suas escolhas foram mantidas/);
  expect(complete).not.toHaveBeenCalled();
  expect(screen.getByRole("radio", { name: "Tempo Perdido, Legião Urbana" })).toBeChecked();
  expect(button).toBeEnabled();
  fireEvent.press(screen.getByRole("button", { name: "Voltar para gêneros" }));
  expect(back).toHaveBeenCalledTimes(1);
});

it("shows a recoverable search error and empty results after retry", async () => {
  let fail = true;
  setup({
    search: async () => {
      if (fail) throw new Error("offline");
      return [];
    }
  });
  fireEvent.changeText(screen.getByLabelText("Buscar músicas"), "missing");
  expect(await screen.findByText("Não foi possível buscar músicas.")).toBeTruthy();
  fail = false;
  fireEvent.press(screen.getByRole("button", { name: "Tentar novamente" }));
  expect(
    await screen.findByText("Nenhuma música encontrada. Tente outro nome ou artista.")
  ).toBeTruthy();
});

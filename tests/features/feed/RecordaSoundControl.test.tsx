import { fireEvent, render, screen } from "@testing-library/react-native";
import { I18nextProvider } from "react-i18next";

import { RecordaSoundControl } from "@/features/feed/components/RecordaSoundControl";
import { FeedAudioProvider } from "@/features/feed/state/FeedAudioContext";
import { i18n } from "@/i18n";

import { resetAudioMock } from "../../mocks/expoAudio";

function renderControl(hasPreview: boolean) {
  return render(
    <I18nextProvider i18n={i18n}>
      <FeedAudioProvider>
        <RecordaSoundControl hasPreview={hasPreview} recordaId="recorda-1" />
      </FeedAudioProvider>
    </I18nextProvider>
  );
}

beforeEach(() => resetAudioMock());

describe("RecordaSoundControl", () => {
  // US16: "Deve existir controle para silenciar/reativar."
  it("toggles between muting and unmuting", () => {
    renderControl(true);

    expect(screen.getByLabelText("Silenciar música")).toBeTruthy();

    fireEvent.press(screen.getByTestId("recorda-sound-toggle-recorda-1"));

    expect(screen.getByLabelText("Reativar música")).toBeTruthy();
  });

  it("reports the muted state to assistive technology", () => {
    renderControl(true);

    fireEvent.press(screen.getByTestId("recorda-sound-toggle-recorda-1"));

    expect(screen.getByTestId("recorda-sound-toggle-recorda-1")).toBeSelected();
  });

  // US16: "Recorda sem preview deve mostrar Fallback Visual."
  it("shows a non-interactive indicator when the Recorda has no preview", () => {
    renderControl(false);

    expect(screen.getByTestId("recorda-sound-unavailable-recorda-1")).toBeTruthy();
    expect(screen.getByLabelText("Esta Recorda não tem prévia de música")).toBeTruthy();
    expect(screen.queryByTestId("recorda-sound-toggle-recorda-1")).toBeNull();
  });
});

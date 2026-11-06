import { render, screen } from "@testing-library/react-native";
import type { ComponentProps } from "react";
import { I18nextProvider } from "react-i18next";

import { StreakBadge, StreakHint } from "@/features/profile/components/StreakBadge";
import { i18n } from "@/i18n";
import { colors } from "@/theme";

type BadgeProfile = ComponentProps<typeof StreakBadge>["profile"];

const OWN: BadgeProfile = {
  can_view_content: true,
  relationship: { follow_id: null, follow_status: "nenhuma", is_self: true },
  streak: { current_days: 12, published_today: true }
};

const THIRD_PARTY: BadgeProfile = {
  can_view_content: true,
  relationship: { follow_id: "follow-1", follow_status: "seguindo", is_self: false },
  streak: { current_days: 12, published_today: true }
};

function renderBadge(profile: BadgeProfile) {
  return render(
    <I18nextProvider i18n={i18n}>
      <StreakBadge profile={profile} />
      <StreakHint profile={profile} />
    </I18nextProvider>
  );
}

const HINTS = ["Publique hoje para começar", "Publique hoje para manter"];

function expectNoBadge() {
  expect(screen.queryByTestId("profile-streak-active")).toBeNull();
  expect(screen.queryByTestId("profile-streak-inactive")).toBeNull();
}

function expectNoHint() {
  expect(screen.queryByTestId("profile-streak-hint")).toBeNull();
  HINTS.forEach((hint) => expect(screen.queryByText(hint)).toBeNull());
}

afterEach(async () => {
  await i18n.changeLanguage("pt-BR");
});

describe("StreakBadge", () => {
  it.each([
    ["own", OWN],
    ["third-party", THIRD_PARTY]
  ])("renders nothing without a streak (%s profile)", (_case, profile) => {
    renderBadge({ ...profile, streak: null });

    expectNoBadge();
    expect(screen.toJSON()).toBeNull();
  });

  describe("own profile", () => {
    it("shows 'Sem sequência' with a discreet style and the hint to start", () => {
      renderBadge({ ...OWN, streak: { current_days: 0, published_today: false } });

      expect(screen.getByText("Sem sequência")).toBeTruthy();
      expect(screen.getByTestId("profile-streak-inactive")).toBeTruthy();
      expect(screen.queryByTestId("profile-streak-active")).toBeNull();
      expect(screen.getByText("Publique hoje para começar")).toBeTruthy();
      expect(screen.getByLabelText("Sequência de publicações: Sem sequência")).toBeTruthy();
    });

    it("shows the active streak without a hint when the user already published today", () => {
      renderBadge(OWN);

      expect(screen.getByText("12 dias de streak")).toBeTruthy();
      expect(screen.getByTestId("profile-streak-active")).toBeTruthy();
      expect(screen.getByLabelText("Sequência de publicações: 12 dias de streak")).toBeTruthy();
      expectNoHint();
    });

    it("asks to publish today to keep an active streak not yet extended today", () => {
      renderBadge({ ...OWN, streak: { current_days: 12, published_today: false } });

      expect(screen.getByText("12 dias de streak")).toBeTruthy();
      expect(screen.getByText("Publique hoje para manter")).toBeTruthy();
      expect(screen.getByLabelText("Sequência de publicações: 12 dias de streak")).toBeTruthy();
      expect(screen.getAllByTestId("profile-streak-active")).toHaveLength(1);
    });

    it("uses the singular for a one-day streak", () => {
      renderBadge({ ...OWN, streak: { current_days: 1, published_today: true } });

      expect(screen.getByText("1 dia de streak")).toBeTruthy();
      expect(screen.queryByText("1 dias de streak")).toBeNull();
    });
  });

  describe("third-party profile", () => {
    it.each([
      ["zeroed", { current_days: 0, published_today: false }, "Sem sequência"],
      ["active, published today", { current_days: 12, published_today: true }, "12 dias de streak"],
      [
        "active, not published today",
        { current_days: 12, published_today: false },
        "12 dias de streak"
      ],
      ["one day", { current_days: 1, published_today: false }, "1 dia de streak"]
    ])("shows the %s streak without publishing hints", (_case, streak, label) => {
      renderBadge({ ...THIRD_PARTY, streak });

      expect(screen.getByText(label)).toBeTruthy();
      expect(screen.getByLabelText(`Sequência de publicações: ${label}`)).toBeTruthy();
      expectNoHint();
    });

    it("hides the streak of a private profile the viewer can't see, even when it is sent", () => {
      renderBadge({
        ...THIRD_PARTY,
        can_view_content: false,
        relationship: { follow_id: null, follow_status: "nenhuma", is_self: false }
      });

      expectNoBadge();
      expectNoHint();
      expect(screen.toJSON()).toBeNull();
    });
  });

  it("draws the active streak on the dark green chip, with a highlighted icon and light text", () => {
    renderBadge(THIRD_PARTY);

    expect(screen.getByTestId("profile-streak-active")).toHaveStyle({
      backgroundColor: colors.primary[800]
    });
    expect(screen.getByText("12 dias de streak")).toHaveStyle({ color: colors.neutrals[100] });
  });

  it("draws the zeroed streak on the regular dark gray chip, with a discreet text", () => {
    renderBadge({ ...THIRD_PARTY, streak: { current_days: 0, published_today: false } });

    expect(screen.getByTestId("profile-streak-inactive")).toHaveStyle({
      backgroundColor: colors.secondary[900]
    });
    expect(screen.getByText("Sem sequência")).toHaveStyle({ color: colors.neutrals[300] });
  });

  it("keeps the label on a single line inside the chip", () => {
    renderBadge({ ...THIRD_PARTY, streak: { current_days: 365, published_today: true } });

    expect(screen.getByText("365 dias de streak").props.numberOfLines).toBe(1);
  });

  it.each([
    ["en", 1, "1-day streak"],
    ["en", 5, "5-day streak"],
    ["es", 1, "1 día de racha"],
    ["es", 5, "5 días de racha"]
  ])("pluralizes in %s (%i)", async (language, days, label) => {
    await i18n.changeLanguage(language);
    renderBadge({ ...THIRD_PARTY, streak: { current_days: days, published_today: true } });

    expect(screen.getByText(label)).toBeTruthy();
  });

  it.each([
    ["en", "No streak", "Post today to start"],
    ["es", "Sin racha", "Publica hoy para empezar"]
  ])("translates the zeroed state and its hint in %s", async (language, label, hint) => {
    await i18n.changeLanguage(language);
    renderBadge({ ...OWN, streak: { current_days: 0, published_today: false } });

    expect(screen.getByText(label)).toBeTruthy();
    expect(screen.getByText(hint)).toBeTruthy();
  });
});

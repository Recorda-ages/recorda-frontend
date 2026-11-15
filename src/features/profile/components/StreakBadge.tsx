import { StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";

import { AppText } from "@/components/ui";
import { colors, spacing } from "@/theme";

import type { ProfileRead, ProfileStreak } from "../types";
import { ProfileInfoChip } from "./ProfileInfoChip";

type StreakProfile = Pick<ProfileRead, "can_view_content" | "relationship" | "streak">;

type StreakProps = Readonly<{ profile: StreakProfile }>;

/**
 * Every visibility rule of the profile's publishing streak (US35, #260), shared by the badge
 * and its hint, so the profile screens pass the `ProfileRead` as it comes:
 *
 * - no streak, or a profile whose content the viewer can't see: nothing. The backend's D-06
 *   (PR #152) exposes the streak even without access; hiding it follows the #260 acceptance
 *   criteria while the team aligns (see docs/issue-260.md).
 * - the publishing hints only show on the own profile.
 */
function visibleStreak(profile: StreakProfile): ProfileStreak | null {
  return profile.can_view_content ? profile.streak : null;
}

/**
 * The single streak indicator: a cell of the ProfileHeader's information grid (pass it as
 * `streakSlot`), shaped like the music chips: dark green while active, the regular dark gray
 * with a discreet icon and label without a streak.
 */
export function StreakBadge({ profile }: StreakProps) {
  const { t } = useTranslation();
  const streak = visibleStreak(profile);

  if (!streak) return null;

  const isActive = streak.current_days > 0;
  const label = isActive
    ? t("profile.streak.days", { count: streak.current_days })
    : t("profile.streak.none");

  return (
    <ProfileInfoChip
      accessibilityLabel={t("profile.streak.a11y", { value: label })}
      icon="fire"
      label={label}
      testID={isActive ? "profile-streak-active" : "profile-streak-inactive"}
      tone={isActive ? "highlight" : "muted"}
    />
  );
}

/**
 * Auxiliary text below the information grid (pass it as `streakHintSlot`). Own profile
 * only: "Publique hoje para começar" without a streak, "Publique hoje para manter" when the
 * active streak wasn't extended today.
 */
export function StreakHint({ profile }: StreakProps) {
  const { t } = useTranslation();
  const streak = visibleStreak(profile);

  if (!streak || !profile.relationship.is_self) return null;

  const hint =
    streak.current_days === 0
      ? t("profile.streak.hintStart")
      : streak.published_today
        ? null
        : t("profile.streak.hintKeep");

  if (!hint) return null;

  return (
    <AppText style={styles.hint} testID="profile-streak-hint" variant="body2">
      {hint}
    </AppText>
  );
}

const styles = StyleSheet.create({
  hint: {
    color: colors.neutrals[300],
    marginTop: spacing[2]
  }
});

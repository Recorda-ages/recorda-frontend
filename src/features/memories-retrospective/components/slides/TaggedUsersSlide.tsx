import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui";

import type { RetrospectiveStory } from "../../storyData";
import { SlideFrame, slideStyles } from "./SlideFrame";

/** Slide 4: os amigos mais marcados nas Recordas do período. */
export function TaggedUsersSlide({
  users
}: Readonly<{ users: RetrospectiveStory["tagged_users"] }>) {
  const { t } = useTranslation();

  return (
    <SlideFrame
      eyebrow={t("retrospective.tagged.eyebrow")}
      subtitle={users.length === 0 ? t("retrospective.tagged.empty") : undefined}
      title={t("retrospective.tagged.title")}
    >
      {users.map((user, index) => (
        <View key={user.user_id} style={[slideStyles.card, slideStyles.row]}>
          <AppText style={slideStyles.value} variant="buttonLarge">
            {index + 1}
          </AppText>
          <AppText style={[slideStyles.white, styles.name]} variant="body1">
            {`@${user.username}`}
          </AppText>
          <AppText style={slideStyles.muted} variant="body2">
            {t("retrospective.tagged.count", { count: user.tags_count })}
          </AppText>
        </View>
      ))}
    </SlideFrame>
  );
}

const styles = StyleSheet.create({
  name: {
    flex: 1
  }
});
